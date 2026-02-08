const jwt = require('jsonwebtoken');

function setupWebSocket(io) {
    // Middleware for WebSocket authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ WebSocket connected: ${socket.id} (User: ${socket.user.email})`);

        // Handle subscription to parking lot updates
        socket.on('subscribe', (data) => {
            const { type, id } = data;

            if (type === 'lot' && id) {
                const room = `lot:${id}`;
                socket.join(room);
                console.log(`📡 ${socket.user.email} subscribed to ${room}`);

                socket.emit('subscribed', {
                    type,
                    id,
                    message: `Subscribed to ${room}`
                });
            }
        });

        // Handle unsubscribe
        socket.on('unsubscribe', (data) => {
            const { type, id } = data;

            if (type === 'lot' && id) {
                const room = `lot:${id}`;
                socket.leave(room);
                console.log(`📡 ${socket.user.email} unsubscribed from ${room}`);

                socket.emit('unsubscribed', {
                    type,
                    id,
                    message: `Unsubscribed from ${room}`
                });
            }
        });

        // Handle ping
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ WebSocket disconnected: ${socket.id} (Reason: ${reason})`);
        });

        socket.on('error', (error) => {
            console.error(`⚠️ WebSocket error: ${socket.id}`, error);
        });
    });

    console.log('🔌 WebSocket server initialized');
}

module.exports = { setupWebSocket };
