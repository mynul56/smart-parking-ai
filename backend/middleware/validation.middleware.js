const { ObjectId } = require('mongodb');

// Validation schemas
const validationSchemas = {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    objectId: (value) => ObjectId.isValid(value),
    phone: (value) => !value || /^\+?[\d\s-()]+$/.test(value),
    status: (value) => ['available', 'occupied', 'reserved', 'maintenance'].includes(value),
    role: (value) => ['admin', 'staff', 'user'].includes(value),
};

// Sanitize input
function sanitize(input) {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    if (typeof input === 'object' && input !== null) {
        return Object.keys(input).reduce((acc, key) => {
            acc[key] = sanitize(input[key]);
            return acc;
        }, Array.isArray(input) ? [] : {});
    }
    return input;
}

// Validate registration
function validateRegistration(req, res, next) {
    const { email, password, name } = req.body;

    if (!email || !validationSchemas.email(email)) {
        return res.status(400).json({
            success: false,
            message: 'Valid email is required',
        });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters',
        });
    }

    if (!name || name.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Name must be at least 2 characters',
        });
    }

    // Sanitize inputs
    req.body = sanitize(req.body);
    next();
}

// Validate ObjectId params
function validateObjectId(paramName = 'id') {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!validationSchemas.objectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`,
            });
        }

        next();
    };
}

// Sanitize all inputs
function sanitizeInputs(req, res, next) {
    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }
    next();
}

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map();

function rateLimit(windowMs = 60000, maxRequests = 100) {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, []);
        }

        const requests = rateLimitStore.get(key).filter(time => now - time < windowMs);

        if (requests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
            });
        }

        requests.push(now);
        rateLimitStore.set(key, requests);

        next();
    };
}

module.exports = {
    validateRegistration,
    validateObjectId,
    sanitizeInputs,
    rateLimit,
    validationSchemas,
};
