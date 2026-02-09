const { getDB } = require("../config/database");
const { ObjectId } = require("mongodb");

class ChatbotService {
  // Bangladesh-specific locations and context
  constructor() {
    this.bangladeshCities = [
      "dhaka",
      "chittagong",
      "chattogram",
      "sylhet",
      "rajshahi",
      "khulna",
      "barisal",
      "rangpur",
      "mymensingh",
      "comilla",
      "gazipur",
      "narayanganj",
      "cox's bazar",
      "coxsbazar",
      "bogra",
      "jessore",
      "dinajpur",
    ];

    this.dhakaAreas = [
      "dhanmondi",
      "gulshan",
      "banani",
      "uttara",
      "mirpur",
      "mohammadpur",
      "motijheel",
      "bashundhara",
      "badda",
      "rampura",
      "malibagh",
      "tejgaon",
      "farmgate",
      "shahbag",
      "old dhaka",
      "purana dhaka",
      "sadarghat",
      "kamalapur",
    ];

    this.commonBengaliPhrases = [
      "assalamu alaikum",
      "salam",
      "kemon acho",
      "kothay",
      "koto taka",
      "dam koto",
      "koto dam",
      "dhanmondi te",
      "gulshan e",
      "parking khujchi",
    ];
  }

  /**
   * Process user message and provide intelligent parking suggestions
   */
  async processMessage(message, userLocation = null, userId = null) {
    const db = getDB();
    const lowerMessage = message.toLowerCase();

    // Check if user is in Bangladesh context
    const isBangladeshContext = this.detectBangladeshContext(
      lowerMessage,
      userLocation,
    );

    // Detect intent from message
    const intent = this.detectIntent(lowerMessage);

    switch (intent) {
      case "find_parking":
        return await this.suggestParking(
          db,
          userLocation,
          lowerMessage,
          isBangladeshContext,
        );

      case "check_availability":
        return await this.checkAvailability(
          db,
          lowerMessage,
          isBangladeshContext,
        );

      case "pricing_info":
        return await this.getPricingInfo(db, lowerMessage, isBangladeshContext);

      case "reservation_help":
        return await this.getReservationHelp(db, userId, isBangladeshContext);

      case "lot_info":
        return await this.getLotInfo(db, lowerMessage, isBangladeshContext);

      case "greeting":
        return this.getGreeting(isBangladeshContext);

      default:
        return this.getDefaultResponse(isBangladeshContext);
    }
  }

  /**
   * Detect if user is in Bangladesh context
   */
  detectBangladeshContext(message, userLocation) {
    // Check user location (Bangladesh coordinates: 20-27°N, 88-93°E)
    if (userLocation && userLocation.lat && userLocation.lng) {
      const lat = userLocation.lat;
      const lng = userLocation.lng;
      if (lat >= 20 && lat <= 27 && lng >= 88 && lng <= 93) {
        return true;
      }
    }

    // Check for Bangladesh-specific keywords
    const lowerMsg = message.toLowerCase();

    // Check for Bangladesh cities
    for (const city of this.bangladeshCities) {
      if (lowerMsg.includes(city)) return true;
    }

    // Check for Dhaka areas
    for (const area of this.dhakaAreas) {
      if (lowerMsg.includes(area)) return true;
    }

    // Check for Bengali phrases
    for (const phrase of this.commonBengaliPhrases) {
      if (lowerMsg.includes(phrase)) return true;
    }

    return false;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    // Greetings (English + Bengali)
    if (
      /^(hi|hello|hey|greetings|assalamu alaikum|salam|kemon acho|kemon achen)/i.test(
        message,
      )
    ) {
      return "greeting";
    }

    // Find parking (English + Bengali)
    if (
      /(find|where|locate|search|need|looking for|park|parking|khujchi|khujtesi|lagbe|dorkar)/i.test(
        message,
      )
    ) {
      return "find_parking";
    }

    // Check availability
    if (
      /(available|availability|free|empty|open|spots left|khali|ache|ace ki)/i.test(
        message,
      )
    ) {
      return "check_availability";
    }

    // Pricing (English + Bengali)
    if (
      /(price|pricing|cost|rate|fee|how much|expensive|cheap|dam|taka|koto|koto taka)/i.test(
        message,
      )
    ) {
      return "pricing_info";
    }

    // Reservation
    if (/(reserve|reservation|book|booking)/i.test(message)) {
      return "reservation_help";
    }

    // Information
    if (/(info|information|details|about|tell me)/i.test(message)) {
      return "lot_info";
    }

    return "unknown";
  }

