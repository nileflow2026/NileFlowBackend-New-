# Premium Subscription System - Visual Architecture

## System Components Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         NILEFLOW BACKEND                           │
│                    Premium Subscription System                     │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  • Web App (React/Vue)                                              │
│  • Mobile App (React Native)                                        │
│  • Admin Dashboard                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS Requests
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ROUTING LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Express.js Routes                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /api/subscription/*     (subscriptionRoutes.js)            │   │
│  │    ├── GET  /status                                         │   │
│  │    ├── POST /subscribe                                      │   │
│  │    ├── POST /cancel                                         │   │
│  │    ├── POST /renew                                          │   │
│  │    ├── GET  /monthly-summary                               │   │
│  │    └── GET  /premium-deals                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /api/payments/*         (paymentCallbackRoutes.js)        │   │
│  │    ├── POST /mpesa/callback                                │   │
│  │    ├── GET  /mpesa/query/:id                              │   │
│  │    ├── POST /paypal/webhook                               │   │
│  │    └── POST /paypal/capture/:id                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────┬───────────────┬────────────────────────────┘
                         │               │
                         │               │
            ┌────────────▼──────────┐   │
            │  authMiddleware       │   │
            │  (Authentication)     │   │
            └────────────┬──────────┘   │
                         │               │
            ┌────────────▼──────────┐   │
            │  requirePremium       │   │
            │  (Premium Check)      │   │
            └────────────┬──────────┘   │
                         │               │
                         ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SubscriptionController (subscriptionController.js)          │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  • getStatus()         - Get user's premium status     │ │  │
│  │  │  • subscribe()         - Process new subscription      │ │  │
│  │  │  • cancel()            - Cancel subscription           │ │  │
│  │  │  • renew()             - Renew subscription            │ │  │
│  │  │  • getMonthlySummary() - Calculate savings            │ │  │
│  │  │  • getPremiumDeals()   - Get exclusive offers         │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PaymentCallbackController (paymentCallbackController.js)   │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  • handleMpesaCallback()     - Process M-Pesa results │ │  │
│  │  │  • queryMpesaTransaction()   - Check payment status   │ │  │
│  │  │  • handlePayPalWebhook()     - Process PayPal events  │ │  │
│  │  │  • capturePayPalOrder()      - Complete PayPal payment│ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PaymentService (paymentService.js)                          │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  M-Pesa Integration:                                   │ │  │
│  │  │  • processMpesaPayment()     - STK Push                │ │  │
│  │  │  • getMpesaAccessToken()     - OAuth token             │ │  │
│  │  │  • queryMpesaTransaction()   - Status check            │ │  │
│  │  │                                                         │ │  │
│  │  │  PayPal Integration:                                   │ │  │
│  │  │  • processPayPalPayment()    - Create order            │ │  │
│  │  │  • capturePayPalPayment()    - Capture funds           │ │  │
│  │  │                                                         │ │  │
│  │  │  Utilities:                                            │ │  │
│  │  │  • verifyPaymentCallback()   - Verify webhooks         │ │  │
│  │  │  • cancelRecurring()         - Cancel auto-renewal     │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────┬─────────────────────────────────┬────────────────────────────┘
        │                                 │
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│   M-Pesa Daraja     │         │   PayPal API        │
│   (Safaricom)       │         │                     │
│                     │         │                     │
│  • STK Push API     │         │  • Orders API       │
│  • Query API        │         │  • Payments API     │
│  • OAuth API        │         │  • Webhooks         │
└─────────────────────┘         └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Appwrite Services (appwriteService.js)                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Users Service:                                        │ │  │
│  │  │  • users.get()         - Fetch user                    │ │  │
│  │  │  • users.updatePrefs() - Update premium status         │ │  │
│  │  │                                                         │ │  │
│  │  │  Database Service:                                     │ │  │
│  │  │  • db.createDocument() - Create subscription record    │ │  │
│  │  │  • db.updateDocument() - Update subscription           │ │  │
│  │  │  • db.listDocuments()  - Query subscriptions           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        APPWRITE CLOUD                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  Users Collection          │  │  Subscriptions Collection    │  │
│  │  ┌──────────────────────┐  │  │  ┌────────────────────────┐ │  │
│  │  │  User Preferences:   │  │  │  │  • userId              │ │  │
│  │  │  • isPremium         │  │  │  │  • status              │ │  │
│  │  │  • subscriptionId    │  │  │  │  • amount              │ │  │
│  │  │  • expiresAt         │  │  │  │  • currency            │ │  │
│  │  │  • startedAt         │  │  │  │  • paymentMethod       │ │  │
│  │  │  • cancelledAt       │  │  │  │  • expiresAt           │ │  │
│  │  └──────────────────────┘  │  │  │  • transactionId       │ │  │
│  └────────────────────────────┘  │  │  • cancelledAt         │ │  │
│                                   │  └────────────────────────┘ │  │
│                                   └──────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  Products Collection       │  │  Orders Collection           │  │
│  │  ┌──────────────────────┐  │  │  ┌────────────────────────┐ │  │
│  │  │  • premiumDeal       │  │  │  │  • userId              │ │  │
│  │  │  • premiumPrice      │  │  │  │  • total               │ │  │
│  │  │  • premiumEligible   │  │  │  │  • premiumDiscount     │ │  │
│  │  └──────────────────────┘  │  │  │  • deliveryFee         │ │  │
│  └────────────────────────────┘  │  │  • milesEarned         │ │  │
│                                   │  └────────────────────────┘ │  │
│                                   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOBS LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Subscription Cron Jobs (subscriptionCron.js)                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Expiry Job (Daily at 00:00):                         │ │  │
│  │  │  1. Query expired subscriptions                        │ │  │
│  │  │  2. Update user preferences (isPremium = false)        │ │  │
│  │  │  3. Update subscription status (status = expired)      │ │  │
│  │  │  4. Send expiration notification                       │ │  │
│  │  │                                                         │ │  │
│  │  │  Reminder Job (Daily at 10:00):                        │ │  │
│  │  │  1. Query subscriptions expiring in 3 days            │ │  │
│  │  │  2. Send reminder notifications                        │ │  │
│  │  │  3. Log reminder sent                                  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  requirePremium (requirePremium.js)                          │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Strict Mode (requirePremium):                         │ │  │
│  │  │  • Check user authentication                           │ │  │
│  │  │  • Fetch user from Appwrite                           │ │  │
│  │  │  • Verify isPremium = true                            │ │  │
│  │  │  • Check subscription not expired                      │ │  │
│  │  │  • Block if not premium (403)                         │ │  │
│  │  │  • Allow if premium + attach to req                   │ │  │
│  │  │                                                         │ │  │
│  │  │  Soft Mode (checkPremiumStatus):                       │ │  │
│  │  │  • Check premium status                                │ │  │
│  │  │  • Attach isPremium to request                         │ │  │
│  │  │  • Always allow through (non-blocking)                │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Subscribe Flow (M-Pesa)

```
User                    Backend                 M-Pesa              Appwrite
  │                        │                       │                   │
  ├─POST /subscribe────────>                       │                   │
  │  {method: mpesa,       │                       │                   │
  │   phone: 254712...}    │                       │                   │
  │                        │                       │                   │
  │                        ├─Validate request      │                   │
  │                        │                       │                   │
  │                        ├─Check user exists─────────────────────────>
  │                        │                       │                   │
  │                        <─User data─────────────────────────────────┤
  │                        │                       │                   │
  │                        ├─Get M-Pesa token──────>                   │
  │                        │                       │                   │
  │                        <─Access token──────────┤                   │
  │                        │                       │                   │
  │                        ├─STK Push request──────>                   │
  │                        │  (200 KSH)            │                   │
  │                        │                       │                   │
  │                        <─CheckoutRequestID─────┤                   │
  │                        │                       │                   │
  <─Response: Check phone──┤                       │                   │
  │  {checkoutRequestId}   │                       │                   │
  │                        │                       │                   │
User enters PIN on phone  │                       │                   │
  │                        │                       │                   │
  │                        │                       ├─Process payment   │
  │                        │                       │                   │
  │                        <─Callback (Result)─────┤                   │
  │                        │                       │                   │
  │                        ├─Update user prefs────────────────────────>
  │                        │  {isPremium: true}    │                   │
  │                        │                       │                   │
  │                        ├─Create subscription───────────────────────>
  │                        │  record               │                   │
  │                        │                       │                   │
  │                        <─Success───────────────────────────────────┤
  │                        │                       │                   │
User is now premium       │                       │                   │
```

### Check Premium Status Flow

```
User                    Middleware              Appwrite
  │                        │                       │
  ├─GET /premium-deals────>                       │
  │  (with auth token)     │                       │
  │                        │                       │
  │                        ├─Verify token          │
  │                        │                       │
  │                        ├─Get user──────────────>
  │                        │                       │
  │                        <─User data─────────────┤
  │                        │  {prefs: {isPremium}} │
  │                        │                       │
  │                        ├─Check isPremium       │
  │                        ├─Check expiresAt       │
  │                        │                       │
  │          ┌─────────────┴─────────────┐         │
  │          │                           │         │
  │      isPremium?                  NOT premium   │
  │          │                           │         │
  │         YES                          │         │
  │          │                           │         │
  │          ├─Attach to req             │         │
  │          ├─next()                    │         │
  │          │                           └─403 Error
  │          │                                     │
  │          ├─Controller executes                 │
  │          │                                     │
  <──────────┤                                     │
  │  Premium content                               │
```

### Subscription Expiry Flow (Cron)

```
Cron Job                Database               Appwrite
  │                        │                       │
  ├─Trigger (00:00)        │                       │
  │                        │                       │
  ├─Query expired──────────────────────────────────>
  │  subscriptions         │                       │
  │  (expiresAt < now)     │                       │
  │                        │                       │
  <─List of expired────────────────────────────────┤
  │  subscriptions         │                       │
  │                        │                       │
  ├─FOR EACH subscription  │                       │
  │   │                    │                       │
  │   ├─Get user───────────────────────────────────>
  │   │                    │                       │
  │   <─User data──────────────────────────────────┤
  │   │                    │                       │
  │   ├─Update prefs───────────────────────────────>
  │   │  {isPremium: false}│                       │
  │   │                    │                       │
  │   ├─Update subscription────────────────────────>
  │   │  {status: expired} │                       │
  │   │                    │                       │
  │   ├─Log expiration     │                       │
  │   │                    │                       │
  │   └─Send notification  │                       │
  │   (TODO)               │                       │
  │                        │                       │
  ├─Log completion         │                       │
  │                        │                       │
```

## File Dependencies Graph

```
src/index.js
    │
    ├─► routes/subscriptionRoutes.js
    │       │
    │       ├─► controllers/subscriptionController.js
    │       │       │
    │       │       ├─► services/appwriteService.js
    │       │       ├─► services/paymentService.js
    │       │       │       │
    │       │       │       ├─► services/paypal.js
    │       │       │       └─► axios (external)
    │       │       │
    │       │       └─► utils/logger.js
    │       │
    │       └─► middleware/requirePremium.js
    │               │
    │               └─► services/appwriteService.js
    │
    ├─► routes/paymentCallbackRoutes.js
    │       │
    │       └─► controllers/paymentCallbackController.js
    │               │
    │               ├─► services/appwriteService.js
    │               ├─► services/paymentService.js
    │               └─► utils/logger.js
    │
    └─► utils/subscriptionCron.js
            │
            ├─► services/appwriteService.js
            ├─► utils/logger.js
            └─► node-cron (external)
```

## Environment Configuration Map

```
.env File
    │
    ├─► APPWRITE_*
    │   ├─► APPWRITE_ENDPOINT
    │   ├─► APPWRITE_PROJECT_ID
    │   ├─► APPWRITE_API_KEY
    │   ├─► APPWRITE_DATABASE_ID
    │   ├─► APPWRITE_SUBSCRIPTIONS_COLLECTION_ID    [NEW]
    │   └─► APPWRITE_PRODUCTS_COLLECTION_ID         [NEW]
    │
    ├─► MPESA_*
    │   ├─► MPESA_CONSUMER_KEY                      [NEW]
    │   ├─► MPESA_CONSUMER_SECRET                   [NEW]
    │   ├─► MPESA_SHORTCODE                         [NEW]
    │   ├─► MPESA_PASSKEY                           [NEW]
    │   ├─► MPESA_ENVIRONMENT                       [NEW]
    │   └─► MPESA_CALLBACK_URL                      [NEW]
    │
    ├─► PAYPAL_*
    │   ├─► PAYPAL_CLIENT_ID                        [NEW]
    │   ├─► PAYPAL_CLIENT_SECRET                    [NEW]
    │   └─► PAYPAL_MODE                             [NEW]
    │
    └─► URLs
        ├─► BACKEND_URL
        └─► FRONTEND_URL
```

---

**Legend:**

- `[NEW]` = New environment variable added
- `├─>` = Imports/depends on
- `│` = Connection/flow
- `▼` = Data flow direction
