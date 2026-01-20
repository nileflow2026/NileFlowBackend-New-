// EMERGENCY DEBUG - Add to VERY TOP of index.js
process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("Code:", error.code);
  if (error.fileName) console.error("File:", error.fileName);
  if (error.lineNumber) console.error("Line:", error.lineNumber);

  // Don't exit immediately - let us see the error
  setTimeout(() => {
    console.error("Exiting due to uncaught exception...");
    process.exit(1);
  }, 2000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  if (reason && reason.stack) {
    console.error("Stack:", reason.stack);
  }

  // Don't exit immediately - let us see the error
  setTimeout(() => {
    console.error("Exiting due to unhandled promise rejection...");
    process.exit(1);
  }, 2000);
});

// Enhanced console logging with timestamps
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const timestamp = new Date().toISOString();
  originalLog(`[${timestamp}]`, ...args);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  originalError(`[${timestamp}] ERROR:`, ...args);
};
// Import and configure Express app
let app;
let express, cookieParser, cors, morgan, helmet, fileUpload, rateLimit;
let appwriteService, securityHeaders, authLimiter, apiLimiter;
let validateSignup, validateLogin, healthRoutes;

try {
  console.log("🏗️  Setting up Express application...");
  express = require("express");
  cookieParser = require("cookie-parser");
  cors = require("cors");
  morgan = require("morgan");
  helmet = require("helmet");
  fileUpload = require("express-fileupload");
  rateLimit = require("express-rate-limit");

  console.log("📦 Core dependencies loaded successfully");

  appwriteService = require("../services/AppwriteSessionService");
  securityHeaders = require("../middleware/security");
  const rateLimiterModule = require("../middleware/rate-limiter");
  authLimiter = rateLimiterModule.authLimiter;
  apiLimiter = rateLimiterModule.apiLimiter;

  const validateMiddleware = require("../middleware/validate.middleware");
  validateSignup = validateMiddleware.validateSignup;
  validateLogin = validateMiddleware.validateLogin;

  healthRoutes = require("../routes/health.routes");

  console.log("🔒 Security and middleware loaded successfully");

  app = express();
  console.log("✅ Express app created successfully");
} catch (setupError) {
  console.error("💥 CRITICAL: Failed to set up Express application:");
  console.error("Error:", setupError.message);
  console.error("Stack:", setupError.stack);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Load routes with error handling
console.log("📍 Loading route modules...");
let adminRouter,
  authRoutes,
  userRoutes,
  notificationRoutes,
  customernotifications,
  staffRoutes,
  settingRoutes,
  ClientRoute,
  ClientRouter;
try {
  adminRouter = require("../routes/adminRouter");
  authRoutes = require("../routes/authRoutes");
  userRoutes = require("../routes/userRoutes");
  notificationRoutes = require("../routes/notificationRoutes");
  customernotifications = require("../routes/ClientnotificationsRouter");
  staffRoutes = require("../routes/staffroutes");
  settingRoutes = require("../routes/settingsRouter");
  ClientRoute = require("../routes/ClientauthRouter");
  ClientRouter = require("../routes/ClientRoutes");
  console.log("✅ Core routes loaded successfully");
} catch (routeError) {
  console.error("❌ Failed to load core routes:", routeError.message);
  console.error("Stack:", routeError.stack);
  throw routeError;
}

// Load additional routes
let PaymentRouter,
  nilemiles,
  addressRoutes,
  questions,
  Promotion,
  groupOrderRoutes;
let gamificationRoutes,
  newsletterRoutes,
  clientmessages,
  careersRoutes,
  applyRoutes,
  productsrouter;
let passwordRouter,
  cartRoutes,
  africanFactsRoutes,
  orderTrackingRoutes,
  forgotPasswordRoutes;

try {
  PaymentRouter = require("../routes/paymentrouter");
  nilemiles = require("../routes/reward");
  addressRoutes = require("../routes/addressroutes");
  questions = require("../routes/questionRoutes");
  Promotion = require("../routes/promotionRoutes");
  groupOrderRoutes = require("../routes/groupOrderRoutes");
  gamificationRoutes = require("../routes/gamificationRoutes");
  newsletterRoutes = require("../routes/newsletterRoutes");
  clientmessages = require("../routes/clientmessagerouter");
  careersRoutes = require("../routes/careersRoutes");
  applyRoutes = require("../routes/applyRoutes");
  productsrouter = require("../routes/productsRouter");
  passwordRouter = require("../routes/passwordRoute");
  cartRoutes = require("../routes/Cartrouter");
  africanFactsRoutes = require("../routes/africanFactsRoutes");
  orderTrackingRoutes = require("../routes/orderTrackingRoutes");
  forgotPasswordRoutes = require("../routes/forgotPasswordRoutes");
  console.log("✅ Additional routes loaded successfully");
} catch (additionalRouteError) {
  console.error(
    "⚠️  Some additional routes failed to load:",
    additionalRouteError.message,
  );
  console.error("Server will continue with core functionality only");
}

// Vendor Routes
let vendorauth,
  vendorRoutes,
  productRoutes,
  vendorDashboardRoutes,
  analyticstroutes,
  vendorOrdersRoutes,
  customerRoutes;
try {
  vendorauth = require("../routes/Vendorroutes/vendorauth");
  vendorRoutes = require("../routes/Vendorroutes/vendors");
  productRoutes = require("../routes/Vendorroutes/productsRouter");
  vendorDashboardRoutes = require("../routes/Vendorroutes/vendorDashboardRoutes");
  analyticstroutes = require("../routes/Vendorroutes/analyticsRoutes");
  vendorOrdersRoutes = require("../routes/Vendorroutes/vendorOrdersRoutes");
  customerRoutes = require("../routes/Vendorroutes/customerRoutes");
  console.log("✅ Vendor routes loaded successfully");
} catch (vendorRouteError) {
  console.error("⚠️  Vendor routes failed to load:", vendorRouteError.message);
  console.error("Server will continue without vendor functionality");
}

// Rider Routes
let riderAuthRoutes, riderRoutes, riderTrackingRoutes, vendorNotificationRoutes;
try {
  riderAuthRoutes = require("../routes/Riderroutes/riderAuthRoutes");
  riderRoutes = require("../routes/Riderroutes/riderRoutes");
  riderTrackingRoutes = require("../routes/riderTrackingRoutes");
  vendorNotificationRoutes = require("../routes/Vendorroutes/vendornotification");
  console.log("✅ Rider routes loaded successfully");
} catch (riderRouteError) {
  console.error("⚠️  Rider routes failed to load:", riderRouteError.message);
  console.error("Server will continue without rider functionality");
}

// Configure Express middleware with error handling
console.log("⚙️  Configuring Express middleware...");

try {
  // Security headers
  if (securityHeaders) {
    securityHeaders(app);
    console.log("✅ Security headers configured");
  }
} catch (securityError) {
  console.error("⚠️  Security headers failed:", securityError.message);
}

// ========== SECURITY MIDDLEWARE ==========
try {
  if (helmet) {
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
      }),
    );
    console.log("✅ Helmet security middleware configured");
  }
} catch (helmetError) {
  console.error("⚠️  Helmet middleware failed:", helmetError.message);
  console.log("Server will continue without Helmet security headers");
}

