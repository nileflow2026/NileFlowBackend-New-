# Premium Subscription System - Quick Reference

## 📋 Summary

A complete premium subscription system integrated with Appwrite, M-Pesa, and PayPal.

**Cost**: 200 KSH/month  
**Duration**: 30 days  
**Features**: Free delivery, 2x Nile Miles, exclusive deals

---

## 🗂️ Files Created

| File                                       | Purpose                     |
| ------------------------------------------ | --------------------------- |
| `controllers/subscriptionController.js`    | Main subscription logic     |
| `controllers/paymentCallbackController.js` | Payment webhooks/callbacks  |
| `services/paymentService.js`               | M-Pesa & PayPal integration |
| `middleware/requirePremium.js`             | Premium access control      |
| `routes/subscriptionRoutes.js`             | Subscription endpoints      |
| `routes/paymentCallbackRoutes.js`          | Payment callback endpoints  |
| `utils/subscriptionCron.js`                | Auto-expiry & reminders     |
| `PREMIUM_SUBSCRIPTION_SETUP.md`            | Full documentation          |
| `INTEGRATION_SNIPPET.js`                   | Integration code snippets   |

---

## ⚡ Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
npm install node-cron axios express-validator
```

### 2. Add Environment Variables

```env
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
BACKEND_URL=https://yourdomain.com
```

### 3. Create Appwrite Collection

- Collection name: `subscriptions`
- Attributes: userId, status, amount, currency, paymentMethod, expiresAt, startDate, transactionId
- Indexes on: userId, status, expiresAt

### 4. Update src/index.js

```javascript
// Add imports
const subscriptionRoutes = require("../routes/subscriptionRoutes");
const paymentCallbackRoutes = require("../routes/paymentCallbackRoutes");
const { initializeSubscriptionCrons } = require("../utils/subscriptionCron");

// Mount routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentCallbackRoutes);

// Initialize cron jobs (before app.listen)
initializeSubscriptionCrons();
```

### 5. Test

```bash
# Start server
npm start

# Test subscription endpoint
curl http://localhost:3000/api/subscription/status
```

---

## 🔗 API Endpoints Cheat Sheet

### Subscription Management

| Method | Endpoint                            | Auth      | Description             |
| ------ | ----------------------------------- | --------- | ----------------------- |
| GET    | `/api/subscription/status`          | ✓         | Get subscription status |
| POST   | `/api/subscription/subscribe`       | ✓         | Subscribe to premium    |
| POST   | `/api/subscription/cancel`          | ✓         | Cancel subscription     |
| POST   | `/api/subscription/renew`           | ✓         | Renew subscription      |
| GET    | `/api/subscription/monthly-summary` | ✓ Premium | Get savings summary     |
| GET    | `/api/subscription/premium-deals`   | ✓ Premium | Get premium deals       |

### Payment Callbacks

| Method | Endpoint                           | Auth | Description          |
| ------ | ---------------------------------- | ---- | -------------------- |
| POST   | `/api/payments/mpesa/callback`     | ✗    | M-Pesa callback      |
| GET    | `/api/payments/mpesa/query/:id`    | ✓    | Query M-Pesa status  |
| POST   | `/api/payments/paypal/webhook`     | ✗    | PayPal webhook       |
| POST   | `/api/payments/paypal/capture/:id` | ✓    | Capture PayPal order |

---

## 💻 Usage Examples

### Subscribe to Premium (M-Pesa)

```javascript
POST /api/subscription/subscribe
{
  "paymentMethod": "mpesa",
  "amount": 200,
  "currency": "KSH",
  "phoneNumber": "254712345678"
}
```

### Subscribe to Premium (PayPal)

```javascript
POST /api/subscription/subscribe
{
  "paymentMethod": "paypal",
  "amount": 200,
  "currency": "KSH"
}
// Returns approvalUrl - redirect user to complete payment
```

### Check Premium Status

```javascript
GET /api/subscription/status

// Response
{
  "isPremium": true,
  "expiresAt": "2024-01-22T00:00:00.000Z",
  "subscriptionId": "sub_1234567890"
}
```

---

## 🛡️ Protecting Routes

### Method 1: Require Premium (Block Non-Premium)

```javascript
const { requirePremium } = require("./middleware/requirePremium");

