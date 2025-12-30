// INTEGRATION SNIPPET FOR src/index.js
// Add these lines to your src/index.js file

// ============================================
// 1. ADD IMPORTS (Add near the top with other route imports)
// ============================================
const subscriptionRoutes = require("../routes/subscriptionRoutes");
const paymentCallbackRoutes = require("../routes/paymentCallbackRoutes");
const { initializeSubscriptionCrons } = require("../utils/subscriptionCron");

// ============================================
// 2. MOUNT ROUTES (Add with other app.use() route definitions)
// ============================================
// Premium Subscription Routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentCallbackRoutes);

// ============================================
// 3. INITIALIZE CRON JOBS (Add before app.listen())
// ============================================
// Initialize subscription cron jobs
initializeSubscriptionCrons();

// ============================================
// 4. COMPLETE EXAMPLE OF WHERE TO ADD IN YOUR index.js
// ============================================
/*
// ... existing imports ...
const africanFactsRoutes = require("../routes/africanFactsRoutes");

// ADD HERE: Import subscription routes
const subscriptionRoutes = require("../routes/subscriptionRoutes");
const paymentCallbackRoutes = require("../routes/paymentCallbackRoutes");
const { initializeSubscriptionCrons } = require("../utils/subscriptionCron");

// ... existing middleware setup ...

// ========== DIRECT ROUTE DEFINITIONS ==========
// ... existing routes ...
app.use("/api", africanFactsRoutes);

// ADD HERE: Mount subscription routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentCallbackRoutes);

// ... existing routes ...

// ========== ERROR HANDLING MIDDLEWARE ==========
// ... existing error handlers ...

// ADD HERE: Initialize cron jobs before starting server
// Initialize subscription cron jobs
console.log("Initializing subscription cron jobs...");
initializeSubscriptionCrons();

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
*/

// ============================================
// 5. VERIFY YOUR .ENV FILE HAS THESE VARIABLES
// ============================================
/*
# Appwrite Collections (add if missing)
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id_here
APPWRITE_PRODUCTS_COLLECTION_ID=your_products_collection_id_here

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# URLs
BACKEND_URL=https://yourdomain.com
FRONTEND_URL=https://yourfrontend.com
*/

// ============================================
// 6. INSTALL REQUIRED PACKAGES
// ============================================
/*
Run these commands:

npm install node-cron axios express-validator

Make sure you already have:
- @paypal/checkout-server-sdk
- node-appwrite
- joi
- dotenv
*/

// ============================================
// 7. EXAMPLE USAGE IN OTHER ROUTES
// ============================================
/*
// Example 1: Protect a route with premium requirement
const { requirePremium } = require('../middleware/requirePremium');

router.get('/premium-feature', 
  authMiddleware, 
  requirePremium, 
  async (req, res) => {
    // Only premium users can access this
    res.json({ message: 'Welcome premium user!' });
  }
);

// Example 2: Optional premium check
const { checkPremiumStatus } = require('../middleware/requirePremium');

router.get('/products', 
  authMiddleware, 
  checkPremiumStatus, 
  async (req, res) => {
    if (req.isPremium) {
      // Apply premium pricing
      const discount = 0.2; // 20% off
    } else {
      // Regular pricing
      const discount = 0;
    }
    // ... rest of logic
  }
);

// Example 3: Check premium in controller
const { users } = require('../services/appwriteService');

async function myController(req, res) {
  const userId = req.user.userId || req.user.$id;
  const user = await users.get(userId);
  const isPremium = user.prefs?.isPremium || false;
  
  const deliveryFee = isPremium ? 0 : 150; // Free delivery for premium
  const milesMultiplier = isPremium ? 2 : 1; // 2x miles for premium
  
  // ... use these values in your logic
}
*/