// ========== CORS CONFIGURATION ==========
try {
  if (cors) {
    const corsOptions = {
      origin: (origin, callback) => {
        console.log("🌍 CORS Origin Check: ", origin);
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
          "http://localhost:5176",
          "http://localhost:3000",
          "https://nile-mart-backend-2.onrender.com",
          "https://nileflow-com.onrender.com",
          "https://nileflowafrica.com",
          "https://www.nileflowafrica.com",
          "https://nileflow.co.ke",
          "https://new-nile-flow-backend.onrender.com",
          "https://nileflowvendordashboard.onrender.com",
          "https://nile-flow-adminpanel.onrender.com",
          "https://nile-flow-website.onrender.com",
          "https://admin.nileflowafrica.com",
          "https://vendor.nileflowafrica.com",
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log("✅ CORS: Allowing request with no origin");
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          console.log(`✅ CORS: Allowing origin ${origin}`);
          callback(null, true);
        } else {
          console.warn(`❌ CORS BLOCKED: ${origin} not in allowed origins`);
          console.warn("Allowed origins:", allowedOrigins);
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
        "Cache-Control",
        "Pragma",
      ],
      credentials: true,
      exposedHeaders: ["X-CSRF-Token"],
      optionsSuccessStatus: 200,
      maxAge: 86400, // 24 hours
      preflightContinue: false, // Pass control to the next handler
    };

    app.use(cors(corsOptions));
    console.log("✅ CORS middleware configured");
  }
} catch (corsError) {
  console.error("⚠️  CORS middleware failed:", corsError.message);
  console.log("Server will continue without CORS middleware");
}

