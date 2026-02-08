require('dotenv').config();

// Environment variable validation
const requiredEnvVars = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
}

// Validate MongoDB URI format
if (!process.env.MONGODB_URI.startsWith('mongodb')) {
    console.error('❌ Invalid MONGODB_URI format');
    process.exit(1);
}

// Configuration
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),

    mongodb: {
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME,
        options: {
            maxPoolSize: 50,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        },
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    cors: {
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
    },

    rateLimit: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 1000, // limit each IP to 1000 requests per windowMs
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};

// Log configuration (excluding secrets)
if (config.env === 'development') {
    console.log('⚙️  Configuration loaded:');
    console.log(`  Environment: ${config.env}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Database: ${config.mongodb.dbName}`);
    console.log(`  JWT Expiry: ${config.jwt.expiresIn}`);
}

module.exports = config;
