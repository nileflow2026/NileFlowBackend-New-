// controllers/aiChatController.js
const { default: OpenAI } = require("openai");
const { Query } = require("node-appwrite");
const AppwriteSessionService = require("../services/AppwriteSessionService");
const logger = require("../utils/logger");
const sanitizer = require("../utils/sanitizer");
const { env } = require("../src/env");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY,
});

// Token usage limits for cost control
const TOKEN_LIMITS = {
  MAX_INPUT_TOKENS: 3000,
  MAX_OUTPUT_TOKENS: 1000,
  MAX_CONTEXT_LENGTH: 2000,
};

// Intent classification keywords
const INTENT_KEYWORDS = {
  PRODUCT_QUERY: [
    "product",
    "item",
    "buy",
    "price",
    "cost",
    "available",
    "stock",
    "recommendation",
    "suggest",
    "compare",
    "feature",
    "specification",
    "category",
    "brand",
    "search",
  ],
  ORDER_STATUS: [
    "order",
    "delivery",
    "status",
    "tracking",
    "shipped",
    "delivered",
    "pending",
    "cancelled",
    "refund",
    "return",
    "payment",
    "receipt",
    "confirm",
    "track",
  ],
  FAQ: [
    "how",
    "what",
    "when",
    "where",
    "why",
    "help",
    "support",
    "policy",
    "terms",
    "shipping",
    "return policy",
    "contact",
    "hours",
    "location",
    "account",
    "profile",
  ],
};

/**
 * Helper function to get relevant context for product queries and FAQs
 * This would typically integrate with your search/recommendation system
 */
const getRelevantContext = async (message) => {
  try {
    // Ensure Appwrite connection
    await AppwriteSessionService.ensureConnected();
    const db = AppwriteSessionService.getDatabases();

    const context = {
      products: [],
      categories: [],
      faqs: [],
    };

    // Extract keywords for search
    const searchTerms = message
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 2);

    // Search products if collections exist
    if (env.APPWRITE_PRODUCT_COLLECTION_ID) {
      try {
        const products = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PRODUCT_COLLECTION_ID,
          [Query.limit(5)]
        );
        context.products = products.documents.slice(0, 3); // Limit for token control
      } catch (error) {
        logger.warn("Product collection not accessible:", error.message);
      }
    }

    // Search categories if collections exist
    if (env.APPWRITE_CATEGORIES_COLLECTION_ID) {
      try {
        const categories = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CATEGORIES_COLLECTION_ID,
          [Query.limit(5)]
        );
        context.categories = categories.documents.slice(0, 3);
      } catch (error) {
        logger.warn("Categories collection not accessible:", error.message);
      }
    }

    return context;
  } catch (error) {
    logger.error("Error getting relevant context:", error);
    return { products: [], categories: [], faqs: [] };
  }
};

/**
 * Classify user intent based on message content
 */
const classifyIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  const scores = {
    PRODUCT_QUERY: 0,
    ORDER_STATUS: 0,
    FAQ: 0,
  };

  // Score each intent based on keyword matches
  Object.entries(INTENT_KEYWORDS).forEach(([intent, keywords]) => {
    keywords.forEach((keyword) => {
      if (lowerMessage.includes(keyword)) {
        scores[intent] += 1;
      }
    });
  });

  // Find highest scoring intent
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "UNKNOWN";

  return Object.entries(scores).find(([_, score]) => score === maxScore)[0];
};

/**
 * Fetch user profile and recent orders from Appwrite
 */
const getUserContext = async (userId) => {
  try {
    await AppwriteSessionService.ensureConnected();
    const users = AppwriteSessionService.getUsers();
    const db = AppwriteSessionService.getDatabases();

    // Get user profile
    const userProfile = await users.get(userId);

    // Get last 5 orders
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(5),
      ]
    );

    return {
      profile: {
        id: userProfile.$id,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || null,
      },
      orders: orders.documents.map((order) => ({
        id: order.$id,
        status: order.status,
        total: order.total,
        createdAt: order.$createdAt,
        items: order.items ? JSON.parse(order.items).slice(0, 3) : [], // Limit items for token control
      })),
    };
  } catch (error) {
    logger.error("Error fetching user context:", error);
    return {
      profile: { id: userId, name: "Customer" },
      orders: [],
    };
  }
};

/**
 * Get latest order status for order-related queries
 */
