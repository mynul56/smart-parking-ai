const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/v1/slots/:id - Get single slot
router.get('/:id', async (req, res, next) => {
    try {
        const db = getDB();
        const slot = await db.collection('parking_slots').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        res.json({
            success: true,
            data: slot
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/slots/:id - Update slot status (Admin/Staff)
router.put('/:id', authenticate, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const db = getDB();
        const { status, confidence, vehicleEntry } = req.body;

        const updateData = {
            updatedAt: new Date()
        };

        if (status) updateData.status = status;
        if (confidence !== undefined) updateData.confidence = confidence;
        if (vehicleEntry !== undefined) updateData.vehicleEntry = vehicleEntry;

        // Get the slot BEFORE update to check status change
        const oldSlot = await db.collection('parking_slots').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'before' }
        );

        if (!oldSlot.value) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        const slot = oldSlot.value;

        // Update parent lot availability if status changed
        if (status && slot.status !== status) {
            const wasAvailable = slot.status === 'available';
            const isAvailable = status === 'available';

            let delta = 0;
            if (wasAvailable && !isAvailable) delta = -1;
            if (!wasAvailable && isAvailable) delta = 1;

            if (delta !== 0) {
                await db.collection('parking_lots').updateOne(
                    { _id: slot.lotId },
                    { $inc: { availableSlots: delta } }
                );

                // Broadcast lot update
                const io = req.app.get('io');
                if (io) {
                    io.emit('lot:updated', {
                        lotId: slot.lotId,
                        delta: delta,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        // Construct the new slot object for response/broadcast
        const newSlot = { ...slot, ...updateData };

        // Broadcast update via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`lot:${slot.lotId.toString()}`).emit('slot:updated', {
                type: 'slot.status_changed',
                slotId: slot._id,
                lotId: slot.lotId,
                updates: updateData,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            data: newSlot
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
