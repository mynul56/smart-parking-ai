const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        const dbName = process.env.MONGODB_DB_NAME;

        client = new MongoClient(uri);
        await client.connect();

        db = client.db(dbName);
        console.log(`✅ Connected to MongoDB: ${dbName}`);

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

module.exports = { connectDB, getDB, closeDB };
