const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/v1/ai-events - Get AI event logs
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const db = getDB();
        const { lotId, slotId, eventType, isAnomaly, page = 1, limit = 50 } = req.query;

        let query = {};
        if (lotId) query.lotId = new ObjectId(lotId);
        if (slotId) query.slotId = new ObjectId(slotId);
        if (eventType) query.eventType = eventType;
        if (isAnomaly !== undefined) query.isAnomaly = isAnomaly === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [events, total] = await Promise.all([
            db.collection('ai_event_logs')
                .find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
            db.collection('ai_event_logs').countDocuments(query)
        ]);

        res.json({
            success: true,
            data: events,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
