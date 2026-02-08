#!/usr/bin/env node

/**
 * AI Smart Parking Manager v2.0
 * 
 * Features:
 * 1. Predictive Demand Simulation (Rush Hour logic)
 * 2. Dynamic Pricing (Surge pricing based on occupancy)
 * 3. Intelligent Traffic Analysis
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@parking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// Base Pricing Configuration
const BASE_RATE = 5.0;           // $5.00/hr base
const MIN_RATE = 2.0;            // $2.00/hr min
const MAX_RATE = 15.0;           // $15.00/hr max
const PRICE_SENSITIVITY = 0.5;   // Price step change

class SmartParkingManager {
    constructor() {
        this.authToken = null;
        this.lots = [];
        this.slotsMap = new Map(); // lotId -> slots[]
        this.simulationHour = 6;   // Start simulation at 6 AM
        this.minuteTick = 0;
    }

    async init() {
        console.log('🤖 Initializing AI Smart Manager...');
        if (await this.login()) {
            await this.refreshData();
            this.startLoop();
        } else {
            console.error('❌ Initialization failed. Exiting.');
            process.exit(1);
        }
    }

    async login() {
        let retries = 5;
        let delay = 1000;

        while (retries > 0) {
            try {
                console.log(`🔐 Logging in as ${ADMIN_EMAIL}...`);
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD
                });

                if (response.data.success) {
                    this.authToken = response.data.data.token;
                    console.log('✅ Login successful!');
                    return true;
                }
            } catch (error) {
                console.error(`❌ Login failed: ${error.message}. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
                retries--;
            }
        }
        return false;
    }

    async refreshData() {
        if (!this.authToken) return;
        try {
            // 1. Fetch Lots
            const lotsRes = await axios.get(`${API_URL}/lots`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            this.lots = lotsRes.data.data || [];
            console.log(`📍 Managed Lots: ${this.lots.length}`);

            // 2. Fetch Slots for each lot
            for (const lot of this.lots) {
                const slotsRes = await axios.get(`${API_URL}/lots/${lot._id}/slots`, {
                    headers: { Authorization: `Bearer ${this.authToken}` }
                });
                this.slotsMap.set(lot._id, slotsRes.data.data || []);
            }
            console.log('✅ Data synchronized.');
        } catch (error) {
            console.error('❌ Failed to refresh data:', error.message);
        }
    }

    /**
     * Returns a demand factor (0.0 - 1.0) based on Time of Day
     * Simulates:
     * - Morning Rush (7-9 AM)
     * - Lunch (12-1 PM)
     * - Evening Exit (5-7 PM)
     */
    getDemandFactor() {
        const hour = this.simulationHour;

        // Simple multi-peak function
        // Morning peak around 8-9
        const morningPeak = Math.max(0, 1 - Math.abs(hour - 8.5) / 2);
        // Lunch peak around 12-13
        const lunchPeak = Math.max(0, 0.8 - Math.abs(hour - 12.5) / 2);
        // Evening peak around 17-18
        const eveningPeak = Math.max(0, 1 - Math.abs(hour - 17.5) / 2);

        // Base demand + peaks
        let demand = 0.2 + (morningPeak * 0.8) + (lunchPeak * 0.6) + (eveningPeak * 0.9);
        return Math.min(1.0, demand);
    }

    /**
     * Logic to determine if a slot should change state
     */
    getNextStatus(currentStatus, demandFactor) {
        const random = Math.random();

        // High demand = faster fill up, slower empty
        if (currentStatus === 'available') {
            // Chance to fill increases with demand
            if (random < (0.1 + (demandFactor * 0.5))) {
                return 'occupied';
            }
        } else if (currentStatus === 'occupied') {
            // Chance to empty decreases with demand (people stay longer)
            // But increases during evening exit? Let's keep it simple.
            if (random < (0.1 - (demandFactor * 0.05))) {
                return 'available';
            }
        }
        return currentStatus;
    }

    async updatePricing(lot) {
        const slots = this.slotsMap.get(lot._id) || [];
        if (slots.length === 0) return;

        const occupied = slots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
        const occupancyRate = occupied / slots.length;

        let newRate = lot.hourlyRate || BASE_RATE;
        let changeReason = null;

        // Dynamic Pricing Logic
        if (occupancyRate > 0.8) {
            newRate += PRICE_SENSITIVITY;
            changeReason = 'High Demand (>80%) 📈';
        } else if (occupancyRate < 0.2) {
            newRate -= PRICE_SENSITIVITY;
            changeReason = 'Low Demand (<20%) 📉';
        } else {
            // Stabilize towards base rate
            if (newRate > BASE_RATE) newRate -= 0.1;
            if (newRate < BASE_RATE) newRate += 0.1;
        }

        // Clamp
        newRate = Math.max(MIN_RATE, Math.min(MAX_RATE, newRate));
        // Round to 1 decimal
        newRate = Math.round(newRate * 10) / 10;

        if (newRate !== lot.hourlyRate) {
            console.log(`💲 Dynamic Pricing [${lot.name}]: $${lot.hourlyRate} -> $${newRate} (${changeReason || 'Stabilizing'})`);

            // Update Lot API
            try {
                await axios.put(`${API_URL}/lots/${lot._id}`,
                    { pricing: { hourlyRate: newRate, currency: 'USD' } },
                    { headers: { Authorization: `Bearer ${this.authToken}` } }
                );
                // Update local model
                lot.hourlyRate = newRate;
            } catch (err) {
                console.error('❌ Failed to update price:', err.message);
            }
        }
    }

    async updateTrafficCondition(lot) {
        // Determine traffic based on occupancy and demand
        const slots = this.slotsMap.get(lot._id) || [];
        const occupancyRate = slots.filter(s => s.status === 'occupied').length / slots.length;

        let condition = 'low';
        if (occupancyRate > 0.85) condition = 'heavy';
        else if (occupancyRate > 0.6) condition = 'medium';

        if (lot.trafficCondition !== condition) {
            console.log(`🚦 Traffic Update [${lot.name}]: ${lot.trafficCondition} -> ${condition}`);
            try {
                await axios.put(`${API_URL}/lots/${lot._id}`,
                    { trafficCondition: condition },
                    { headers: { Authorization: `Bearer ${this.authToken}` } }
                );
                lot.trafficCondition = condition;
            } catch (err) {
                console.error('❌ Failed to update traffic:', err.message);
            }
        }
    }

    async step() {
        // 1. Advance Simulation Time (1 real sec = 5 sim minutes)
        this.minuteTick += 5;
        if (this.minuteTick >= 60) {
            this.minuteTick = 0;
            this.simulationHour = (this.simulationHour + 1) % 24;

            const demandParam = this.getDemandFactor().toFixed(2);
            console.log(`\n⏰ Simulation Time: ${this.simulationHour}:00 | Demand Factor: ${demandParam}`);
        }

        const demand = this.getDemandFactor();

        // 2. Simulate Slot Changes per Lot
        for (const lot of this.lots) {
            const slots = this.slotsMap.get(lot._id);
            if (!slots) continue;

            // Pick 1-3 random slots to potentially update
            const numUpdates = 1 + Math.floor(Math.random() * 2);

            for (let i = 0; i < numUpdates; i++) {
                const slot = slots[Math.floor(Math.random() * slots.length)];
                const newStatus = this.getNextStatus(slot.status, demand);

                if (newStatus !== slot.status) {
                    // console.log(`🔄 Slot ${slot.slotNumber}: ${slot.status} -> ${newStatus}`);
                    // Call API
                    try {
                        const res = await axios.put(`${API_URL}/slots/${slot._id}`,
                            { status: newStatus, confidence: 0.9 + (Math.random() * 0.09) },
                            { headers: { Authorization: `Bearer ${this.authToken}` } }
                        );
                        if (res.data.success) {
                            // Update local
                            Object.assign(slot, res.data.data);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }

            // 3. AI Manager Logic (Pricing & Traffic) - Run less frequently?
            // Let's run it every step for demo purposes so user sees it
            await this.updatePricing(lot);
            await this.updateTrafficCondition(lot);
        }
    }

    startLoop() {
        console.log('🚀 Smart Simulation Started. Press Ctrl+C to stop.');
        console.log(`⏰ Simulating 24h cycle. 1 real sec = 5 simulation minutes.`);

        setInterval(() => {
            this.step();
        }, 1000); // 1 tick per second
    }
}

// Start
const manager = new SmartParkingManager();
manager.init();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping Smart Manager...');
    process.exit(0);
});