// Global CORS headers middleware - ALWAYS set these headers for admin requests
app.use("/api/admin", (req, res, next) => {
  const origin = req.headers.origin;
  console.log(
    `🌐 Global admin CORS middleware - ${req.method} ${req.url} from ${origin}`,
  );

  // Always set CORS headers for admin routes
  if (origin && origin.includes("admin.nileflowafrica.com")) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
    );
    console.log(`✅ Global CORS headers set for admin origin: ${origin}`);
  }
  next();
});

// Global CORS headers middleware - ALWAYS set these headers for vendor requests
app.use("/api/vendor", (req, res, next) => {
  const origin = req.headers.origin;
  console.log(
    `🌐 Global vendor CORS middleware - ${req.method} ${req.url} from ${origin}`,
  );

  // Always set CORS headers for vendor routes
  if (origin && origin.includes("vendor.nileflowafrica.com")) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
    );
    console.log(`✅ Global CORS headers set for vendor origin: ${origin}`);
  }
  next();
});

// Manual CORS debugging and OPTIONS handling
app.use((req, res, next) => {
  console.log(`🔧 ${req.method} ${req.url} from origin: ${req.headers.origin}`);
  console.log(`Request headers:`, JSON.stringify(req.headers, null, 2));

  // Handle preflight OPTIONS requests manually if CORS didn't handle them
  if (req.method === "OPTIONS") {
    console.log("⚡ Handling OPTIONS preflight request");
    const origin = req.headers.origin;
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
      "https://nile-mart-backend-2.onrender.com",
      "https://nileflow-com.onrender.com",
      "https://nileflowafrica.com",
      "https://www.nileflowafrica.com",
      "https://nileflow.co.ke",
      "https://new-nile-flow-backend.onrender.com",
      "https://nileflowvendordashboard.onrender.com",
      "https://nile-flow-adminpanel.onrender.com",
      "https://nile-flow-website.onrender.com",
      "https://admin.nileflowafrica.com",
      "https://vendor.nileflowafrica.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`🎯 Setting OPTIONS headers for origin: ${origin}`);
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,X-Transaction-ID,Cache-Control,Pragma",
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
      console.log("✅ Manual OPTIONS response sent with headers:");
      console.log(
        "  Access-Control-Allow-Origin:",
        res.getHeader("Access-Control-Allow-Origin"),
      );
      console.log(
        "  Access-Control-Allow-Credentials:",
        res.getHeader("Access-Control-Allow-Credentials"),
      );
      return res.status(200).end();
    } else {
      console.log(`❌ OPTIONS request blocked for origin: ${origin}`);
    }
  }

  next();
});

