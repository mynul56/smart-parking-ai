const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/v1/reservations/me - Get current user's reservations
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const db = getDB();
        const { page = 1, limit = 20, status } = req.query;

        let query = { userId: new ObjectId(req.user.id) };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reservations, total] = await Promise.all([
            db.collection('reservations')
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
            db.collection('reservations').countDocuments(query)
        ]);

        res.json({
            success: true,
            data: reservations,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/reservations - Create reservation
router.post('/', authenticate, async (req, res, next) => {
    try {
        const db = getDB();
        const { slotId, startTime, endTime } = req.body;

        if (!slotId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'slotId, startTime, and endTime are required'
            });
        }

        // Check if slot exists and is available
        const slot = await db.collection('parking_slots').findOne({
            _id: new ObjectId(slotId)
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        if (slot.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Parking slot is not available'
            });
        }

        // Check for conflicting reservations
        const conflict = await db.collection('reservations').findOne({
            slotId: new ObjectId(slotId),
            status: { $in: ['confirmed', 'active'] },
            $or: [
                {
                    startTime: { $lte: new Date(endTime) },
                    endTime: { $gte: new Date(startTime) }
                }
            ]
        });

        if (conflict) {
            return res.status(400).json({
                success: false,
                message: 'Slot already reserved for this time period'
            });
        }

        // Calculate price (simplified)
        const lot = await db.collection('parking_lots').findOne({
            _id: slot.lotId
        });
        const hours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
        const price = hours * (lot?.pricing?.hourlyRate || 3.0);

        // Create reservation
        const newReservation = {
            userId: new ObjectId(req.user.id),
            slotId: new ObjectId(slotId),
            lotId: slot.lotId,
            status: 'confirmed',
            reservationTime: new Date(),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            price,
            currency: lot?.pricing?.currency || 'USD',
            paymentStatus: 'pending',
            qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('reservations').insertOne(newReservation);
        newReservation._id = result.insertedId;

        // Update slot status
        await db.collection('parking_slots').updateOne(
            { _id: new ObjectId(slotId) },
            { $set: { status: 'reserved', updatedAt: new Date() } }
        );

        // Broadcast slot update
        const io = req.app.get('io');
        if (io) {
            io.to(`lot:${slot.lotId}`).emit('slot:updated', {
                type: 'slot.status_changed',
                slotId: slot._id,
                lotId: slot.lotId,
                updates: { status: 'reserved' },
                timestamp: new Date().toISOString()
            });
        }

        res.status(201).json({
            success: true,
            data: newReservation
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/reservations/:id - Cancel reservation
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const db = getDB();

        const reservation = await db.collection('reservations').findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.user.id)
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.status === 'completed' || reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel this reservation'
            });
        }

        // Update reservation status
        await db.collection('reservations').updateOne(
            { _id: reservation._id },
            {
                $set: {
                    status: 'cancelled',
                    updatedAt: new Date()
                }
            }
        );

        // Free up the slot
        await db.collection('parking_slots').updateOne(
            { _id: reservation.slotId },
            { $set: { status: 'available', updatedAt: new Date() } }
        );

        // Broadcast slot update
        const io = req.app.get('io');
        if (io) {
            io.to(`lot:${reservation.lotId}`).emit('slot:updated', {
                type: 'slot.status_changed',
                slotId: reservation.slotId,
                lotId: reservation.lotId,
                updates: { status: 'available' },
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
