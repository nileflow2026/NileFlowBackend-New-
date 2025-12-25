# Premium Subscription System - Setup Guide

This guide explains how to integrate the premium subscription system into your NileFlow backend.

## ✅ Files Created

### Controllers

- **`controllers/subscriptionController.js`** - Handles subscription management (status, subscribe, cancel, renew, etc.)
- **`controllers/paymentCallbackController.js`** - Handles payment callbacks from M-Pesa and PayPal

### Services

- **`services/paymentService.js`** - Payment processing logic for M-Pesa and PayPal

### Middleware

- **`middleware/requirePremium.js`** - Authentication middleware for premium-only features

### Routes

- **`routes/subscriptionRoutes.js`** - Subscription endpoints
- **`routes/paymentCallbackRoutes.js`** - Payment webhook/callback endpoints

### Utilities

- **`utils/subscriptionCron.js`** - Cron jobs for expiring subscriptions and sending reminders

## 🔧 Integration Steps

### 1. Update Your Main Server File (index.js or app.js)

Add the following routes to your Express app:

```javascript
// Import the routes
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentCallbackRoutes = require("./routes/paymentCallbackRoutes");

// Mount the routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentCallbackRoutes);

// Initialize subscription cron jobs
const { initializeSubscriptionCrons } = require("./utils/subscriptionCron");
initializeSubscriptionCrons();
```

### 2. Install Required Dependencies

```bash
npm install node-cron axios express-validator
```

Make sure you already have:

- `@paypal/checkout-server-sdk`
- `node-appwrite`
- `joi`
- `dotenv`

### 3. Setup Environment Variables

Add these to your `.env` file:

```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox  # or production
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or production

# Backend URL (for callbacks)
BACKEND_URL=https://yourdomain.com

# Frontend URL (for PayPal redirects)
FRONTEND_URL=https://yourfrontend.com
```

### 4. Create Appwrite Subscriptions Collection

In your Appwrite console:

1. Go to your database
2. Create a new collection named "subscriptions"
3. Add the following attributes:

| Attribute      | Type     | Size | Required | Default |
| -------------- | -------- | ---- | -------- | ------- |
| userId         | string   | 255  | Yes      | -       |
| status         | string   | 50   | Yes      | -       |
| amount         | integer  | -    | Yes      | -       |
| currency       | string   | 10   | Yes      | -       |
| paymentMethod  | string   | 50   | Yes      | -       |
| expiresAt      | datetime | -    | Yes      | -       |
| startDate      | datetime | -    | Yes      | -       |
| transactionId  | string   | 255  | No       | -       |
| subscriptionId | string   | 255  | No       | -       |
| cancelledAt    | datetime | -    | No       | -       |
| renewedAt      | datetime | -    | No       | -       |

4. Create indexes:

   - `userId_idx` on `userId`
   - `status_idx` on `status`
   - `expiresAt_idx` on `expiresAt`

5. Set permissions:

   - Read: Users (user can read their own subscriptions)
   - Create/Update/Delete: Server-side only

6. Add the collection ID to your `.env`:

```env
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id
```

### 5. Update User Preferences Schema

User premium status is stored in Appwrite user preferences. The following fields are used:

```javascript
{
  isPremium: boolean,
  subscriptionId: string,
  subscriptionExpiresAt: string (ISO date),
  subscriptionStartedAt: string (ISO date),
  subscriptionCancelledAt: string (ISO date) or null
}
```

These are automatically managed by the subscription controller.

## 📡 API Endpoints

### Subscription Management

#### Get Subscription Status

```
GET /api/subscription/status
Authentication: Required
```

Response:

```json
{
  "isPremium": true,
  "expiresAt": "2024-01-22T00:00:00.000Z",
  "subscriptionId": "sub_1234567890",
  "expired": false
}
```

#### Subscribe to Premium

```
POST /api/subscription/subscribe
Authentication: Required
Body: {
  "paymentMethod": "mpesa" | "paypal",
  "amount": 200,
  "currency": "KSH",
  "phoneNumber": "254712345678" // Required for M-Pesa
}
```

