#!/usr/bin/env node

/**
 * MongoDB Database Setup Script
 * Creates collections, validation rules, and indexes for Smart Parking Platform
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'smart_parking_db';

async function setupDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(dbName);
    console.log(`📦 Using database: ${dbName}`);

    // ========================================
    // 1. PARKING LOTS COLLECTION
    // ========================================
    console.log('\n📍 Creating ParkingLots collection...');
    
    await db.createCollection('parking_lots', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'location', 'address', 'totalSlots', 'availableSlots'],
          properties: {
            name: { bsonType: 'string', description: 'Parking lot name' },
            location: {
              bsonType: 'object',
              required: ['type', 'coordinates'],
              properties: {
                type: { enum: ['Point'] },
                coordinates: {
                  bsonType: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: { bsonType: 'double' }
                }
              }
            },
            address: { bsonType: 'string' },
            totalSlots: { bsonType: 'int', minimum: 0 },
            availableSlots: { bsonType: 'int', minimum: 0 },
            zones: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['name', 'slotIds'],
                properties: {
                  name: { bsonType: 'string' },
                  slotIds: { bsonType: 'array', items: { bsonType: 'objectId' } }
                }
              }
            },
            pricing: {
              bsonType: 'object',
              properties: {
                hourlyRate: { bsonType: 'double', minimum: 0 },
                currency: { bsonType: 'string', enum: ['USD', 'EUR', 'BDT'] }
              }
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'maintenance', 'closed']
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for parking_lots
    await db.collection('parking_lots').createIndexes([
      { key: { location: '2dsphere' }, name: 'location_2dsphere' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { createdAt: -1 }, name: 'created_date_index' }
    ]);

    console.log('✅ ParkingLots collection created with indexes');

    // ========================================
    // 2. PARKING SLOTS COLLECTION
    // ========================================
    console.log('\n🅿️  Creating ParkingSlots collection...');
    
    await db.createCollection('parking_slots', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['lotId', 'slotNumber', 'status', 'confidence'],
          properties: {
            lotId: { bsonType: 'objectId' },
            zoneId: { bsonType: 'string' },
            slotNumber: { bsonType: 'string' },
            status: {
              bsonType: 'string',
              enum: ['available', 'occupied', 'reserved', 'maintenance']
            },
            confidence: {
              bsonType: 'double',
              minimum: 0.0,
              maximum: 1.0
            },
            lastDetectedAt: { bsonType: 'date' },
            aiModelVersion: { bsonType: 'string' },
            polygon: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['x', 'y'],
                properties: {
                  x: { bsonType: 'double' },
                  y: { bsonType: 'double' }
                }
              }
            },
            vehicleEntry: {
              bsonType: 'object',
              properties: {
                vehicleId: { bsonType: 'objectId' },
                entryTime: { bsonType: 'date' },
                licensePlate: { bsonType: 'string' }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for parking_slots
    await db.collection('parking_slots').createIndexes([
      { key: { lotId: 1, status: 1 }, name: 'lot_status_compound' },
      { key: { slotNumber: 1, lotId: 1 }, name: 'slot_lot_unique', unique: true },
      { key: { status: 1 }, name: 'status_index' },
      { key: { confidence: 1 }, name: 'confidence_index' },
      { key: { updatedAt: -1 }, name: 'updated_date_index' }
    ]);

    console.log('✅ ParkingSlots collection created with indexes');

    // ========================================
    // 3. RESERVATIONS COLLECTION
    // ========================================
    console.log('\n📅 Creating Reservations collection...');
    
    await db.createCollection('reservations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'slotId', 'lotId', 'status', 'startTime', 'endTime'],
          properties: {
            userId: { bsonType: 'objectId' },
            slotId: { bsonType: 'objectId' },
            lotId: { bsonType: 'objectId' },
            status: {
              bsonType: 'string',
              enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled']
            },
            reservationTime: { bsonType: 'date' },
            startTime: { bsonType: 'date' },
            endTime: { bsonType: 'date' },
            price: { bsonType: 'double', minimum: 0 },
            currency: { bsonType: 'string' },
            paymentStatus: {
              bsonType: 'string',
              enum: ['pending', 'paid', 'refunded']
            },
            paymentIntentId: { bsonType: 'string' },
            qrCode: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for reservations
    await db.collection('reservations').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'user_reservations' },
      { key: { slotId: 1, status: 1 }, name: 'slot_active_reservations' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { startTime: 1, endTime: 1 }, name: 'time_range_index' },
      { key: { createdAt: -1 }, name: 'created_date_index' }
    ]);

    console.log('✅ Reservations collection created with indexes');

    // ========================================
    // 4. VEHICLE ENTRIES COLLECTION
    // ========================================
    console.log('\n🚗 Creating VehicleEntries collection...');
    
    await db.createCollection('vehicle_entries', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'slotId', 'lotId', 'licensePlate', 'entryTime'],
          properties: {
            userId: { bsonType: 'objectId' },
            slotId: { bsonType: 'objectId' },
            lotId: { bsonType: 'objectId' },
            reservationId: { bsonType: 'objectId' },
            licensePlate: { bsonType: 'string' },
            vehicleType: {
              bsonType: 'string',
              enum: ['car', 'motorcycle', 'truck', 'ev']
            },
            entryTime: { bsonType: 'date' },
            exitTime: { bsonType: 'date' },
            duration: { bsonType: 'int', minimum: 0 },
            entryConfidence: { bsonType: 'double', minimum: 0, maximum: 1 },
            exitConfidence: { bsonType: 'double', minimum: 0, maximum: 1 },
            entryImageUrl: { bsonType: 'string' },
            exitImageUrl: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for vehicle_entries
    await db.collection('vehicle_entries').createIndexes([
      { key: { userId: 1, entryTime: -1 }, name: 'user_entries' },
      { key: { slotId: 1, exitTime: 1 }, name: 'active_vehicles' },
      { key: { licensePlate: 1 }, name: 'license_plate_index' },
      { key: { entryTime: -1 }, name: 'entry_time_index' }
    ]);

    console.log('✅ VehicleEntries collection created with indexes');

    // ========================================
    // 5. USERS COLLECTION
    // ========================================
    console.log('\n👤 Creating Users collection...');
    
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'passwordHash', 'role'],
          properties: {
            email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
            passwordHash: { bsonType: 'string' },
            name: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            role: {
              bsonType: 'string',
              enum: ['admin', 'staff', 'user']
            },
            assignedLotId: { bsonType: 'objectId' },
            profile: {
              bsonType: 'object',
              properties: {
                vehicleInfo: {
                  bsonType: 'object',
                  properties: {
                    licensePlate: { bsonType: 'string' },
                    vehicleType: { bsonType: 'string' }
                  }
                },
                paymentMethods: { bsonType: 'array' }
              }
            },
            refreshToken: { bsonType: 'string' },
            fcmToken: { bsonType: 'string' },
            isActive: { bsonType: 'bool' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for users
    await db.collection('users').createIndexes([
      { key: { email: 1 }, name: 'email_unique', unique: true },
      { key: { role: 1 }, name: 'role_index' },
      { key: { assignedLotId: 1 }, name: 'assigned_lot_index' }
    ]);

    console.log('✅ Users collection created with indexes');

    // ========================================
    // 6. AI EVENT LOGS COLLECTION
    // ========================================
    console.log('\n🤖 Creating AIEventLogs collection...');
    
    await db.createCollection('ai_event_logs', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['slotId', 'lotId', 'eventType', 'newStatus', 'confidence'],
          properties: {
            slotId: { bsonType: 'objectId' },
            lotId: { bsonType: 'objectId' },
            eventType: {
              bsonType: 'string',
              enum: ['detection', 'status_change', 'anomaly']
            },
            previousStatus: { bsonType: 'string' },
            newStatus: {
              bsonType: 'string',
              enum: ['available', 'occupied', 'reserved', 'maintenance']
            },
            confidence: { bsonType: 'double', minimum: 0, maximum: 1 },
            modelVersion: { bsonType: 'string' },
            processingTimeMs: { bsonType: 'int', minimum: 0 },
            imageUrl: { bsonType: 'string' },
            isAnomaly: { bsonType: 'bool' },
            anomalyReason: { bsonType: 'string' },
            timestamp: { bsonType: 'date' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes for ai_event_logs
    await db.collection('ai_event_logs').createIndexes([
      { key: { slotId: 1, timestamp: -1 }, name: 'slot_events' },
      { key: { lotId: 1, timestamp: -1 }, name: 'lot_events' },
      { key: { eventType: 1 }, name: 'event_type_index' },
      { key: { isAnomaly: 1, timestamp: -1 }, name: 'anomalies_index' },
      { key: { timestamp: -1 }, name: 'timestamp_index' },
      { key: { createdAt: 1 }, name: 'ttl_index', expireAfterSeconds: 2592000 } // 30 days TTL
    ]);

    console.log('✅ AIEventLogs collection created with indexes (30-day TTL)');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📊 Collections Created:');
    console.log('  1. parking_lots      - Parking lot information');
    console.log('  2. parking_slots     - Individual parking slots');
    console.log('  3. reservations      - User reservations');
    console.log('  4. vehicle_entries   - Vehicle entry/exit logs');
    console.log('  5. users             - User accounts');
    console.log('  6. ai_event_logs     - AI detection events (30-day retention)');
    
    console.log('\n📈 Indexes Created: 24 total');
    console.log('  - Geospatial index on parking_lots.location');
    console.log('  - Compound indexes for efficient queries');
    console.log('  - TTL index on ai_event_logs (auto-delete after 30 days)');
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Run: node scripts/seed-data.js (to add sample data)');
    console.log('  2. Start your backend server');
    console.log('  3. Test API endpoints\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupDatabase().catch(console.error);
