// src/index.js

// EMERGENCY DEBUG - Add to VERY TOP of index.js
/* process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("File:", error.fileName);
  console.error("Line:", error.lineNumber);

  // Don't exit immediately - let us see the error
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
});

// Enable all debug logs
process.env.DEBUG = "*";
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] `);
  process.stdout.write(args.join(" ") + "\n");
}; */
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./env");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const appwriteService = require("../services/AppwriteSessionService"); // Add this
const securityHeaders = require("../middleware/security");
const { authLimiter, apiLimiter } = require("../middleware/rate-limiter");
const {
  validateSignup,
  validateLogin,
} = require("../middleware/validate.middleware");
const healthRoutes = require("../routes/health.routes");

const adminRouter = require("../routes/adminRouter");
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const customernotifications = require("../routes/ClientnotificationsRouter");
const staffRoutes = require("../routes/staffroutes");
const settingRoutes = require("../routes/settingsRouter");
const ClientRoute = require("../routes/ClientauthRouter");
const ClientRouter = require("../routes/ClientRoutes");
const PaymentRouter = require("../routes/paymentrouter");
const nilemiles = require("../routes/reward");
const addressRoutes = require("../routes/addressroutes");
const questions = require("../routes/questionRoutes");
const Promotion = require("../routes/promotionRoutes");
const groupOrderRoutes = require("../routes/groupOrderRoutes");
const gamificationRoutes = require("../routes/gamificationRoutes");
const newsletterRoutes = require("../routes/newsletterRoutes");
const clientmessages = require("../routes/clientmessagerouter");
const careersRoutes = require("../routes/careersRoutes");
const applyRoutes = require("../routes/applyRoutes");
const productsrouter = require("../routes/productsRouter");
const passwordRouter = require("../routes/passwordRoute");
const cartRoutes = require("../routes/Cartrouter");
const africanFactsRoutes = require("../routes/africanFactsRoutes");

// Vendor Routes
const vendorauth = require("../routes/Vendorroutes/vendorauth");
const vendorRoutes = require("../routes/Vendorroutes/vendors");
const productRoutes = require("../routes/Vendorroutes/productsRouter");
const vendorDashboardRoutes = require("../routes/Vendorroutes/vendorDashboardRoutes");
const analyticstroutes = require("../routes/Vendorroutes/analyticsRoutes");
const vendorOrdersRoutes = require("../routes/Vendorroutes/vendorOrdersRoutes");
const customerRoutes = require("../routes/Vendorroutes/customerRoutes");

// Rider Routes
const riderAuthRoutes = require("../routes/Riderroutes/riderAuthRoutes");
const riderRoutes = require("../routes/Riderroutes/riderRoutes");
const vendorNotificationRoutes = require("../routes/Vendorroutes/vendornotification");

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
securityHeaders(app);

// ========== SECURITY MIDDLEWARE ==========
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://fra.cloud.appwrite.io"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ========== CORS CONFIGURATION ==========
const corsOptions = {
  origin: (origin, callback) => {
    console.log("CORS Origin: ", origin);
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://nile-mart-backend-2.onrender.com",
      "https://nileflow-com.onrender.com",
      "https://nileflowafrica.com",
      "https://www.nileflowafrica.com",
      "http://localhost:3000",
      "https://nileflow.co.ke",
      "http://localhost:5176",
      "https://new-nile-flow-backend.onrender.com",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-CSRF-Token",
    "X-Transaction-ID",
  ],
  credentials: true,
  exposedHeaders: ["X-CSRF-Token"],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

/* app.use(authLimiter); */ // Apply to auth routes

// ========== REQUEST PARSING ==========
// Preserve raw body for Stripe webhook signature verification
app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      // Store raw body buffer for routes that need it (Stripe webhooks)
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser()); // Apply to all routes
/* app.use(apiLimiter) */ // ========== LOGGING ==========
app.use(
  morgan(":method :url :status :response-time ms - :res[content-length]")
);

// ========== FILE UPLOAD ==========
app.use(
  fileUpload({
    useTempFiles: false,
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    abortOnLimit: true,
  })
);

