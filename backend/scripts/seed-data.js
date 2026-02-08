#!/usr/bin/env node

/**
 * Seed Database with Sample Data
 * Adds realistic test data for development and testing
 */

const { MongoClient, ObjectId, Int32, Double } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'smart_parking_db';

async function seedDatabase() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');

        const db = client.db(dbName);

        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await db.collection('users').deleteMany({});
        await db.collection('parking_lots').deleteMany({});
        await db.collection('parking_slots').deleteMany({});
        await db.collection('reservations').deleteMany({});
        await db.collection('ai_events').deleteMany({});

        // ========================================
        // 1. SEED USERS
        // ========================================
        console.log('\n👤 Seeding users...');

        const passwordHash = await bcrypt.hash('password123', 10);

        const users = [
            {
                _id: new ObjectId(),
                email: 'admin@parking.com',
                passwordHash,
                name: 'Admin User',
                phone: '+1234567890',
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'staff@parking.com',
                passwordHash,
                name: 'Jane Smith',
                phone: '+1234567891',
                role: 'staff',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'user@parking.com',
                passwordHash,
                name: 'John Doe',
                phone: '+1234567892',
                role: 'user',
                profile: {
                    vehicleInfo: {
                        licensePlate: 'ABC-1234',
                        vehicleType: 'car'
                    }
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await db.collection('users').insertMany(users);
        console.log(`✅ Inserted ${users.length} users`);
        console.log('   Login credentials (all): password123');

        // ========================================
        // 2. SEED PARKING LOTS
        // ========================================
        console.log('\n📍 Seeding parking lots...');

        const parkingLots = [
            {
                _id: new ObjectId(),
                name: 'Downtown Parking Lot A',
                location: {
                    type: 'Point',
                    coordinates: [-122.4194, 37.7749] // [lng, lat] - San Francisco
                },
                address: '123 Main St, San Francisco, CA 94102',
                totalSlots: new Int32(200),
                availableSlots: new Int32(156),
                zones: [
                    { name: 'Zone A - Ground Floor', slotIds: [] },
                    { name: 'Zone B - Level 1', slotIds: [] }
                ],
                pricing: {
                    hourlyRate: new Double(3.0),
                    currency: 'USD'
                },
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: 'Airport Parking B',
                location: {
                    type: 'Point',
                    coordinates: [-122.3750, 37.6213] // SFO Airport
                },
                address: 'San Francisco International Airport, CA 94128',
                totalSlots: new Int32(150),
                availableSlots: new Int32(89),
                zones: [
                    { name: 'Zone A - Short Term', slotIds: [] },
                    { name: 'Zone B - Long Term', slotIds: [] }
                ],
                pricing: {
                    hourlyRate: new Double(5.0),
                    currency: 'USD'
                },
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: 'Mall Parking Center C',
                location: {
                    type: 'Point',
                    coordinates: [-122.4064, 37.7937]
                },
                address: '456 Shopping Dr, San Francisco, CA 94109',
                totalSlots: new Int32(120),
                availableSlots: new Int32(78),
                zones: [
                    { name: 'Zone A - Lower Level', slotIds: [] }
                ],
                pricing: {
                    hourlyRate: new Double(2.5),
                    currency: 'USD'
                },
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await db.collection('parking_lots').insertMany(parkingLots);
        console.log(`✅ Inserted ${parkingLots.length} parking lots`);

        // Assign staff to first lot
        await db.collection('users').updateOne(
            { email: 'staff@parking.com' },
            { $set: { assignedLotId: parkingLots[0]._id } }
        );

        // ========================================
        // 3. SEED PARKING SLOTS
        // ========================================
        console.log('\n🅿️  Seeding parking slots...');

        const parkingSlots = [];
        const statuses = ['available', 'occupied', 'reserved', 'maintenance'];
        const weights = [0.7, 0.2, 0.08, 0.02]; // 70% available, 20% occupied, etc.

        // Generate slots for first parking lot (Downtown A)
        for (let i = 1; i <= 200; i++) {
            const random = Math.random();
            let status;
            let cumulative = 0;

            for (let j = 0; j < statuses.length; j++) {
                cumulative += weights[j];
                if (random <= cumulative) {
                    status = statuses[j];
                    break;
                }
            }

            const slot = {
                _id: new ObjectId(),
                lotId: parkingLots[0]._id,
                zoneId: i <= 100 ? 'Zone A - Ground Floor' : 'Zone B - Level 1',
                slotNumber: `A-${String(i).padStart(3, '0')}`,
                status,
                confidence: new Double(0.85 + Math.random() * 0.14), // 85-99%
                lastDetectedAt: new Date(Date.now() - Math.random() * 300000), // Last 5 mins
                aiModelVersion: 'v2.3.1',
                polygon: [
                    { x: new Double((i % 20) * 10), y: new Double(Math.floor(i / 20) * 5) },
                    { x: new Double((i % 20) * 10 + 8), y: new Double(Math.floor(i / 20) * 5) },
                    { x: new Double((i % 20) * 10 + 8), y: new Double(Math.floor(i / 20) * 5 + 4) },
                    { x: new Double((i % 20) * 10), y: new Double(Math.floor(i / 20) * 5 + 4) }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (status === 'occupied') {
                slot.vehicleEntry = {
                    vehicleId: new ObjectId(),
                    entryTime: new Date(Date.now() - Math.random() * 7200000), // Last 2 hours
                    licensePlate: `CA-${Math.floor(1000 + Math.random() * 9000)}`
                };
            }

            parkingSlots.push(slot);
        }

        await db.collection('parking_slots').insertMany(parkingSlots);
        console.log(`✅ Inserted ${parkingSlots.length} parking slots`);

        // ========================================
        // 4. SEED RESERVATIONS
        // ========================================
        console.log('\n📅 Seeding reservations...');

        const reservedSlots = parkingSlots.filter(s => s.status === 'reserved');
        const reservations = reservedSlots.slice(0, 10).map((slot, index) => ({
            _id: new ObjectId(),
            userId: users[2]._id, // Regular user
            slotId: slot._id,
            lotId: parkingLots[0]._id,
            status: 'confirmed',
            reservationTime: new Date(),
            startTime: new Date(Date.now() + 3600000), // 1 hour from now
            endTime: new Date(Date.now() + 7200000), // 2 hours from now
            price: new Double(6.0),
            currency: 'USD',
            paymentStatus: 'paid',
            paymentIntentId: `pi_${Math.random().toString(36).substr(2, 9)}`,
            qrCode: `QR_${slot.slotNumber}_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        if (reservations.length > 0) {
            await db.collection('reservations').insertMany(reservations);
            console.log(`✅ Inserted ${reservations.length} reservations`);
        }

        // ========================================
        // 5. SEED AI EVENT LOGS
        // ========================================
        console.log('\n🤖 Seeding AI event logs...');

        const aiEvents = [];
        const eventTypes = ['detection', 'status_change', 'anomaly'];

        for (let i = 0; i < 50; i++) {
            const slot = parkingSlots[Math.floor(Math.random() * parkingSlots.length)];
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const isAnomaly = eventType === 'anomaly' || Math.random() < 0.05;

            const aiEvent = {
                _id: new ObjectId(),
                slotId: slot._id,
                lotId: slot.lotId,
                eventType,
                previousStatus: 'available',
                newStatus: slot.status,
                confidence: new Double(isAnomaly ? 0.6 + Math.random() * 0.2 : 0.9 + Math.random() * 0.09),
                modelVersion: 'v2.3.1',
                processingTimeMs: new Int32(Math.floor(50 + Math.random() * 200)),
                isAnomaly,
                timestamp: new Date(Date.now() - i * 60000), // Spread over last hour
                createdAt: new Date()
            };

            if (isAnomaly) {
                aiEvent.anomalyReason = 'Low confidence detection';
            }

            aiEvents.push(aiEvent);
        }

        await db.collection('ai_event_logs').insertMany(aiEvents);
        console.log(`✅ Inserted ${aiEvents.length} AI event logs`);

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(50));
        console.log('✅ DATABASE SEEDING COMPLETE!');
        console.log('='.repeat(50));
        console.log('\n📊 Sample Data Inserted:');
        console.log(`  👤 Users: ${users.length} (admin, staff, user)`);
        console.log(`  📍 Parking Lots: ${parkingLots.length}`);
        console.log(`  🅿️  Parking Slots: ${parkingSlots.length}`);
        console.log(`  📅 Reservations: ${reservations.length}`);
        console.log(`  🤖 AI Events: ${aiEvents.length}`);

        console.log('\n🔐 Test Login Credentials:');
        console.log('  Admin:  admin@parking.com  / password123');
        console.log('  Staff:  staff@parking.com  / password123');
        console.log('  User:   user@parking.com   / password123');

        console.log('\n🎯 Ready to test your API endpoints!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the seeding
seedDatabase().catch(console.error);
