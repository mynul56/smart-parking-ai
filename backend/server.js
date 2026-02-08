const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const config = require('./config/environment');
const { connectDB } = require('./config/database');
const { securityHeaders, requestLogger } = require('./middleware/security.middleware');
const { sanitizeInputs, rateLimit } = require('./middleware/validation.middleware');

const authRoutes = require('./routes/auth.routes');
const parkingLotRoutes = require('./routes/parking-lot.routes');
const parkingSlotRoutes = require('./routes/parking-slot.routes');
const reservationRoutes = require('./routes/reservation.routes');
const userRoutes = require('./routes/user.routes');
const aiEventRoutes = require('./routes/ai-event.routes');

const { errorHandler } = require('./middleware/error.middleware');
const { setupWebSocket } = require('./websocket/server');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
    }
});

// Make io accessible to our router
app.set('io', io);

// Security & Middleware
app.use(securityHeaders);
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);
app.use(requestLogger);
app.use(rateLimit(config.rateLimit.windowMs, config.rateLimit.max));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lots', parkingLotRoutes);
app.use('/api/v1/slots', parkingSlotRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai-events', aiEventRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// WebSocket setup
setupWebSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start HTTP server
        server.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log('🚀 Smart Parking API Server');
            console.log('='.repeat(50));
            console.log(`📡 REST API:    http://localhost:${PORT}`);
            console.log(`🔌 WebSocket:   ws://localhost:${PORT}`);
            console.log(`💾 Database:    ${process.env.MONGODB_DB_NAME}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = { app, server, io };
