const helmet = require('helmet');

// Security headers configuration
function securityHeaders(req, res, next) {
    // Helmet would be better, but manual for now
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.removeHeader('X-Powered-By');
    next();
}

// Request logging
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
        };

        if (res.statusCode >= 400) {
            console.error('❌ Request Error:', JSON.stringify(log));
        } else if (duration > 1000) {
            console.warn('⚠️  Slow Request:', JSON.stringify(log));
        }
    });

    next();
}

// API key validation (for external services)
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required',
        });
    }

    // In production, validate against database
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validKeys.includes(apiKey)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid API key',
        });
    }

    next();
}

module.exports = {
    securityHeaders,
    requestLogger,
    validateApiKey,
};