Response (M-Pesa):

```json
{
  "success": true,
  "subscriptionId": "sub_mpesa_1234567890",
  "expiresAt": "2024-01-22T00:00:00.000Z",
  "message": "Payment request sent. Please check your phone to complete payment.",
  "paymentDetails": {
    "checkoutRequestId": "ws_CO_22122023123456789",
    "merchantRequestId": "12345-67890-12345"
  }
}
```

Response (PayPal):

```json
{
  "success": true,
  "subscriptionId": "sub_paypal_1234567890",
  "expiresAt": "2024-01-22T00:00:00.000Z",
  "message": "PayPal payment initiated. Please complete payment.",
  "paymentDetails": {
    "orderId": "ORDER123456",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=...",
    "status": "CREATED"
  }
}
```

#### Cancel Subscription

```
POST /api/subscription/cancel
Authentication: Required
```

Response:

```json
{
  "success": true,
  "message": "Subscription cancelled. Benefits will remain active until 1/22/2024",
  "expiresAt": "2024-01-22T00:00:00.000Z"
}
```

#### Renew Subscription

```
POST /api/subscription/renew
Authentication: Required
Body: {
  "paymentMethod": "mpesa" | "paypal",
  "amount": 200,
  "currency": "KSH",
  "phoneNumber": "254712345678" // Required for M-Pesa
}
```

#### Get Monthly Summary

```
GET /api/subscription/monthly-summary
Authentication: Required (Premium users only)
```

Response:

```json
{
  "totalSavings": 450,
  "deliverySavings": 300,
  "milesBonus": 100,
  "exclusiveDeals": 50,
  "subscriptionCost": 200,
  "netSavings": 250,
  "ordersCount": 3
}
```

#### Get Premium Deals

```
GET /api/subscription/premium-deals
Authentication: Required (Premium users only)
```

Response:

```json
[
  {
    "$id": "product123",
    "name": "Premium Product",
    "price": 1000,
    "premiumPrice": 800,
    "image": "https://...",
    "description": "...",
    "category": "electronics"
  }
]
```

### Payment Callbacks

#### M-Pesa Callback (Called by Safaricom)

```
POST /api/payments/mpesa/callback
Authentication: None (public endpoint)
```

#### Query M-Pesa Transaction

```
GET /api/payments/mpesa/query/:checkoutRequestId
Authentication: Required
```

#### PayPal Webhook (Called by PayPal)

```
POST /api/payments/paypal/webhook
Authentication: None (public endpoint)
```

#### Capture PayPal Order

```
POST /api/payments/paypal/capture/:orderId
Authentication: Required
```

## 🔒 Protecting Premium Features

### Example 1: Require Premium Middleware

```javascript
const { requirePremium } = require("./middleware/requirePremium");

// Only premium users can access this route
router.get(
  "/premium-feature",
  authMiddleware,
  requirePremium,
  controller.premiumFeature
);
```

### Example 2: Optional Premium Check

```javascript
const { checkPremiumStatus } = require("./middleware/requirePremium");

// All users can access, but behavior differs for premium
router.get("/products", authMiddleware, checkPremiumStatus, (req, res) => {
  if (req.isPremium) {
    // Show premium prices
  } else {
    // Show regular prices
  }
});
```

### Example 3: In Controller Logic

```javascript
static async someEndpoint(req, res) {
  const user = await users.get(req.user.userId);
  const isPremium = user.prefs?.isPremium || false;

  if (isPremium) {
    // Apply premium benefits
    deliveryFee = 0;
    milesMultiplier = 2;
  } else {
    deliveryFee = 150;
    milesMultiplier = 1;
  }

  // ... rest of logic
}
```

## ⏰ Cron Jobs

The system includes two automated jobs:

### 1. Subscription Expiry Job

