const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/v1/users/me - Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { passwordHash: 0, refreshToken: 0 } }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/users/me - Update current user profile
router.put('/me', authenticate, async (req, res, next) => {
    try {
        const db = getDB();
        const { name, phone, profile } = req.body;

        const updateData = { updatedAt: new Date() };
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (profile) updateData.profile = profile;

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(req.user.id) },
            { $set: updateData },
            {
                returnDocument: 'after',
                projection: { passwordHash: 0, refreshToken: 0 }
            }
        );

        res.json({
            success: true,
            data: result.value
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/users - Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const db = getDB();
        const { role, page = 1, limit = 20 } = req.query;

        let query = {};
        if (role) query.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            db.collection('users')
                .find(query, { projection: { passwordHash: 0, refreshToken: 0 } })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
            db.collection('users').countDocuments(query)
        ]);

        res.json({
            success: true,
            data: users,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
