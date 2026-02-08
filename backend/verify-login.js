const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'smart_parking_db';

async function verifyLogin() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to DB');
        const db = client.db(dbName);

        const email = 'user@parking.com';
        const password = 'password123';

        console.log(`Checking user: ${email}`);
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            console.error('❌ User not found!');
            return;
        }
        console.log('✅ User found.');

        console.log('Verifying password...');
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            console.log('✅ Password is VALID!');
        } else {
            console.error('❌ Password is INVALID!');
            console.log('Stored Hash:', user.passwordHash);
            console.log('New Hash of "password123":', await bcrypt.hash(password, 10));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

verifyLogin();
