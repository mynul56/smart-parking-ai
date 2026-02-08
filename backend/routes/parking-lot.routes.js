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
            trafficCondition: req.body.trafficCondition || 'low', // low, medium, heavy
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

// POST /api/v1/lots/recommend - Get parking recommendations
router.post('/recommend', async (req, res, next) => {
    try {
        const db = getDB();
        const { lat, lng, maxDistance = 5000 } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Location (lat, lng) is required'
            });
        }

        // 1. Find lots within range
        const lots = await db.collection('parking_lots').find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).toArray();

        // 2. Score each lot
        // Lower score is better
        const scoredLots = lots.map(lot => {
            // Distance Score (approx) - We can use the $near output if using aggregate, 
            // but for simple find, we calculate roughly or assume sort order is distance.
            // Let's calculate Euclidean distance for scoring component (deg to km approx)
            const dist = Math.sqrt(
                Math.pow(lot.location.coordinates[1] - lat, 2) +
                Math.pow(lot.location.coordinates[0] - lng, 2)
            ) * 111; // approx km

            // Traffic Penalty
            let trafficPenalty = 0;
            if (lot.trafficCondition === 'heavy') trafficPenalty = 5;
            if (lot.trafficCondition === 'medium') trafficPenalty = 2;

            // Availability Bonus (inverted score)
            const occupancyRate = (lot.totalSlots - lot.availableSlots) / lot.totalSlots;
            const availabilityScore = occupancyRate * 5; // 0 (empty) to 5 (full)

            // Price Score
            const priceScore = (lot.hourlyRate || 5) * 0.5;

            const totalScore = (dist * 2) + trafficPenalty + availabilityScore + priceScore;

            return {
                ...lot,
                score: totalScore,
                distanceKp: dist.toFixed(1)
            };
        });

        // 3. Sort by score
        scoredLots.sort((a, b) => a.score - b.score);

        // 4. Mark best match
        if (scoredLots.length > 0) {
            scoredLots[0].isBestMatch = true;
        }

        res.json({
            success: true,
            data: scoredLots
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
