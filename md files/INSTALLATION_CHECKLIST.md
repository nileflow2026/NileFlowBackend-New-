# Premium Subscription System - Installation & Setup Script

## ✅ Complete Checklist

### 1. Install Required Packages

```bash
npm install node-cron axios express-validator
```

Verify installation:

```bash
npm list node-cron axios express-validator
```

### 2. Environment Variables Setup

Add these to your `.env` file:

```env
# ============================================
# PREMIUM SUBSCRIPTION CONFIGURATION
# ============================================

# Appwrite Collections
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=
APPWRITE_PRODUCTS_COLLECTION_ID=

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# PayPal API Configuration
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Backend & Frontend URLs
BACKEND_URL=https://yourdomain.com
FRONTEND_URL=https://yourfrontend.com
```

### 3. Create Appwrite Subscriptions Collection

#### Using Appwrite Console:

1. Navigate to your Appwrite project
2. Go to Databases → Your Database → Create Collection
3. Collection Name: `subscriptions`
4. Collection ID: (copy this to APPWRITE_SUBSCRIPTIONS_COLLECTION_ID)

#### Add Attributes:

| Attribute      | Type     | Size | Required | Array | Default |
| -------------- | -------- | ---- | -------- | ----- | ------- |
| userId         | string   | 255  | Yes      | No    | -       |
| status         | string   | 50   | Yes      | No    | active  |
| amount         | integer  | -    | Yes      | No    | -       |
| currency       | string   | 10   | Yes      | No    | KSH     |
| paymentMethod  | string   | 50   | Yes      | No    | -       |
| expiresAt      | datetime | -    | Yes      | No    | -       |
| startDate      | datetime | -    | Yes      | No    | -       |
| transactionId  | string   | 255  | No       | No    | -       |
| subscriptionId | string   | 255  | No       | No    | -       |
| cancelledAt    | datetime | -    | No       | No    | -       |
| renewedAt      | datetime | -    | No       | No    | -       |

#### Create Indexes:

1. **userId_idx**: userId (ASC)
2. **status_idx**: status (ASC)
3. **expiresAt_idx**: expiresAt (ASC)
4. **userId_status_idx**: userId (ASC), status (ASC) [Composite]

#### Set Permissions:

**Read Access**:

- Role: Users (user can read their own records)
- Filter: `userId = $userId`

**Create/Update/Delete Access**:

- Role: Server (API Key only)

### 4. Update Products Collection (if it exists)

Add these attributes to your products collection:

| Attribute       | Type    | Size | Required | Default |
| --------------- | ------- | ---- | -------- | ------- |
| premiumDeal     | boolean | -    | No       | false   |
| premiumPrice    | float   | -    | No       | -       |
| premiumEligible | boolean | -    | No       | false   |

### 5. Integrate into src/index.js

Add these three sections to your `src/index.js`:

#### A. Add Imports (near top with other route imports)

```javascript
const subscriptionRoutes = require("../routes/subscriptionRoutes");
const paymentCallbackRoutes = require("../routes/paymentCallbackRoutes");
const { initializeSubscriptionCrons } = require("../utils/subscriptionCron");
```

#### B. Mount Routes (with other app.use() statements)

```javascript
// Premium Subscription Routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payments", paymentCallbackRoutes);
```

#### C. Initialize Cron Jobs (BEFORE app.listen())

```javascript
// Initialize subscription cron jobs
console.log("Initializing subscription cron jobs...");
initializeSubscriptionCrons();
```

### 6. Configure M-Pesa Daraja Portal

1. Log in to https://developer.safaricom.co.ke
2. Go to My Apps → Select your app
3. Configure callbacks:
   - **Validation URL**: `https://yourdomain.com/api/payments/mpesa/callback`
   - **Confirmation URL**: `https://yourdomain.com/api/payments/mpesa/callback`
4. Get your credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode (Paybill or Till Number)
   - Passkey (from Lipa Na M-Pesa Online section)

### 7. Configure PayPal Developer Portal

1. Log in to https://developer.paypal.com/dashboard
2. Create or select your app
3. Get credentials:
   - Client ID
   - Secret
4. Add webhook:
   - URL: `https://yourdomain.com/api/payments/paypal/webhook`
   - Events to subscribe:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `BILLING.SUBSCRIPTION.CREATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`

### 8. Test the Installation

#### Start Server:

```bash
npm start
```

#### Test Health:

```bash
curl http://localhost:3000/health
```

#### Test Subscription Endpoint:

```bash
curl http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=your_test_token"
```

Expected response (for non-premium user):

```json
{
  "isPremium": false,
  "expiresAt": null,
  "subscriptionId": null,
  "expired": false
}
```

### 9. Verify Cron Jobs

Check server logs on startup. You should see:

