#!/usr/bin/env node

/**
 * Reset and Seed Database - Drops existing data and reseeds
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'smart_parking_db';

async function resetDatabase() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');

        const db = client.db(dbName);

        // Drop all collections
        const collections = await db.listCollections().toArray();
        console.log(`\n🗑️  Dropping ${collections.length} existing collections...`);

        for (const collection of collections) {
            await db.collection(collection.name).drop();
            console.log(`  ✓ Dropped ${collection.name}`);
        }

        console.log('\n✅ Database reset complete!');
        console.log('Now run: npm run setup-db && npm run seed-db\n');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

resetDatabase().catch(console.error);