- **Schedule**: Daily at midnight (00:00)
- **Function**: Expires subscriptions that have passed their expiry date
- **Action**: Updates user preferences and subscription records

### 2. Subscription Reminder Job

- **Schedule**: Daily at 10:00 AM
- **Function**: Sends reminders to users 3 days before expiration
- **Action**: (TODO) Send notification/email to users

## 🧪 Testing

### Test M-Pesa Payment (Sandbox)

1. Use Safaricom's test credentials
2. Test phone number: `254708374149`
3. Test PIN: `1234`

### Test PayPal Payment (Sandbox)

1. Create sandbox accounts at https://developer.paypal.com
2. Use test credentials in your `.env`
3. Use PayPal's test accounts for transactions

### Test Subscription Flow

```bash
# 1. Get status (should be non-premium)
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=your_token"

# 2. Subscribe
curl -X POST http://localhost:3000/api/subscription/subscribe \
  -H "Cookie: accessToken=your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "mpesa",
    "amount": 200,
    "currency": "KSH",
    "phoneNumber": "254712345678"
  }'

# 3. Check status again (should be premium)
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=your_token"

# 4. Try premium feature
curl -X GET http://localhost:3000/api/subscription/premium-deals \
  -H "Cookie: accessToken=your_token"
```

## 🔐 Security Considerations

1. **Webhook Verification**: Implement signature verification for M-Pesa and PayPal webhooks
2. **Rate Limiting**: Add rate limiting to payment endpoints
3. **Idempotency**: The subscription controller checks for existing active subscriptions
4. **Logging**: All payment operations are logged for audit trails
5. **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Production Checklist

- [ ] Update `.env` with production M-Pesa credentials
- [ ] Update `.env` with production PayPal credentials
- [ ] Configure production callback URLs
- [ ] Set up SSL certificates for webhook endpoints
- [ ] Test payment flows thoroughly
- [ ] Set up monitoring for failed payments
- [ ] Configure notification service for reminders
- [ ] Set up error alerting
- [ ] Review and set appropriate rate limits
- [ ] Backup subscription data regularly
- [ ] Test cron jobs in production environment

## 📞 M-Pesa Callback URL Setup

Your M-Pesa callback URL should be publicly accessible:

```
https://yourdomain.com/api/payments/mpesa/callback
```

Register this URL in your M-Pesa Daraja API portal under your app's callback URLs.

## 💳 PayPal Webhook Setup

1. Go to https://developer.paypal.com/dashboard
2. Select your app
3. Add webhook URL: `https://yourdomain.com/api/payments/paypal/webhook`
4. Subscribe to these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`

## 📚 Additional Resources

- [M-Pesa Daraja API Documentation](https://developer.safaricom.co.ke/docs)
- [PayPal Checkout Integration](https://developer.paypal.com/docs/checkout/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Node-cron Documentation](https://github.com/node-cron/node-cron)

## 🆘 Troubleshooting

### M-Pesa Issues

**Problem**: STK Push not appearing on phone

- Check phone number format (should be 254XXXXXXXXX)
- Verify M-Pesa credentials in `.env`
- Check if user has sufficient balance
- Verify callback URL is publicly accessible

**Problem**: Callback not received

- Check server logs for incoming requests
- Verify callback URL is registered in Daraja portal
- Ensure endpoint is publicly accessible (use ngrok for testing)

### PayPal Issues

**Problem**: Payment not completing

- Check PayPal credentials
- Verify redirect URLs match exactly
- Check PayPal sandbox accounts have sufficient funds
- Review PayPal transaction logs in developer dashboard

### Subscription Issues

**Problem**: Subscription not activating after payment

- Check Appwrite user preferences
- Verify subscription collection exists and has correct permissions
- Review server logs for errors
- Check if cron job is running

## 📝 Notes

- Subscription cost is hardcoded to 200 KSH
- Subscription period is 30 days
- Users retain premium benefits until end of paid period even after cancellation
- Cron jobs require the server to be running continuously
- Consider using a process manager like PM2 for production
