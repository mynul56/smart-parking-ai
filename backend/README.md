# Smart Car Parking Platform - Backend API

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Your `.env` file is already configured with MongoDB credentials.

### 3. Database Setup
```bash
# Create collections and indexes
npm run setup-db

# Seed sample data
npm run seed-db
```

### 4. Start Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will run on:
- **REST API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f9a...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@parking.com",
  "password": "password123"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🅿️ Parking Lot Endpoints

### Get Nearby Parking Lots
```http
GET /api/v1/lots?lat=37.7749&lng=-122.4194&radius=5000
```

**Query Parameters:**
- `lat`: Latitude (optional)
- `lng`: Longitude (optional)
- `radius`: Search radius in meters (default: 5000)
- `status`: Filter by status (`active`, `maintenance`, `closed`)

### Get Single Parking Lot
```http
GET /api/v1/lots/:id
```

### Get Slots for a Lot
```http
GET /api/v1/lots/:lotId/slots?status=available&minConfidence=0.9
```

**Query Parameters:**
- `status`: Filter by status (`available`, `occupied`, `reserved`, `maintenance`)
- `minConfidence`: Minimum AI confidence (0.0-1.0)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 100)

### Create Parking Lot (Admin Only)
```http
POST /api/v1/lots
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "New Parking Lot",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "address": "123 Street Name",
  "totalSlots": 100,
  "availableSlots": 100,
  "pricing": {
    "hourlyRate": 3.0,
    "currency": "USD"
  },
  "status": "active"
}
```

---

## 🚗 Parking Slot Endpoints

### Get Single Slot
```http
GET /api/v1/slots/:id
```

### Update Slot Status (Admin/Staff Only)
```http
PUT /api/v1/slots/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "occupied",
  "confidence": 0.95,
  "vehicleEntry": {
    "vehicleId": "64f9a...",
    "entryTime": "2026-02-08T10:00:00Z",
    "licensePlate": "ABC-1234"
  }
}
```

---

## 📅 Reservation Endpoints

### Get My Reservations
```http
GET /api/v1/reservations/me?status=confirmed
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

### Create Reservation
```http
POST /api/v1/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "slotId": "64f9a...",
  "startTime": "2026-02-08T14:00:00Z",
  "endTime": "2026-02-08T16:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f9b...",
    "userId": "64f9a...",
    "slotId": "64f9a...",
    "status": "confirmed",
    "price": 6.0,
    "qrCode": "QR_1707389234_x7h3k9",
    "createdAt": "2026-02-08T10:20:34Z"
  }
}
```

### Cancel Reservation
```http
DELETE /api/v1/reservations/:id
Authorization: Bearer <token>
```

---

## 👤 User Endpoints

### Get My Profile
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

### Update My Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890",
  "profile": {
    "vehicleInfo": {
      "licensePlate": "XYZ-5678",
      "vehicleType": "car"
    }
  }
}
```

### Get All Users (Admin Only)
```http
GET /api/v1/users?role=user&page=1&limit=20
Authorization: Bearer <admin-token>
```

---

## 🤖 AI Event Log Endpoints

### Get AI Events (Admin/Staff Only)
```http
GET /api/v1/ai-events?lotId=64f9a...&isAnomaly=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `lotId`: Filter by parking lot
- `slotId`: Filter by specific slot
- `eventType`: `detection`, `status_change`, `anomaly`
- `isAnomaly`: true/false
- `page`: Page number
- `limit`: Results per page

---

## 🔌 WebSocket Events

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Subscribe to Parking Lot Updates
```javascript
socket.emit('subscribe', { 
  type: 'lot', 
  id: '64f9a...' 
});

socket.on('subscribed', (data) => {
  console.log('Subscribed:', data);
});
```

### Listen for Slot Updates
```javascript
socket.on('slot:updated', (event) => {
  console.log('Slot updated:', event);
  // {
  //   type: 'slot.status_changed',
  //   slotId: '64f9a...',
  //   lotId: '64f9b...',
  //   updates: { status: 'occupied' },
  //   timestamp: '2026-02-08T10:25:00Z'
  // }
});
```

### Unsubscribe
```javascript
socket.emit('unsubscribe', { 
  type: 'lot', 
  id: '64f9a...' 
});
```

---

## 🧪 Testing

### Test Credentials
```
Admin:  admin@parking.com  / password123
Staff:  staff@parking.com  / password123
User:   user@parking.com   / password123
```

### Example: Login and Get Reservations
```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@parking.com","password":"password123"}'

# 2. Get reservations (use token from login response)
curl http://localhost:3000/api/v1/reservations/me \
  -H "Authorization: Bearer <your-token>"
```

---

## 📊 Database Collections

- `parking_lots` - Parking facility information
- `parking_slots` - Individual parking slots (200 sample slots)
- `reservations` - User reservations
- `vehicle_entries` - Entry/exit logs
- `users` - User accounts
- `ai_event_logs` - AI detection events (30-day TTL)

---

## 🛡️ Role-Based Access Control

| Endpoint | Public | User | Staff | Admin |
|----------|--------|------|-------|-------|
| GET /lots | ✅ | ✅ | ✅ | ✅ |
| POST /lots | ❌ | ❌ | ❌ | ✅ |
| GET /reservations/me | ❌ | ✅ | ✅ | ✅ |
| POST /reservations | ❌ | ✅ | ✅ | ✅ |
| PUT /slots/:id | ❌ | ❌ | ✅ | ✅ |
| GET /ai-events | ❌ | ❌ | ✅ | ✅ |
| GET /users | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=smart_parking_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

---

## 🚀 Production Deployment

### Recommended Stack
- **Hosting**: AWS EC2, DigitalOcean, Heroku
- **Database**: MongoDB Atlas (already configured)
- **Load Balancer**: nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name parking-api
pm2 save
pm2 startup
```

---

## 📝 Next Steps

1. ✅ Backend API running
2. ⏭️ Build Next.js frontend dashboard
3. ⏭️ Build Flutter mobile app
4. ⏭️ Deploy to production
5. ⏭️ Implement AI detection service integration

**Your backend is production-ready!** 🎉
