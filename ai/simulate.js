#!/usr/bin/env node

/**
 * AI Parking Detection Simulation Service
 * Simulates AI detection updates by calling the Backend API
 * accurately mimicking a real AI edge device.
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@parking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// State
let authToken = null;
let parkingSlots = [];

// Status weights for realistic simulation
const STATUS_TRANSITIONS = {
    available: [
        { status: 'occupied', weight: 0.3 },
        { status: 'reserved', weight: 0.05 },
        { status: 'available', weight: 0.65 },
    ],
    occupied: [
        { status: 'available', weight: 0.2 },
        { status: 'occupied', weight: 0.8 },
    ],
    reserved: [
        { status: 'occupied', weight: 0.7 },
        { status: 'available', weight: 0.1 },
        { status: 'reserved', weight: 0.2 },
    ],
    maintenance: [
        { status: 'available', weight: 0.1 },
        { status: 'maintenance', weight: 0.9 },
    ],
};

// --- Helper Functions ---

async function login() {
    try {
        console.log(`🔐 Logging in as ${ADMIN_EMAIL}...`);
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ Login successful!');
            return true;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        if (error.response) console.error(error.response.data);
    }
    return false;
}

async function fetchSlots() {
    // We can't fetch all slots in one go easily if pagination is enabled, 
    // but for simulation we can try to fetch a lot.
    // Or we can fetch lots first, then slots for a lot.
    try {
        if (!authToken) return false;

        // 1. Get Lots
        const lotsResponse = await axios.get(`${API_URL}/lots`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const lots = lotsResponse.data.data;
        if (!lots || lots.length === 0) {
            console.log('⚠️ No parking lots found.');
            return false;
        }

        // 2. Get Slots for random lot (or all)
        // For simulation, let's pick the first lot for now, or rotate
        const lot = lots[0];
        console.log(`📍 Fetching slots for lot: ${lot.name}`);

        const slotsResponse = await axios.get(`${API_URL}/lots/${lot._id}/slots`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        parkingSlots = slotsResponse.data.data;
        console.log(`✅ Loaded ${parkingSlots.length} slots for simulation.`);
        return true;

    } catch (error) {
        console.error('❌ Failed to fetch slots:', error.message);
        return false;
    }
}

function getNextStatus(currentStatus) {
    const transitions = STATUS_TRANSITIONS[currentStatus] || STATUS_TRANSITIONS.available;
    const random = Math.random();
    let cumulative = 0;

    for (const transition of transitions) {
        cumulative += transition.weight;
        if (random <= cumulative) {
            return transition.status;
        }
    }
    return currentStatus;
}

function generateConfidence(status) {
    if (status === 'occupied' || status === 'available') {
        return 0.85 + Math.random() * 0.14; // 85-99%
    }
    return 0.70 + Math.random() * 0.25; // 70-95%
}

async function updateRandomSlot() {
    if (parkingSlots.length === 0 || !authToken) return;

    try {
        const randomSlot = parkingSlots[Math.floor(Math.random() * parkingSlots.length)];
        const newStatus = getNextStatus(randomSlot.status);

        // Only update if changed or random chance (to simulate confidence updates)
        if (newStatus === randomSlot.status && Math.random() > 0.3) return;

        const newConfidence = generateConfidence(newStatus);
        const previousStatus = randomSlot.status;

        console.log(`🔄 Updating Slot ${randomSlot.slotNumber}: ${previousStatus} -> ${newStatus}`);

        // Call API
        const response = await axios.put(
            `${API_URL}/slots/${randomSlot._id}`,
            {
                status: newStatus,
                confidence: newConfidence
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        if (response.data.success) {
            // Update local cache
            const updatedSlot = response.data.data;
            const index = parkingSlots.findIndex(s => s._id === updatedSlot._id);
            if (index !== -1) {
                parkingSlots[index] = updatedSlot;
            }

            console.log(`✅ AI Update: Slot ${updatedSlot.slotNumber} ${previousStatus} → ${newStatus} (${(newConfidence * 100).toFixed(1)}%)`);
        }

    } catch (error) {
        console.error('❌ Error updating slot:', error.message);
        // If 401, re-login
        if (error.response && error.response.status === 401) {
            console.log('⚠️ Token expired, re-logging in...');
            await login();
        }
    }
}

async function startSimulation() {
    console.log('🤖 Starting AI Simulation Service v2.0');
    console.log(`📡 API URL: ${API_URL}`);

    // Initial Login
    if (!await login()) {
        console.error('🛑 Critical: Login failed. Exiting.');
        process.exit(1);
    }

    // Initial Data Fetch
    if (!await fetchSlots()) {
        console.error('🛑 Critical: Data fetch failed. Exiting.');
        process.exit(1);
    }

    // Simulation Loop
    console.log('🚀 Simulation running...');
    console.log('📊 Updating slots every 2-5 seconds');
    console.log('='.repeat(50));

    // Regular updates
    setInterval(() => {
        updateRandomSlot();
    }, 2000 + Math.random() * 3000);

    // Occasional batch updates (simulating a car driving through multiple spots?)
    // Or just concurrent updates
    setInterval(() => {
        const count = 2 + Math.floor(Math.random() * 3);
        console.log(`\n⚡ Batch burst: ${count} updates`);
        for (let i = 0; i < count; i++) {
            setTimeout(() => updateRandomSlot(), i * 500);
        }
    }, 20000);

    // Refresh slots occasionally to keep sync
    setInterval(() => {
        console.log('🔄 Refreshing slot cache...');
        fetchSlots();
    }, 60000 * 5); // Every 5 minutes
}

// Start
startSimulation();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping AI simulation...');
    process.exit(0);
});