router.get("/premium-only", authMiddleware, requirePremium, controller.action);
```

### Method 2: Check Premium (Allow All)

```javascript
const { checkPremiumStatus } = require("./middleware/requirePremium");

router.get("/mixed-access", authMiddleware, checkPremiumStatus, (req, res) => {
  if (req.isPremium) {
    // Premium user logic
  } else {
    // Regular user logic
  }
});
```

### Method 3: Manual Check in Controller

```javascript
const { users } = require("../services/appwriteService");

async function myController(req, res) {
  const user = await users.get(req.user.userId);
  const isPremium = user.prefs?.isPremium || false;

  // Use isPremium in your logic
}
```

---

## 🤖 Automated Jobs

### Expiry Job

- **Runs**: Daily at midnight (00:00)
- **Action**: Expires subscriptions past their expiry date
- **Updates**: User prefs and subscription records

### Reminder Job

- **Runs**: Daily at 10:00 AM
- **Action**: Sends reminders 3 days before expiry
- **Note**: Notification service needs to be implemented

---

## 🧪 Testing

### Test M-Pesa (Sandbox)

```bash
Phone: 254708374149
PIN: 1234
```

### Test PayPal (Sandbox)

1. Create sandbox accounts at developer.paypal.com
2. Use test credentials in .env
3. Use sandbox accounts for transactions

### Test Flow

```bash
# 1. Check status (non-premium)
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=your_token"

# 2. Subscribe
curl -X POST http://localhost:3000/api/subscription/subscribe \
  -H "Cookie: accessToken=your_token" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"mpesa","amount":200,"currency":"KSH","phoneNumber":"254712345678"}'

# 3. Check status (premium)
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=your_token"

# 4. Access premium feature
curl -X GET http://localhost:3000/api/subscription/premium-deals \
  -H "Cookie: accessToken=your_token"
```

---

## 🔍 Common Integration Points

### Apply Premium Benefits in Checkout

```javascript
const isPremium = user.prefs?.isPremium || false;

// Free delivery for premium
const deliveryFee = isPremium ? 0 : 150;

// 2x Nile Miles for premium
const milesEarned = Math.floor(orderTotal / 10) * (isPremium ? 2 : 1);

// Premium discount if applicable
if (isPremium && product.premiumPrice) {
  price = product.premiumPrice;
}
```

### Show Premium Badge

```javascript
const isPremium = user.prefs?.isPremium || false;

res.json({
  user: {
    ...userData,
    isPremium,
    badges: isPremium ? ["premium"] : [],
  },
});
```

### Premium-Only Products

```javascript
const { requirePremium } = require("./middleware/requirePremium");

router.get(
  "/exclusive-products",
  authMiddleware,
  requirePremium,
  async (req, res) => {
    const products = await getExclusiveProducts();
    res.json(products);
  }
);
```

---

## ⚠️ Important Notes

- Subscription cost is **hardcoded to 200 KSH**
- Subscription period is **30 days**
- Users **keep benefits** until end of period even after cancellation
- Cron jobs require **continuous server uptime**
- Use **PM2 or similar** for production
- **Webhook URLs must be publicly accessible**
- Test thoroughly before going to production

---

## 📞 Support & Resources

- [Full Documentation](./PREMIUM_SUBSCRIPTION_SETUP.md)
- [Integration Snippets](./INTEGRATION_SNIPPET.js)
- [M-Pesa API Docs](https://developer.safaricom.co.ke/docs)
- [PayPal API Docs](https://developer.paypal.com/docs/checkout/)
- [Appwrite Docs](https://appwrite.io/docs)

---

## 🐛 Troubleshooting

### M-Pesa not working?

- ✓ Check phone number format (254XXXXXXXXX)
- ✓ Verify M-Pesa credentials
- ✓ Ensure callback URL is publicly accessible
- ✓ Check server logs for errors

### PayPal not working?

- ✓ Verify PayPal credentials
- ✓ Check redirect URLs match exactly
- ✓ Ensure sandbox accounts have funds
- ✓ Review PayPal dashboard logs

### Subscription not activating?

- ✓ Check Appwrite user preferences
- ✓ Verify subscription collection exists
- ✓ Review server logs
- ✓ Ensure cron job is running

---

**Last Updated**: December 22, 2025  
**Version**: 1.0.0