  /**
   * Suggest best parking spots based on user location and preferences
   */
  async suggestParking(db, userLocation, message) {
    try {
      // Extract preferences from message
      const preferences = this.extractPreferences(message);

      let query = { status: "active" };
      let sortOptions = {};

      // Build query based on user location
      if (userLocation && userLocation.lat && userLocation.lng) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                parseFloat(userLocation.lng),
                parseFloat(userLocation.lat),
              ],
            },
            $maxDistance: preferences.maxDistance || 5000, // 5km default
          },
        };
      }

      // Fetch available lots
      const lots = await db
        .collection("parking_lots")
        .find(query)
        .limit(5)
        .toArray();

      if (lots.length === 0) {
        return {
          message:
            "I couldn't find any parking lots nearby. Try expanding your search radius or check a different area.",
          suggestions: [],
          type: "no_results",
        };
      }

      // Get slot availability for each lot
      const lotsWithAvailability = await Promise.all(
        lots.map(async (lot) => {
          const availableSlots = await db
            .collection("parking_slots")
            .countDocuments({
              lotId: lot._id,
              status: "available",
            });

          return {
            ...lot,
            availableSlots,
            score: this.calculateScore(lot, availableSlots, preferences),
          };
        }),
      );

      // Sort by score (best match first)
      lotsWithAvailability.sort((a, b) => b.score - a.score);

      // Filter out lots with no available slots
      const availableLots = lotsWithAvailability.filter(
        (lot) => lot.availableSlots > 0,
      );

      if (availableLots.length === 0) {
        const fullLotMsg = isBangladeshContext
          ? "দুঃখিত! সব পার্কিং লট পূর্ণ। ১৫-৩০ মিনিট পরে আবার চেক করুন অথবা অন্য এলাকা দেখুন।\n\nAll nearby parking lots are currently full. Check back in 15-30 minutes or try different areas."
          : "All nearby parking lots are currently full. I recommend checking again in 15-30 minutes or trying a different area.";

        return {
          message: fullLotMsg,
          suggestions: lotsWithAvailability.slice(0, 3).map((lot) => ({
            id: lot._id.toString(),
            name: lot.name,
            address: lot.address,
            availableSlots: 0,
            totalSlots: lot.totalSlots,
            reason: isBangladeshContext
              ? "বর্তমানে পূর্ণ"
              : "Currently full - check back soon",
          })),
          type: "all_full",
        };
      }

      // Generate response
      const topLot = availableLots[0];
      const message = this.generateParkingResponse(
        availableLots,
        preferences,
        isBangladeshContext,
      );

      return {
        message,
        suggestions: availableLots.slice(0, 3).map((lot) => ({
          id: lot._id.toString(),
          name: lot.name,
          address: lot.address,
          availableSlots: lot.availableSlots,
          totalSlots: lot.totalSlots,
          pricePerHour: lot.pricePerHour || (isBangladeshContext ? 50 : 5), // 50 BDT default
          distance: this.calculateDistance(userLocation, lot),
          features: lot.features || [],
          reason: this.getRecommendationReason(
            lot,
            preferences,
            isBangladeshContext,
          ),
        })),
        type: "success",
        topChoice: {
          id: topLot._id.toString(),
          name: topLot.name,
        },
      };
    } catch (error) {
      console.error("Error suggesting parking:", error);
      const errorMsg = isBangladeshContext
        ? "দুঃখিত! একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।\n\nSorry, I encountered an error. Please try again."
        : "Sorry, I encountered an error while searching for parking. Please try again.";
      return {
        message: errorMsg,
        suggestions: [],
        type: "error",
      };
    }
  }

  /**
   * Extract location mentions from message (Bangladesh context)
   */
  extractLocationFromMessage(message) {
    const lowerMsg = message.toLowerCase();

    // Check for Bangladesh cities
    for (const city of this.bangladeshCities) {
      if (lowerMsg.includes(city)) return city;
    }

    // Check for Dhaka areas
    for (const area of this.dhakaAreas) {
      if (lowerMsg.includes(area)) return area;
    }

    return null;
  }

  /**
   * Extract user preferences from message
   */
  extractPreferences(message, isBangladeshContext = false) {
    const preferences = {
      maxDistance: 5000,
      pricePreference: "any", // cheap, moderate, any
      features: [],
      currency: isBangladeshContext ? "BDT" : "USD",
    };

    // Price preferences (English + Bengali)
    if (/(cheap|affordable|budget|inexpensive|sasta|kom dam)/i.test(message)) {
      preferences.pricePreference = "cheap";
    } else if (/(expensive|premium|luxury|costly|beshi dam)/i.test(message)) {
      preferences.pricePreference = "expensive";
    }

    // Distance preferences
    if (/(close|near|nearby|closest|kache|kachakachi)/i.test(message)) {
      preferences.maxDistance = 2000; // 2km
    } else if (/(far|distant|any distance|dure)/i.test(message)) {
      preferences.maxDistance = 10000; // 10km
    }

    // Feature preferences (Bangladesh-specific additions)
    if (/(covered|indoor|sheltered|roofed|chad|chader niche)/i.test(message)) {
      preferences.features.push("covered");
    }
    if (/(ev|electric|charging)/i.test(message)) {
      preferences.features.push("ev_charging");
    }
    if (
      /(security|secure|safe|camera|cctv|nirapod|nirapad|guard)/i.test(message)
    ) {
      preferences.features.push("security");
    }
    // Bangladesh-specific features
    if (/(24 hour|24\/7|round the clock|sorboda|sob somoy)/i.test(message)) {
      preferences.features.push("24/7");
    }
    if (/(guard|watchman|chowkidar)/i.test(message)) {
      preferences.features.push("security_guard");
    }
    if (/(mall|shopping|market|bazar)/i.test(message)) {
      preferences.features.push("near_shopping");
    }

    return preferences;
  }

  /**
   * Calculate parking lot score based on preferences
   */
  calculateScore(lot, availableSlots, preferences) {
    let score = 0;

    // Availability score (0-40 points)
    const availabilityRatio = availableSlots / (lot.totalSlots || 1);
    score += availabilityRatio * 40;

    // Price score (0-30 points)
    const price = lot.pricePerHour || 5;
    if (preferences.pricePreference === "cheap") {
      score += Math.max(0, 30 - price * 2);
    } else if (preferences.pricePreference === "expensive") {
      score += Math.min(30, price * 2);
    } else {
      score += 15; // neutral
    }

    // Features score (0-30 points)
    const lotFeatures = lot.features || [];
    const matchingFeatures = preferences.features.filter((f) =>
      lotFeatures.includes(f),
    );
    score +=
      (matchingFeatures.length / Math.max(preferences.features.length, 1)) * 30;

    return score;
  }

  /**
   * Calculate distance between user and lot (in meters)
   */
  calculateDistance(userLocation, lot) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return null;
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = (userLocation.lat * Math.PI) / 180;
    const φ2 = (lot.lat * Math.PI) / 180;
    const Δφ = ((lot.lat - userLocation.lat) * Math.PI) / 180;
    const Δλ = ((lot.lng - userLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Generate parking response message (Bangladesh-aware)
   */
  generateParkingResponse(lots, preferences, isBangladeshContext = false) {
    const topLot = lots[0];
    const currency = isBangladeshContext ? "৳" : "$";
    const pricePerHour = topLot.pricePerHour || (isBangladeshContext ? 50 : 5);

    const messages = isBangladeshContext
      ? [
          `সুখবর! আপনার জন্য ${lots.length}টি পার্কিং অপশন পেয়েছি।`,
          `\n🅿️ **${topLot.name}** সবচেয়ে ভালো!`,
          `📍 ${topLot.address}`,
          `✅ ${topLot.availableSlots}টি জায়গা খালি (মোট ${topLot.totalSlots}টি)`,
          `💵 ${currency}${pricePerHour}/ঘণ্টা`,
        ]
      : [
          `Great news! I found ${lots.length} parking option${lots.length > 1 ? "s" : ""} for you.`,
          `\n🅿️ **${topLot.name}** is your best match!`,
          `📍 ${topLot.address}`,
          `✅ ${topLot.availableSlots} spots available out of ${topLot.totalSlots}`,
          `💵 ${currency}${pricePerHour}/hour`,
        ];

    if (topLot.features && topLot.features.length > 0) {
      const featuresLabel = isBangladeshContext ? "✨ সুবিধা" : "✨ Features";
      messages.push(`${featuresLabel}: ${topLot.features.join(", ")}`);
    }

    return messages.join("\n");
  }

  /**
   * Get recommendation reason (Bangladesh-aware)
   */
  getRecommendationReason(lot, preferences, isBangladeshContext = false) {
    const reasons = [];

    const availabilityRatio = lot.availableSlots / lot.totalSlots;
    if (availabilityRatio > 0.5) {
      reasons.push(
        isBangladeshContext ? "অনেক জায়গা খালি" : "High availability",
      );
    }

    const price = lot.pricePerHour || (isBangladeshContext ? 50 : 5);
    const cheapThreshold = isBangladeshContext ? 60 : 5;
    if (price < cheapThreshold) {
      reasons.push(isBangladeshContext ? "সাশ্রয়ী দাম" : "Budget-friendly");
    }

    if (lot.features && lot.features.length > 0) {
      reasons.push(isBangladeshContext ? "ভালো সুবিধা" : "Great amenities");
    }

    return reasons.length > 0
      ? reasons.join(" • ")
      : isBangladeshContext
        ? "ভালো অপশন"
        : "Good option";
  }

  /**
   * Check availability at specific lot (Bangladesh-aware)
   */
  async checkAvailability(db, message, isBangladeshContext = false) {
    try {
      const lots = await db
        .collection("parking_lots")
        .find({ status: "active" })
        .limit(5)
        .toArray();

      const availability = await Promise.all(
        lots.map(async (lot) => {
          const available = await db
            .collection("parking_slots")
            .countDocuments({
              lotId: lot._id,
              status: "available",
            });
          return {
            name: lot.name,
            available,
            total: lot.totalSlots,
          };
        }),
      );

      const headerText = isBangladeshContext
        ? "বর্তমান পার্কিং সুবিধা:\n\n"
        : "Here's the current availability:\n\n";

      const message =
        headerText +
        availability
          .map(
            (a) =>
              `🅿️ **${a.name}**: ${a.available}/${a.total} ${isBangladeshContext ? "খালি" : "available"}`,
          )
          .join("\n");

      return {
        message,
        availability,
        type: "availability",
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      const errorMsg = isBangladeshContext
        ? "দুঃখিত! এখন availability চেক করতে পারছি না। আবার চেষ্টা করুন।"
        : "Sorry, I couldn't check availability right now. Please try again.";
      return {
        message: errorMsg,
        type: "error",
      };
    }
  }

  /**
   * Get pricing information (Bangladesh-aware)
   */
  async getPricingInfo(db, message, isBangladeshContext = false) {
    try {
      const lots = await db
        .collection("parking_lots")
        .find({ status: "active" })
        .sort({ pricePerHour: 1 })
        .limit(5)
        .toArray();

      const currency = isBangladeshContext ? "৳" : "$";
      const defaultPrice = isBangladeshContext ? 50 : 5;
      const headerText = isBangladeshContext
        ? "পার্কিং এর দাম:\n\n"
        : "Here are the pricing options:\n\n";
      const footerText = isBangladeshContext
        ? "\n\nপিক আওয়ারে দাম বাড়তে পারে। এখনই বুক করুন!"
        : "\n\nPrices may vary during peak hours. Reserve now to lock in the rate!";

      const message =
        headerText +
        lots
          .map(
            (lot) =>
              `🅿️ **${lot.name}**: ${currency}${lot.pricePerHour || defaultPrice}/${isBangladeshContext ? "ঘণ্টা" : "hour"}`,
          )
          .join("\n") +
        footerText;

      return {
        message,
        lots: lots.map((lot) => ({
          name: lot.name,
          price: lot.pricePerHour || defaultPrice,
        })),
        type: "pricing",
      };
    } catch (error) {
      console.error("Error getting pricing:", error);
      const errorMsg = isBangladeshContext
        ? "দুঃখিত! দাম দেখাতে পারছি না।"
        : "Sorry, I couldn't fetch pricing information right now.";
      return {
        message: errorMsg,
        type: "error",
      };
    }
  }

  /**
   * Get reservation help (Bangladesh-aware)
   */
  async getReservationHelp(db, userId, isBangladeshContext = false) {
    const message = isBangladeshContext
      ? `পার্কিং রিজার্ভ করতে:

1. ম্যাপে পার্কিং লট দেখুন
2. খালি জায়গা আছে এমন লট সিলেক্ট করুন
3. আপনার পছন্দের সময় বেছে নিন
4. রিজার্ভেশন কনফার্ম করুন

💡 **পরামর্শ**: পিক আওয়ারে (সকাল ৭-৯, দুপুর ১২-১, বিকাল ৫-৭) আগে থেকে বুক করুন!

আমি কি পার্কিং খুঁজতে সাহায্য করব?`
      : `To reserve a parking spot:

1. Browse available parking lots on the map
2. Select a lot with available spots
3. Choose your preferred time slot
4. Confirm your reservation

💡 **Tip**: Reserve in advance during peak hours (7-9 AM, 12-1 PM, 5-7 PM) to guarantee a spot!

Would you like me to help you find a parking spot to reserve?`;

    return {
      message,
      type: "help",
    };
  }

  /**
   * Get lot information (Bangladesh-aware)
   */
  async getLotInfo(db, message, isBangladeshContext = false) {
    return {
      message: isBangladeshContext
        ? "আমি পার্কিং খুঁজতে সাহায্য করতে পারি! এভাবে জিজ্ঞাসা করুন:\n\n" +
          "• 'ধানমন্ডিতে পার্কিং কোথায়?'\n" +
          "• 'সস্তা পার্কিং দেখান'\n" +
          "• 'ছাদ ওয়ালা পার্কিং লাগবে'\n" +
          "• 'এখন কোথায় খালি আছে?'\n\n" +
          "কী জানতে চান?"
        : "I can help you find parking lots! Try asking:\n\n" +
          "• 'Find me parking near downtown'\n" +
          "• 'Show cheap parking options'\n" +
          "• 'I need covered parking'\n" +
          "• 'What's available right now?'\n\n" +
          "What would you like to know?",
      type: "info",
    };
  }

  /**
   * Get greeting response (Bangladesh-aware)
   */
  getGreeting(isBangladeshContext = false) {
    const greetings = isBangladeshContext
      ? [
          "আসসালামু আলাইকুম! আমি আপনার AI পার্কিং এসিস্ট্যান্ট। আজ পার্কিং খুঁজতে কিভাবে সাহায্য করতে পারি?",
          "হ্যালো! পার্কিং খুঁজছেন? আমি সঠিক জায়গা খুঁজে দিতে পারি!",
          "কেমন আছেন! পার্কিং খুঁজতে রেডি। কী খুঁজছেন?",
        ]
      : [
          "Hello! I'm your AI parking assistant. How can I help you find parking today?",
          "Hi there! Looking for a parking spot? I can help you find the perfect one!",
          "Hey! Ready to help you find parking. What are you looking for?",
        ];

    return {
      message: greetings[Math.floor(Math.random() * greetings.length)],
      type: "greeting",
    };
  }

  /**
   * Default response for unknown intents (Bangladesh-aware)
   */
  getDefaultResponse(isBangladeshContext = false) {
    return {
      message: isBangladeshContext
        ? "আমি সাহায্য করতে পারি! আমি যা করতে পারি:\n\n" +
          "🔍 কাছাকাছি পার্কিং খুঁজে দেওয়া\n" +
          "📊 খালি জায়গা চেক করা\n" +
          "💰 দাম তুলনা করা\n" +
          "📅 রিজার্ভেশন করতে সাহায্য\n\n" +
          "যেমন বলুন: 'পার্কিং খুঁজে দাও' বা 'এখন কোথায় খালি আছে?'"
        : "I'd love to help! I can assist you with:\n\n" +
          "🔍 Finding parking spots near you\n" +
          "📊 Checking availability\n" +
          "💰 Comparing prices\n" +
          "📅 Making reservations\n\n" +
          "Just ask me something like 'Find me parking' or 'What's available?'",
      type: "help",
    };
  }
}

module.exports = new ChatbotService();
