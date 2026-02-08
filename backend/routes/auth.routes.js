const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

const router = express.Router();

// Generate JWT Token
function generateToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
}

// Generate Refresh Token
function generateRefreshToken(user) {
    return jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
}

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name, phone, role = 'user' } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        const db = getDB();

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            email,
            passwordHash,
            name,
            phone: phone || null,
            role: role === 'admin' || role === 'staff' ? 'user' : role, // Prevent self-assignment of admin/staff
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);
        newUser._id = result.insertedId;

        // Generate tokens
        const token = generateToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        // Save refresh token
        await db.collection('users').updateOne(
            { _id: newUser._id },
            { $set: { refreshToken } }
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
    try {
        let { email, password } = req.body;

        if (email) email = email.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const db = getDB();

        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is disabled'
            });
        }

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { refreshToken, updatedAt: new Date() } }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const db = getDB();
        const user = await db.collection('users').findOne({
            _id: new ObjectId(decoded.id),
            refreshToken
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const newToken = generateToken(user);

        res.json({
            success: true,
            data: { token: newToken }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