// ========== REQUEST PARSING ==========
try {
  console.log("🔧 Configuring request parsing middleware...");

  // Preserve raw body for Stripe webhook signature verification
  if (express) {
    app.use(
      express.json({
        limit: "50mb",
        verify: (req, res, buf) => {
          // Store raw body buffer for routes that need it (Stripe webhooks)
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  }

  if (cookieParser) {
    app.use(cookieParser()); // Apply to all routes
  }

  console.log("✅ Request parsing middleware configured");
} catch (parsingError) {
  console.error("⚠️  Request parsing middleware failed:", parsingError.message);
} // ========== LOGGING ==========
try {
  if (morgan) {
    app.use(
      morgan(":method :url :status :response-time ms - :res[content-length]"),
    );
    console.log("✅ Morgan logging middleware configured");
  }
} catch (loggingError) {
  console.error("⚠️  Logging middleware failed:", loggingError.message);
}

// ========== FILE UPLOAD ==========
try {
  if (fileUpload) {
    app.use(
      fileUpload({
        useTempFiles: false,
        createParentPath: true,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
        abortOnLimit: true,
      }),
    );
    console.log("✅ File upload middleware configured");
  }
} catch (uploadError) {
  console.error("⚠️  File upload middleware failed:", uploadError.message);
}

// ========== APPWRITE INITIALIZATION MIDDLEWARE ==========
app.use(async (req, res, next) => {
  try {
    if (!appwriteService.isConnected) {
      console.log("🔄 Initializing Appwrite connection for request:", req.path);
      await appwriteService.initialize();
      console.log("✅ Appwrite connection established");
    }
    next();
  } catch (error) {
    console.error("❌ Appwrite initialization failed for request:", req.path);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Don't crash on health checks or status endpoints
    if (
      req.path === "/health" ||
      req.path === "/api/health" ||
      req.path === "/status" ||
      req.path === "/" ||
      req.path.startsWith("/api/cors-test")
    ) {
      console.log(
        "⚠️  Allowing request to continue without Appwrite for:",
        req.path,
      );
      return next();
    }

    res.status(503).json({
      error: "Service temporarily unavailable",
      code: "APPWRITE_UNAVAILABLE",
      message: "Authentication service is down. Please try again later.",
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// Old scheduler removed - now handled in startServer function

// ========== HEALTH CHECKS ==========
// Simple health check that always works
app.get("/", (req, res) => {
  try {
    res.json({
      status: "online",
      service: "Nile Flow Backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: require("../package.json").version || "unknown",
    });
  } catch (error) {
    // Fallback if package.json can't be read
    res.json({
      status: "online",
      service: "Nile Flow Backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "unknown",
    });
  }
});

app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// ========== CORS TEST ENDPOINT ==========
app.get("/api/cors-test", (req, res) => {
  console.log("🧪 CORS Test endpoint hit");
  console.log("Origin:", req.headers.origin);
  console.log("Headers:", req.headers);

  res.json({
    message: "CORS test successful",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: {
      "access-control-allow-origin": res.getHeader(
        "Access-Control-Allow-Origin",
      ),
      "access-control-allow-credentials": res.getHeader(
        "Access-Control-Allow-Credentials",
      ),
    },
  });
});

// Helper function to safely mount routes
function safeMount(path, router, description) {
  try {
    if (router) {
      app.use(path, router);
      console.log(`✅ Mounted: ${description} at ${path}`);
    } else {
      console.log(`⚠️  Skipped: ${description} (router not available)`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to mount ${description} at ${path}:`,
      error.message,
    );
  }
}

// ========== DIRECT ROUTE DEFINITIONS ==========
console.log("🛣️  Mounting routes...");

// Vendor Routes
safeMount(
  "/api/vendor/auth",
  authLimiter ? [authLimiter, vendorauth].filter(Boolean) : vendorauth,
  "Vendor Auth",
);

// Add explicit CORS headers for admin auth routes
app.use("/api/admin/auth", (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "https://admin.nileflowafrica.com",
    "https://nile-flow-adminpanel.onrender.com",
    "https://nileflowafrica.com",
  ];

  if (!origin || allowedOrigins.includes(origin)) {
    res.header(
      "Access-Control-Allow-Origin",
      origin || "https://admin.nileflowafrica.com",
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control",
    );
    console.log(`🔧 Admin auth CORS headers set for origin: ${origin}`);
  }
  next();
});

// Admin Routes
safeMount(
  "/api/admin/auth",
  authLimiter ? [authLimiter, authRoutes].filter(Boolean) : authRoutes,
  "Admin Auth",
);
safeMount("/api/admin/products", adminRouter, "Admin Products");
safeMount("/api/orders", adminRouter, "Orders (Admin)");
safeMount("/api/orders", orderTrackingRoutes, "Order Tracking");
safeMount("/api/products", adminRouter, "Products (Admin)");
safeMount("/api/deliveries", adminRouter, "Deliveries");
safeMount("/api/admin/orderStatus", adminRouter, "Admin Order Status");
safeMount("/api/admin/addproducts", adminRouter, "Admin Add Products");
safeMount(
  "/api/admin/customer-messages",
  adminRouter,
  "Admin Customer Messages",
);
safeMount("/api/admin/staff", staffRoutes, "Admin Staff");
safeMount("/api/admin/careers", careersRoutes, "Admin Careers");
safeMount("/api/admin/newsletter", newsletterRoutes, "Admin Newsletter");

// User Routes
safeMount("/api", userRoutes, "User Routes");
safeMount("/api/notifications", notificationRoutes, "Notifications");
safeMount(
  "/api/customernotifications",
  customernotifications,
  "Customer Notifications",
);

// AI Chat Routes (with fallback)
try {
  safeMount("/api/ai", require("../routes/aiChatRoutes"), "AI Chat");
} catch (aiError) {
  console.log("⚠️  AI Chat routes not available:", aiError.message);
}

safeMount("/api/audit-logs", userRoutes, "Audit Logs");
safeMount("/api/users", userRoutes, "Users");
safeMount("/api/settings", settingRoutes, "Settings");
safeMount("/api/customerauth", ClientRoute, "Customer Auth");
safeMount("/api/customerprofile", ClientRouter, "Customer Profile");
safeMount("/api/update-currencies", ClientRouter, "Update Currencies");
safeMount("/api/payments", PaymentRouter, "Payments");
safeMount("/api/nilemiles", nilemiles, "Nile Miles");
safeMount("/api/nilemart", addressRoutes, "Nile Mart Addresses");
safeMount("/api/nilemart/questions", questions, "Questions");
safeMount("/api/nilemart/promotions", Promotion, "Promotions");
safeMount("/api/nileflow/passwordchange", passwordRouter, "Password Change");
safeMount(
  "/api/nileflowafrica/passwordchange",
  forgotPasswordRoutes,
  "Forgot Password",
);
safeMount("/cart", cartRoutes, "Cart");
safeMount("/api/group-orders", groupOrderRoutes, "Group Orders");
safeMount("/api/gamification", gamificationRoutes, "Gamification");
safeMount("/api/contact-nile-flow", clientmessages, "Contact Messages");
safeMount("/api/products", productsrouter, "Products");
safeMount("/api/apply", applyRoutes, "Apply");
safeMount("/api", africanFactsRoutes, "African Facts");

// Recommendations with fallback
try {
  safeMount(
    "/api/recommendations",
    require("../routes/recommendations"),
    "Recommendations",
  );
} catch (recError) {
  console.log("⚠️  Recommendations routes not available:", recError.message);
}

safeMount("/api/nileflow/addresses", addressRoutes, "Nileflow Addresses");

// Vendor Routes (with safe mounting)
safeMount(
  "/api/vendor/auth",
  authLimiter ? [authLimiter, vendorauth].filter(Boolean) : vendorauth,
  "Vendor Auth (Primary)",
);
safeMount("/api/vendors", vendorRoutes, "Vendor Management");
safeMount("/api/vendor/products", productRoutes, "Vendor Products");
safeMount(
  "/api/vendor/notifications",
  vendorNotificationRoutes,
  "Vendor Notifications",
);
safeMount("/api/vendor", vendorDashboardRoutes, "Vendor Dashboard");
safeMount("/api/vendor", analyticstroutes, "Vendor Analytics");
safeMount("/api/vendor", vendorOrdersRoutes, "Vendor Orders");
safeMount("/api/admin/customers", customerRoutes, "Admin Customers");

// Subscription & Payment Routes (with safe mounting)
try {
  safeMount(
    "/api/subscription",
    require("../routes/subscriptionRoutes"),
    "Subscription",
  );
} catch (subError) {
  console.log("⚠️  Subscription routes not available:", subError.message);
}

try {
  safeMount(
    "/api/payments",
    require("../routes/paymentCallbackRoutes"),
    "Payment Callbacks",
  );
} catch (payError) {
  console.log("⚠️  Payment callback routes not available:", payError.message);
}

try {
  safeMount("/api/premium", require("../routes/premiumRoutes"), "Premium");
} catch (premError) {
  console.log("⚠️  Premium routes not available:", premError.message);
}

// Rider Routes (with safe mounting)
safeMount(
  "/api/rider/auth",
  authLimiter
    ? [authLimiter, riderAuthRoutes].filter(Boolean)
    : riderAuthRoutes,
  "Rider Auth",
);
safeMount("/api/rider", riderRoutes, "Rider Management");
safeMount("/api/rider", riderTrackingRoutes, "Rider Tracking");

console.log("🎯 All routes mounted successfully!");

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

  // Always set CORS headers for all app routes, even on errors
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.includes("admin.nileflowafrica.com") ||
      origin.includes("vendor.nileflowafrica.com") ||
      origin.includes("nileflowafrica.com") ||
      origin.includes("localhost"))
  ) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
    );
    console.log(`🚨 Error handler: CORS headers set for ${origin}`);
  }

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
  // Set CORS headers for all app routes even on 404
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.includes("admin.nileflowafrica.com") ||
      origin.includes("vendor.nileflowafrica.com") ||
      origin.includes("nileflowafrica.com") ||
      origin.includes("localhost"))
  ) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    console.log(`📍 404 handler: CORS headers set for ${origin}`);
  }

  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);

  // Always set CORS headers for all app routes
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.includes("admin.nileflowafrica.com") ||
      origin.includes("vendor.nileflowafrica.com") ||
      origin.includes("nileflowafrica.com") ||
      origin.includes("localhost"))
  ) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
    );
    console.log(`🚨 Final error handler: CORS headers set for ${origin}`);
  }

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
    console.log("Node.js version:", process.version);
    console.log("Environment:", process.env.NODE_ENV || "development");
    console.log("Port:", process.env.PORT || 3000);

    // Check critical environment variables first
    console.log("🔍 Checking environment variables...");
    let env;
    try {
      const envModule = require("./env");
      env = envModule.env;
      console.log("✅ Environment variables loaded successfully");

      // Log critical variables (without exposing secrets)
      console.log("🔍 Environment Check:");
      console.log("  - NODE_ENV:", env.NODE_ENV);
      console.log("  - PORT:", env.PORT);
      console.log(
        "  - APPWRITE_ENDPOINT:",
        env.APPWRITE_ENDPOINT ? "✅ Set" : "❌ Missing",
      );
      console.log(
        "  - APPWRITE_PROJECT_ID:",
        env.APPWRITE_PROJECT_ID ? "✅ Set" : "❌ Missing",
      );
      console.log(
        "  - APPWRITE_API_KEY:",
        env.APPWRITE_API_KEY
          ? "✅ Set (length: " + env.APPWRITE_API_KEY.length + ")"
          : "❌ Missing",
      );
      console.log(
        "  - APPWRITE_DATABASE_ID:",
        env.APPWRITE_DATABASE_ID ? "✅ Set" : "❌ Missing",
      );
    } catch (envError) {
      console.error("❌ Environment validation failed:", envError.message);
      if (envError.details) {
        console.error(
          "Validation details:",
          envError.details
            .map((d) => `${d.path.join(".")}: ${d.message}`)
            .join(", "),
        );
      }
      throw new Error(`Environment validation failed: ${envError.message}`);
    }

    // Initialize Appwrite first
    console.log("Initializing Appwrite...");
    await appwriteService.initialize();
    console.log("✅ Appwrite initialized successfully");

    // Initialize subscription cron jobs
    console.log("Initializing subscription services...");
    let SubscriptionCronService = null;
    try {
      SubscriptionCronService = require("../services/subscriptionCronService");
      await SubscriptionCronService.initialize();
      console.log("✅ Subscription services initialized");
    } catch (subscriptionError) {
      console.error(
        "⚠️  Subscription service failed to initialize:",
        subscriptionError.message,
      );
      console.error(
        "This is non-critical - server will continue without subscription services",
      );
      // Continue without subscription service
    }

    // Initialize newsletter scheduled campaigns processor
    console.log("Initializing newsletter scheduler...");
    let processScheduledCampaigns = null;
    try {
      const newsletterModule = require("../controllers/AdminControllers/newsletterController");
      processScheduledCampaigns = newsletterModule.processScheduledCampaigns;
      console.log("✅ Newsletter controller loaded");
    } catch (newsletterError) {
      console.error(
        "⚠️  Newsletter scheduler failed to initialize:",
        newsletterError.message,
      );
      console.error(
        "This is non-critical - server will continue without newsletter scheduler",
      );
      // Continue without newsletter scheduler
    }

    // Process scheduled campaigns every 2 minutes (with error handling)
    const schedulerInterval = setInterval(
      async () => {
        if (processScheduledCampaigns) {
          try {
            await processScheduledCampaigns();
          } catch (error) {
            console.error("📧 Newsletter scheduler error:", error.message);
          }
        }
      },
      2 * 60 * 1000,
    ); // Check every 2 minutes

    // Run once immediately to check for any pending campaigns (with error handling)
    setTimeout(async () => {
      if (processScheduledCampaigns) {
        try {
          console.log("🔄 Running initial scheduled campaigns check...");
          await processScheduledCampaigns();
          console.log("✅ Initial newsletter check completed");
        } catch (error) {
          console.error("📧 Initial newsletter check error:", error.message);
        }
      }
    }, 10000); // Wait 10 seconds after server start

    console.log("🌐 Starting HTTP server...");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`
✅ 🎉 SERVER STARTED SUCCESSFULLY! 🎉
📍 Port: ${PORT}
📡 Environment: ${process.env.NODE_ENV || "development"}  
🔗 Health Check: http://localhost:${PORT}/health
📚 API Docs: http://localhost:${PORT}/api/health
⏰ Subscription Services: ${SubscriptionCronService ? "Active" : "Inactive"}
📧 Newsletter Scheduler: Active (every 2 minutes)
📍 WebSocket Service: Pending initialization...
🚀 Server is ready to accept connections!
      `);
    });

    // Handle server errors
    server.on("error", (error) => {
      console.error("💥 HTTP Server error:");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("Address:", error.address);
      console.error("Port:", error.port);

      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Try a different port.`,
        );
      } else if (error.code === "EACCES") {
        console.error(`❌ Permission denied to bind to port ${PORT}.`);
      }

      process.exit(1);
    });

    server.on("listening", () => {
      console.log("🎯 Server is now listening for connections");
    });

    // Initialize WebSocket for real-time tracking (with error handling)
    try {
      console.log("Initializing WebSocket service...");
      const socketService = require("../services/socketService");
      socketService.initialize(server);
      console.log("🔌 ✅ WebSocket service initialized for live tracking");
    } catch (socketError) {
      console.error(
        "⚠️  WebSocket service failed to initialize:",
        socketError.message,
      );
      // Continue without WebSocket - server can still function
    }

    // Keep the process alive
    process.stdin.resume();

    console.log("🎯 Server startup completed successfully!");
  } catch (error) {
    console.error("❌ CRITICAL ERROR: Failed to start server:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);

    // Try to identify specific error types
    if (error.message && error.message.includes("ENOTFOUND")) {
      console.error("🌐 DNS Resolution Error - Check network connectivity");
    } else if (error.message && error.message.includes("ECONNREFUSED")) {
      console.error("🔌 Connection Refused - External service may be down");
    } else if (error.message && error.message.includes("ValidationError")) {
      console.error(
        "📝 Environment Variable Validation Error - Check your .env file",
      );
    } else if (error.code === "MODULE_NOT_FOUND") {
      console.error("📦 Missing Dependency - Run npm install");
    }

    console.error("Server will exit in 3 seconds...");

    // Give time to see the error before exiting
    setTimeout(() => {
      process.exit(1);
    }, 3000);
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