```
Initializing subscription cron jobs...
Subscription expiry cron job scheduled (runs daily at midnight)
Subscription reminder cron job scheduled (runs daily at 10:00 AM)
Subscription cron jobs initialized successfully
```

### 10. Production Deployment Checklist

- [ ] Update all environment variables to production values
- [ ] Change MPESA_ENVIRONMENT to "production"
- [ ] Change PAYPAL_MODE to "production"
- [ ] Update BACKEND_URL to production domain
- [ ] Update FRONTEND_URL to production domain
- [ ] Ensure SSL certificates are valid
- [ ] Test M-Pesa payments with real phone numbers
- [ ] Test PayPal payments with real accounts
- [ ] Verify webhooks are receiving callbacks
- [ ] Monitor cron jobs (logs should show daily execution)
- [ ] Set up error alerting
- [ ] Configure backup for subscription data
- [ ] Test subscription expiry process
- [ ] Document payment flow for support team

## 🧪 Testing Scenarios

### Test 1: Subscribe with M-Pesa

```bash
curl -X POST http://localhost:3000/api/subscription/subscribe \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token" \
  -d '{
    "paymentMethod": "mpesa",
    "amount": 200,
    "currency": "KSH",
    "phoneNumber": "254708374149"
  }'
```

Expected: STK push sent to phone, user enters PIN, payment processed, subscription activated.

### Test 2: Subscribe with PayPal

```bash
curl -X POST http://localhost:3000/api/subscription/subscribe \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token" \
  -d '{
    "paymentMethod": "paypal",
    "amount": 200,
    "currency": "KSH"
  }'
```

Expected: Receive PayPal approval URL, redirect user, user approves, capture payment.

### Test 3: Access Premium Feature

```bash
curl -X GET http://localhost:3000/api/subscription/premium-deals \
  -H "Cookie: accessToken=your_premium_user_token"
```

Expected: List of premium deals returned.

### Test 4: Cancel Subscription

```bash
curl -X POST http://localhost:3000/api/subscription/cancel \
  -H "Cookie: accessToken=your_premium_user_token"
```

Expected: Subscription marked as cancelled but benefits remain until expiry.

## 📊 Monitoring

### Database Queries to Monitor

```javascript
// Check active subscriptions count
db.listDocuments(databaseId, subscriptionsCollectionId, [
  Query.equal("status", "active"),
]);

// Check expiring soon (next 7 days)
const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
db.listDocuments(databaseId, subscriptionsCollectionId, [
  Query.equal("status", "active"),
  Query.lessThan("expiresAt", weekFromNow.toISOString()),
]);

// Check cancelled subscriptions
db.listDocuments(databaseId, subscriptionsCollectionId, [
  Query.equal("status", "cancelled"),
]);
```

### Key Metrics to Track

- Total active subscriptions
- Monthly recurring revenue (MRR)
- Subscription churn rate
- Average subscription lifetime
- Payment success rate
- Failed payment reasons
- Most popular payment method
- Premium feature usage

## 🆘 Troubleshooting

### Issue: "Module not found: node-cron"

**Solution**: Run `npm install node-cron`

### Issue: "APPWRITE_SUBSCRIPTIONS_COLLECTION_ID is not defined"

**Solution**: Add the collection ID to your `.env` file

### Issue: M-Pesa callback not received

**Solution**:

1. Ensure callback URL is publicly accessible (use ngrok for local testing)
2. Check M-Pesa portal configuration
3. Verify server logs for incoming requests

### Issue: PayPal payment not completing

**Solution**:

1. Check PayPal credentials
2. Verify redirect URLs match exactly
3. Check PayPal sandbox account balance
4. Review PayPal developer dashboard logs

### Issue: Cron jobs not running

**Solution**:

1. Check if `initializeSubscriptionCrons()` is called
2. Verify server is running continuously
3. Check server logs for cron job initialization messages
4. Consider using PM2 for process management

## 📝 Next Steps

1. ✅ Complete installation checklist above
2. ✅ Test all endpoints locally
3. ✅ Deploy to staging environment
4. ✅ Test with real payment credentials (sandbox)
5. ✅ Implement notification service for reminders
6. ✅ Set up monitoring and alerting
7. ✅ Document for support team
8. ✅ Deploy to production
9. ✅ Monitor and optimize

## 📧 Support

For issues or questions:

- Check [PREMIUM_SUBSCRIPTION_SETUP.md](./PREMIUM_SUBSCRIPTION_SETUP.md) for detailed documentation
- Review [PREMIUM_QUICK_REFERENCE.md](./PREMIUM_QUICK_REFERENCE.md) for quick answers
- Check server logs for error messages
- Review Appwrite console for database issues
- Check M-Pesa/PayPal portals for payment issues

---

**Installation Date**: ******\_\_\_******  
**Installed By**: ******\_\_\_******  
**Environment**: [ ] Development [ ] Staging [ ] Production  
**Status**: [ ] Complete [ ] In Progress [ ] Pending
