const express = require("express");
const chatbotService = require("../services/chatbot.service");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * POST /api/v1/chatbot/message
 * Process a chatbot message and get AI response
 */
router.post("/message", authenticate, async (req, res, next) => {
  try {
    const { message, userLocation } = req.body;
    const userId = req.user?.userId;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Process message through chatbot service
    const response = await chatbotService.processMessage(
      message.trim(),
      userLocation,
      userId,
    );

    // Log conversation for analytics
    const db = req.app.locals.db || require("../config/database").getDB();
    await db.collection("chatbot_conversations").insertOne({
      userId: userId || null,
      message: message.trim(),
      response: response.message,
      intent: response.type,
      userLocation,
      timestamp: new Date(),
      suggestions: response.suggestions || [],
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    next(error);
  }
});

/**
 * GET /api/v1/chatbot/suggestions
 * Get quick suggestion prompts for the user
 */
router.get("/suggestions", authenticate, async (req, res, next) => {
  try {
    const suggestions = [
      {
        id: 1,
        text: "Find me parking nearby",
        icon: "search",
      },
      {
        id: 2,
        text: "Show cheap parking options",
        icon: "dollar-sign",
      },
      {
        id: 3,
        text: "What's available right now?",
        icon: "clock",
      },
      {
        id: 4,
        text: "I need covered parking",
        icon: "shield",
      },
    ];

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/chatbot/history
 * Get user's conversation history
 */
router.get("/history", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const db = req.app.locals.db || require("../config/database").getDB();
    const history = await db
      .collection("chatbot_conversations")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