const getLatestOrderStatus = async (userId) => {
  try {
    await AppwriteSessionService.ensureConnected();
    const db = AppwriteSessionService.getDatabases();

    const latestOrder = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    );

    return latestOrder.documents[0] || null;
  } catch (error) {
    logger.error("Error fetching latest order:", error);
    return null;
  }
};

/**
 * Construct structured prompt for OpenAI
 */
const constructPrompt = (
  intent,
  userContext,
  message,
  additionalContext = {}
) => {
  const systemPrompt = `You are a helpful AI assistant for NileFlow, an eCommerce platform. 
Your role is to provide accurate, helpful, and concise responses to customer inquiries.

CUSTOMER CONTEXT:
- Name: ${userContext.profile.name}
- User ID: ${userContext.profile.id}
- Recent Orders: ${userContext.orders.length}

GUIDELINES:
1. Be friendly, professional, and helpful
2. Keep responses concise (under 200 words)
3. Provide specific information when available
4. If you don't have specific information, acknowledge this and suggest alternatives
5. For order status queries, reference specific order details
6. For product queries, use available product information
7. Always maintain customer privacy and security

INTENT: ${intent}`;

  let contextInfo = "";

  switch (intent) {
    case "PRODUCT_QUERY":
      contextInfo = `
AVAILABLE PRODUCTS: ${JSON.stringify(additionalContext.products || [], null, 2)}
CATEGORIES: ${JSON.stringify(additionalContext.categories || [], null, 2)}`;
      break;

    case "ORDER_STATUS":
      if (additionalContext.latestOrder) {
        contextInfo = `
LATEST ORDER:
- Order ID: ${additionalContext.latestOrder.$id}
- Status: ${additionalContext.latestOrder.status}
- Total: ${additionalContext.latestOrder.total}
- Date: ${additionalContext.latestOrder.$createdAt}`;
      }
      break;

    case "FAQ":
      contextInfo = `
COMPANY INFO:
- Platform: NileFlow eCommerce
- Support: Available for general questions
- Focus: African marketplace and products`;
      break;
  }

  const userPrompt = `Customer Query: ${message}${contextInfo}`;

  return { systemPrompt, userPrompt };
};

/**
 * Validate token usage before API call
 */
const validateTokenUsage = (prompt) => {
  const estimatedTokens = Math.ceil(
    (prompt.systemPrompt + prompt.userPrompt).length / 4
  );

  if (estimatedTokens > TOKEN_LIMITS.MAX_INPUT_TOKENS) {
    throw new Error(
      `Input too long. Estimated ${estimatedTokens} tokens, max ${TOKEN_LIMITS.MAX_INPUT_TOKENS}`
    );
  }

  return estimatedTokens;
};

/**
 * Main AI Chat Controller
 * Handles POST requests with { userId, message, sessionId }
 */
