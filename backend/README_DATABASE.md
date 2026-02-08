# MongoDB Database Setup Guide
## Smart Car Parking Platform

## 📋 Overview

This database schema supports the AI-Based Smart Car Parking Platform with:
- **6 Collections** with validation schemas
- **24 Indexes** for optimized queries
- **Geospatial indexing** for location-based searches
- **TTL indexes** for automatic log cleanup
- **Production-ready** validation rules

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Your `.env` file is already configured with MongoDB Atlas credentials:
```
MONGODB_URI=mongodb+srv://mynulislamtanim_db_user:***@cluster0.5sz7vgp.mongodb.net/
MONGODB_DB_NAME=smart_parking_db
```

### 3. Setup Database
```bash
npm run setup-db
```

This creates all collections, validation schemas, and indexes.

### 4. Seed Sample Data
```bash
npm run seed-db
```

This adds realistic test data for development.

---

## 📊 Database Schema

### Collections

#### 1. **parking_lots**
Stores parking facility information with geospatial data.

**Key Fields:**
- `name`: Parking lot name
- `location`: GeoJSON Point (for proximity queries)
- `address`: Physical address
- `totalSlots`, `availableSlots`: Capacity tracking
- `zones`: Array of parking zones
- `pricing`: Hourly rates

**Indexes:**
- `location_2dsphere`: Geospatial index for nearby searches
- `status_index`: Filter by operational status

---

#### 2. **parking_slots**
Individual parking slot status with AI detection data.

**Key Fields:**
- `lotId`: Reference to parking lot
- `slotNumber`: Unique identifier (e.g., "A-012")
- `status`: `available | occupied | reserved | maintenance`
- `confidence`: AI detection confidence (0.0-1.0)
- `polygon`: Visual coordinates for UI mapping
- `vehicleEntry`: Current vehicle information

**Indexes:**
- `lot_status_compound`: Fast queries by lot and status
- `slot_lot_unique`: Unique constraint on (slotNumber, lotId)
- `confidence_index`: Filter low-confidence detections

---

#### 3. **reservations**
User parking reservations and payment tracking.

**Key Fields:**
- `userId`, `slotId`, `lotId`: References
- `status`: `pending | confirmed | active | completed | cancelled`
- `startTime`, `endTime`: Reservation window
- `price`, `paymentStatus`: Payment tracking
- `qrCode`: Entry code

**Indexes:**
- `user_reservations`: User's booking history
- `slot_active_reservations`: Prevent double-booking
- `time_range_index`: Query by date range

---

#### 4. **vehicle_entries**
Vehicle entry/exit logs with AI detection metadata.

**Key Fields:**
- `licensePlate`: Vehicle identification
- `vehicleType`: `car | motorcycle | truck | ev`
- `entryTime`, `exitTime`: Timestamps
- `entryConfidence`, `exitConfidence`: AI accuracy
- `duration`: Parking duration in minutes

**Indexes:**
- `user_entries`: User's parking history
- `license_plate_index`: Search by plate number

---

#### 5. **users**
User accounts with role-based access control.

**Key Fields:**
- `email`: Unique identifier
- `passwordHash`: Bcrypt hashed password
- `role`: `admin | staff | user`
- `assignedLotId`: Staff assignment (optional)
- `profile`: User preferences and vehicle info
- `fcmToken`: Push notification token

**Indexes:**
- `email_unique`: Unique constraint
- `role_index`: Filter by role

---

#### 6. **ai_event_logs**
AI detection events with 30-day retention.

**Key Fields:**
- `eventType`: `detection | status_change | anomaly`
- `confidence`: AI confidence score
- `modelVersion`: AI model identifier
- `isAnomaly`: Low-confidence flag
- `timestamp`: Event time

**Indexes:**
- `slot_events`: Slot history timeline
- `anomalies_index`: Filter flagged events
- `ttl_index`: **Auto-delete after 30 days**

---

## 🔍 Query Examples

### Find Nearby Parking Lots
```javascript
db.parking_lots.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-122.4194, 37.7749]
      },
      $maxDistance: 5000 // 5km radius
    }
  },
  status: "active"
})
```

### Get Available Slots for a Lot
```javascript
db.parking_slots.find({
  lotId: ObjectId("..."),
  status: "available",
  confidence: { $gte: 0.9 }
}).sort({ slotNumber: 1 })
```

### Active Reservations for a User
```javascript
db.reservations.find({
  userId: ObjectId("..."),
  status: { $in: ["confirmed", "active"] }
}).sort({ startTime: -1 })
```

### Recent AI Anomalies
```javascript
db.ai_event_logs.find({
  isAnomaly: true,
  timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
}).sort({ timestamp: -1 })
```

---

## 🔐 Test Credentials

Sample users created by seed script:

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Admin | admin@parking.com  | password123 |
| Staff | staff@parking.com  | password123 |
| User  | user@parking.com   | password123 |

---

## 📈 Performance Optimization

### Indexes Strategy
- **Compound indexes** for common query patterns
- **Geospatial index** for location searches
- **TTL index** for automatic log cleanup (30 days)
- **Unique indexes** to prevent duplicates

### Best Practices
1. **Always query with indexed fields** for fast performance
2. **Use projection** to limit returned fields
3. **Paginate large result sets** with `skip()` and `limit()`
4. **Monitor slow queries** with MongoDB Atlas Performance Advisor

---

## 🔧 Maintenance

### View Collection Stats
```javascript
db.parking_slots.stats()
```

### Rebuild Indexes
```javascript
db.parking_slots.reIndex()
```

### Check Index Usage
```javascript
db.parking_slots.aggregate([
  { $indexStats: {} }
])
```

---

## 🚨 Troubleshooting

### Connection Issues
- Verify MongoDB Atlas IP whitelist (add `0.0.0.0/0` for testing)
- Check credentials in `.env`
- Ensure network access from your location

### Validation Errors
- Review schema validation rules in `setup-database.js`
- Use MongoDB Compass to inspect documents
- Check error messages for constraint violations

### Slow Queries
- Run `.explain()` on slow queries
- Add missing indexes
- Use aggregation pipelines for complex queries

---

## 📚 Next Steps

1. ✅ Database setup complete
2. ✅ Sample data seeded
3. ⏭️ Build Express API routes
4. ⏭️ Implement WebSocket server
5. ⏭️ Connect frontend applications

---

**Database is now ready for API development!** 🎉
