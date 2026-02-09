#!/usr/bin/env node

const { MongoClient, Int32, Double } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "smart_parking_db";

async function seedBangladeshData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // Create geospatial index
    await db.collection("parking_lots").createIndex({ location: "2dsphere" });
    console.log("✅ Geospatial index ready");

    console.log("\n📍 Adding Bangladesh parking lots...");

    const lots = [
      {
        name: "Dhanmondi Shopping Complex Parking",
        location: {
          type: "Point",
          coordinates: [new Double(90.3756), new Double(23.7465)],
        },
        address: "Road 2, Dhanmondi, Dhaka 1205",
        totalSlots: new Int32(80),
        availableSlots: new Int32(45),
        zones: [],
        pricing: {
          hourlyRate: new Double(40),
          currency: "BDT",
        },
        status: "active",
        features: ["covered", "security", "24/7", "security_guard"],
        trafficCondition: "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Gulshan Shopping Arcade Parking",
        location: {
          type: "Point",
          coordinates: [new Double(90.4077), new Double(23.7806)],
        },
        address: "Gulshan Avenue, Gulshan-1, Dhaka 1212",
        totalSlots: new Int32(120),
        availableSlots: new Int32(75),
        zones: [],
        pricing: {
          hourlyRate: new Double(60),
          currency: "BDT",
        },
        status: "active",
        features: ["covered", "security", "24/7", "cctv", "ev_charging"],
        trafficCondition: "heavy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Uttara City Center Parking",
        location: {
          type: "Point",
          coordinates: [new Double(90.3953), new Double(23.8759)],
        },
        address: "Sector 7, Uttara, Dhaka 1230",
        totalSlots: new Int32(150),
        availableSlots: new Int32(90),
        zones: [],
        pricing: {
          hourlyRate: new Double(35),
          currency: "BDT",
        },
        status: "active",
        features: ["covered", "security", "24/7"],
        trafficCondition: "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bashundhara City Mall Parking",
        location: {
          type: "Point",
          coordinates: [new Double(90.4268), new Double(23.8103)],
        },
        address: "Block-B, Bashundhara R/A, Dhaka 1229",
        totalSlots: new Int32(300),
        availableSlots: new Int32(180),
        zones: [],
        pricing: {
          hourlyRate: new Double(50),
          currency: "BDT",
        },
        status: "active",
        features: ["covered", "security", "24/7", "cctv", "ev_charging"],
        trafficCondition: "heavy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await db.collection("parking_lots").insertMany(lots);
    console.log(`✅ Inserted ${result.insertedCount} parking lots`);

    // Generate slots
    console.log("\n🚗 Generating parking slots...");
    let totalSlots = 0;

    for (const lotId of Object.values(result.insertedIds)) {
      const lot = await db.collection("parking_lots").findOne({ _id: lotId });
      const slots = [];

      for (let i = 1; i <= lot.totalSlots; i++) {
        const slotNumber = `${lot.name.substring(0, 1).toUpperCase()}-${String(i).padStart(3, "0")}`;
        const isAvailable = i <= lot.availableSlots;

        slots.push({
          lotId: lot._id,
          slotNumber,
          status: isAvailable ? "available" : "occupied",
          confidence: new Double(Math.random() * 0.2 + 0.8),
          lastUpdated: new Date(),
          type: "standard",
        });
      }

      await db.collection("parking_slots").insertMany(slots);
      totalSlots += slots.length;
    }

    console.log(`✅ Created ${totalSlots} parking slots`);
    console.log("\n" + "=".repeat(60));
    console.log("🇧🇩 BANGLADESH DATA SEEDED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\nLocations: Dhanmondi, Gulshan, Uttara, Bashundhara`);
    console.log(`Total Lots: ${lots.length}`);
    console.log(`Total Slots: ${totalSlots}`);
    console.log("\n💡 Try asking:");
    console.log('   • "Find parking in Dhanmondi"');
    console.log('   • "Show cheap parking in Dhaka"');
    console.log('   • "Parking kothay ache?"');
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedBangladeshData();