// ========== APPWRITE INITIALIZATION MIDDLEWARE ==========
app.use(async (req, res, next) => {
  try {
    if (!appwriteService.isConnected) {
      console.log("Initializing Appwrite connection...");
      await appwriteService.initialize();
    }
    next();
  } catch (error) {
    console.error("Appwrite initialization failed:", error.message);

    // Don't crash on health checks
    if (req.path === "/health" || req.path === "/api/health") {
      return next();
    }

    res.status(503).json({
      error: "Service temporarily unavailable",
      code: "APPWRITE_UNAVAILABLE",
      message: "Authentication service is down. Please try again later.",
    });
  }
});

// ========== HEALTH CHECKS ==========
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// ========== DIRECT ROUTE DEFINITIONS ==========
// Vendor Routes
app.use("/api/vendor/auth", /* authLimiter, */ vendorauth);
app.use("/api/admin/auth", /* authLimiter, */ authRoutes); // Changed from /api/admin/auth/signup/customer
app.use("/api/admin/products", adminRouter);
app.use("/api/orders", adminRouter);
app.use("/api/products", adminRouter);
app.use("/api/products", adminRouter);
app.use("/api/deliveries", adminRouter);
app.use("/api/admin/orderStatus", adminRouter);
app.use("/api/admin/addproducts", adminRouter);
app.use("/api/admin/customer-messages", adminRouter);
app.use("/api/admin/staff", staffRoutes);
app.use("/api/admin/careers", careersRoutes);
app.use("/api/admin/newsletter", newsletterRoutes);

// User Routes
app.use("/api", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/customernotifications", customernotifications);
app.use("/api/audit-logs", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/customerauth", ClientRoute);
app.use("/api/customerprofile", ClientRouter);
app.use("/api/update-currencies", ClientRouter);
app.use("/api/payments", PaymentRouter);
app.use("/api/nilemiles", nilemiles);
app.use("/api/nilemart", addressRoutes);
app.use("/api/nilemart/questions", questions);
app.use("/api/nilemart/promotions", Promotion);
app.use("/api/nileflow/passwordchange", passwordRouter);
app.use("/cart", cartRoutes);
app.use("/api/group-orders", groupOrderRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/contact-nile-flow", clientmessages);
app.use("/api/products", productsrouter);
app.use("/api/apply", applyRoutes);
app.use("/api", africanFactsRoutes);
app.use("/api/recommendations", require("../routes/recommendations"));
app.use("/api/nileflow/addresses", addressRoutes);

// Vendor Routes
app.use("/api/vendor/auth", /* authLimiter, */ vendorauth);
app.use("/api/vendors", vendorRoutes);
app.use("/api/vendor/products", productRoutes);
app.use("/api/vendor/notifications", vendorNotificationRoutes);
app.use("/api/vendor", vendorDashboardRoutes);
app.use("/api/vendor", analyticstroutes);
app.use("/api/vendor", vendorOrdersRoutes);
app.use("/api/admin/customers", customerRoutes);

// Subscription & Payment Routes
app.use("/api/subscription", require("../routes/subscriptionRoutes"));
app.use("/api/payments", require("../routes/paymentCallbackRoutes"));
app.use("/api/premium", require("../routes/premiumRoutes"));

// Rider Routes
app.use("/api/rider/auth", riderAuthRoutes);
app.use("/api/rider", riderRoutes);

// ========== ERROR HANDLING MIDDLEWARE ==========
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    code: "INTERNAL_ERROR",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);

  // Handle file upload size limit errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large",
      code: "FILE_TOO_LARGE",
      maxSize: "50MB",
    });
  }

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS policy violation",
      code: "CORS_BLOCKED",
    });
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json(err);
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    requestId: req.headers["x-transaction-id"] || "none",
  });
});

// ========== START SERVER ==========
async function startServer() {
  try {
    console.log("🚀 Starting Nile Mart Backend...");

    // Initialize Appwrite first
    console.log("Initializing Appwrite...");
    await appwriteService.initialize();

    // Initialize subscription cron jobs
    console.log("Initializing subscription services...");
    const SubscriptionCronService = require("../services/subscriptionCronService");
    SubscriptionCronService.initialize();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`
✅ Server running successfully!
📍 Port: ${PORT}
📡 Environment: ${process.env.NODE_ENV || "development"}
🔗 Health Check: http://localhost:${PORT}/health
📚 API Docs: http://localhost:${PORT}/api/health
⏰ Subscription Services: Active
      `);
    });

    // Prevent server from exiting
    server.on("error", (error) => {
      console.error("Server error:", error);
    });

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error("❌ Failed to start server:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // Exit with error code
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