const handleAiChat = async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. Validate and sanitize input
    const { userId, message, sessionId } = sanitizer.sanitize(req.body);

    if (!userId || !message) {
      return res.status(400).json({
        error: "userId and message are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: "Message too long. Maximum 1000 characters allowed",
        code: "MESSAGE_TOO_LONG",
      });
    }

    logger.info(`AI Chat request from user ${userId}`, {
      sessionId,
      messageLength: message.length,
    });

    // 2. Classify intent
    const intent = classifyIntent(message);
    logger.info(`Classified intent: ${intent}`);

    // 3. Fetch user context (profile + recent orders)
    const userContext = await getUserContext(userId);

    // 4. Get additional context based on intent
    let additionalContext = {};

    switch (intent) {
      case "PRODUCT_QUERY":
      case "FAQ":
        additionalContext = await getRelevantContext(message);
        break;

      case "ORDER_STATUS":
        additionalContext.latestOrder = await getLatestOrderStatus(userId);
        break;
    }

    // 5. Construct structured prompt
    const prompts = constructPrompt(
      intent,
      userContext,
      message,
      additionalContext
    );

    // 6. Validate token usage
    const estimatedTokens = validateTokenUsage(prompts);
    logger.info(`Estimated tokens: ${estimatedTokens}`);

    // 7. Call OpenAI Chat Completion with guardrails
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: prompts.systemPrompt },
        { role: "user", content: prompts.userPrompt },
      ],
      max_tokens: TOKEN_LIMITS.MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const reply = completion.choices[0].message.content.trim();
    const tokensUsed = completion.usage;

    // 8. Log metrics for monitoring
    const responseTime = Date.now() - startTime;
    logger.info("AI Chat completed", {
      userId,
      sessionId,
      intent,
      responseTime: `${responseTime}ms`,
      tokensUsed,
      estimatedTokens,
    });

    // 9. Return clean JSON response
    return res.status(200).json({
      reply,
      intent,
      sessionId,
      metadata: {
        responseTime: `${responseTime}ms`,
        tokensUsed: tokensUsed?.total_tokens || 0,
        model: "gpt-3.5-turbo",
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    logger.error("AI Chat error:", {
      error: error.message,
      userId: req.body?.userId,
      sessionId: req.body?.sessionId,
      responseTime: `${responseTime}ms`,
    });

    // Handle specific error types
    if (error.message.includes("Input too long")) {
      return res.status(400).json({
        error: error.message,
        code: "INPUT_TOO_LONG",
      });
    }

    if (error.message.includes("exceeded your current quota")) {
      return res.status(503).json({
        error:
          "AI service is temporarily unavailable due to quota limits. Please try again later.",
        code: "AI_QUOTA_EXCEEDED",
      });
    }

    if (error.message.includes("API key")) {
      return res.status(500).json({
        error: "AI service temporarily unavailable",
        code: "AI_SERVICE_ERROR",
      });
    }

    if (error.message.includes("rate limit")) {
      return res.status(429).json({
        error: "Too many requests. Please try again later",
        code: "RATE_LIMITED",
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Unable to process your request. Please try again",
      code: "INTERNAL_ERROR",
      metadata: {
        responseTime: `${responseTime}ms`,
      },
    });
  }
};

/**
 * Health check endpoint for the AI Chat service
 */
const healthCheck = async (req, res) => {
  const healthStatus = {
    status: "healthy",
    services: {
      openai: "unknown",
      appwrite: "unknown",
    },
    timestamp: new Date().toISOString(),
    issues: [],
  };

  try {
    // Test Appwrite connection first (lighter operation)
    try {
      await AppwriteSessionService.ensureConnected();
      healthStatus.services.appwrite = "connected";
    } catch (appwriteError) {
      healthStatus.services.appwrite = "disconnected";
      healthStatus.issues.push({
        service: "appwrite",
        error: appwriteError.message,
      });
    }

    // Test OpenAI connection (more expensive operation)
    try {
      const testCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      });
      healthStatus.services.openai = "connected";
    } catch (openaiError) {
      healthStatus.services.openai = "disconnected";

      // Parse OpenAI specific errors
      let errorType = "unknown";
      let userFriendlyMessage = openaiError.message;

      if (openaiError.message.includes("exceeded your current quota")) {
        errorType = "quota_exceeded";
        userFriendlyMessage =
          "OpenAI quota exceeded. Please check billing and usage limits.";
      } else if (openaiError.message.includes("rate limit")) {
        errorType = "rate_limited";
        userFriendlyMessage =
          "OpenAI rate limit exceeded. Please try again later.";
      } else if (openaiError.message.includes("API key")) {
        errorType = "invalid_api_key";
        userFriendlyMessage = "Invalid or missing OpenAI API key.";
      }

      healthStatus.issues.push({
        service: "openai",
        error: userFriendlyMessage,
        errorType: errorType,
        originalError: openaiError.message,
      });
    }

    // Determine overall health status
    const hasConnectedServices = Object.values(healthStatus.services).some(
      (status) => status === "connected"
    );
    const hasOpenAI = healthStatus.services.openai === "connected";
    const hasAppwrite = healthStatus.services.appwrite === "connected";

    if (hasOpenAI && hasAppwrite) {
      healthStatus.status = "healthy";
      return res.status(200).json(healthStatus);
    } else if (hasConnectedServices) {
      healthStatus.status = "degraded";
      return res.status(200).json(healthStatus);
    } else {
      healthStatus.status = "unhealthy";
      return res.status(503).json(healthStatus);
    }
  } catch (error) {
    logger.error("Health check failed:", error);

    return res.status(503).json({
      status: "unhealthy",
      error: "Health check service failure",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  handleAiChat,
  healthCheck,
  // Export utilities for testing
  classifyIntent,
  getRelevantContext,
  constructPrompt,
};
