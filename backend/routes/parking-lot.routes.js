const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/v1/lots - Get all parking lots
router.get('/', async (req, res, next) => {
    try {
        const db = getDB();
        const { lat, lng, radius, status } = req.query;

        let query = {};

        // Geospatial query for nearby lots
        if (lat && lng) {
            const maxDistance = parseInt(radius) || 5000; // Default 5km
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistance
                }
            };
        }

        if (status) {
            query.status = status;
        }

        const lots = await db.collection('parking_lots')
            .find(query)
            .toArray();

        res.json({
            success: true,
            data: lots,
            total: lots.length
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/lots/:id - Get single parking lot
router.get('/:id', async (req, res, next) => {
    try {
        const db = getDB();
        const lot = await db.collection('parking_lots').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!lot) {
            return res.status(404).json({
                success: false,
                message: 'Parking lot not found'
            });
        }

        res.json({
            success: true,
            data: lot
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/lots/:lotId/slots - Get slots for a parking lot
router.get('/:lotId/slots', async (req, res, next) => {
    try {
        const db = getDB();
        const { status, minConfidence, page = 1, limit = 100 } = req.query;

        let query = { lotId: new ObjectId(req.params.lotId) };

        if (status) {
            query.status = status;
        }

        if (minConfidence) {
            query.confidence = { $gte: parseFloat(minConfidence) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [slots, total] = await Promise.all([
            db.collection('parking_slots')
                .find(query)
                .sort({ slotNumber: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
            db.collection('parking_slots').countDocuments(query)
        ]);

        res.json({
            success: true,
            data: slots,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/lots - Create parking lot (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const db = getDB();
        const newLot = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('parking_lots').insertOne(newLot);
        newLot._id = result.insertedId;

        res.status(201).json({
            success: true,
            data: newLot
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/lots/:id - Update parking lot (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const db = getDB();
        const { _id, createdAt, ...updateData } = req.body;

        updateData.updatedAt = new Date();

        const result = await db.collection('parking_lots').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(404).json({
                success: false,
                message: 'Parking lot not found'
            });
        }

        res.json({
            success: true,
            data: result.value
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
