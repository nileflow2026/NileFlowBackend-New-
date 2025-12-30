# Stripe Subscription Setup Guide

## ✅ What Was Added

### 1. Stripe Payment Method in Subscription Controller

- Replace PayPal with Stripe in subscription endpoints
- Support for both M-Pesa and Stripe payment methods

### 2. Stripe Webhook Handler

- Added `handleStripeWebhook` to PaymentCallbackController
- Handles `checkout.session.completed` event
- Activates premium subscription after payment confirmation
- Updates both user prefs and user collection document

### 3. Payment Service Integration

- Added `processStripePayment` method
- Creates Stripe checkout session
- Converts KSH to USD (1 USD = 130 KSH)
- Returns checkout URL for frontend redirect

---

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SYB9CJABwlNBb9Pz8SrKevMWzqvwKcQtvfOysAV9VWR1sjjcPD9DLsQ994ZNfa6qSn9Wt9LIxUapZogsfoJyF8b00PRQXztys
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL for Stripe redirects
FRONTEND_URL=http://localhost:5173
```

---

## 📡 Stripe Webhook Configuration

### 1. Get Webhook Secret from Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL:

   ```
   https://your-domain.com/api/payments/stripe/webhook
   ```

   Or for local testing with ngrok:

   ```
   https://your-ngrok-url.ngrok.io/api/payments/stripe/webhook
   ```

4. Select events to listen to:
   - ✅ `checkout.session.completed`
5. Click **Add endpoint**

6. Copy the **Signing secret** (starts with `whsec_`)

7. Add to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...your_secret...
   ```

### 2. Test Webhook Locally

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook

# This will give you a webhook secret like: whsec_...
# Add it to your .env file
```

---

## 🔄 Payment Flow

### Stripe Payment Flow

1. **User initiates subscription**:

   ```javascript
   POST /api/subscription/subscribe
   {
     "paymentMethod": "stripe",
     "amount": 200,
     "currency": "KSH"
   }
   ```

2. **Backend creates pending subscription**:

   - Creates subscription record with `status: "pending"`
   - Creates Stripe checkout session
   - Returns `checkoutUrl`

3. **Frontend redirects to Stripe**:

   ```javascript
   const response = await api.post('/api/subscription/subscribe', { ... });
   window.location.href = response.data.checkoutUrl;
   ```

4. **User completes payment on Stripe hosted page**

5. **Stripe sends webhook to backend**:

   - Event: `checkout.session.completed`
   - Backend verifies signature
   - Finds pending subscription by `userId`
   - Updates subscription to `active`
   - Updates user prefs: `isPremium: true`
   - Updates user collection document

6. **Stripe redirects user back to success page**:

   ```
   http://localhost:5173/subscription/success?session_id=cs_...
   ```

7. **Frontend can verify payment**:
   ```javascript
   GET / api / subscription / status;
   // Returns: { isPremium: true, expiresAt: "..." }
   ```

---

## 🧪 Testing

### Test Stripe Payment

1. **Start your backend**:

   ```bash
   npm start
   ```

2. **Start ngrok** (for webhook testing):

   ```bash
   ngrok http 3000
   ```

3. **Update webhook URL in Stripe Dashboard** with ngrok URL

4. **Test subscription**:

   ```bash
   POST http://localhost:3000/api/subscription/subscribe
   {
     "paymentMethod": "stripe",
     "amount": 200,
     "currency": "KSH"
   }
   ```

5. **Use Stripe test card**:

   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. **Check logs** for webhook:

   ```
   info: Received Stripe webhook
   info: Stripe Event Type: checkout.session.completed
   info: Processing Stripe subscription payment for user ...
   info: User ... premium activated via Stripe until ...
   ```

7. **Verify premium status**:
   ```bash
   GET /api/subscription/status
   ```

---

## 📝 Frontend Integration

### Subscribe with Stripe

```javascript
const subscribeWithStripe = async () => {
  try {
    const response = await api.post("/api/subscription/subscribe", {
      paymentMethod: "stripe",
      amount: 200,
      currency: "KSH",
    });

    if (response.data.success && response.data.checkoutUrl) {
      // Redirect to Stripe checkout
      window.location.href = response.data.checkoutUrl;
    }
  } catch (error) {
    console.error("Subscription failed:", error);
  }
};
```

### Handle Success Page

```javascript
// In your /subscription/success page
const SuccessPage = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Poll subscription status
    const checkStatus = setInterval(async () => {
      const response = await api.get("/api/subscription/status");

      if (response.data.isPremium) {
        clearInterval(checkStatus);
        // Show success message and redirect to dashboard
        navigate("/dashboard");
      }
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => clearInterval(checkStatus), 30000);

    return () => clearInterval(checkStatus);
  }, []);

  return <div>Processing your payment...</div>;
};
```

---

## 🔐 Security Notes

1. **Never expose Stripe Secret Key** in frontend code
2. **Always verify webhook signatures** (done automatically)
3. **Use HTTPS in production** for webhook endpoints
4. **Test webhooks thoroughly** before going live
5. **Handle idempotency** - Stripe may send duplicate events

---

## 🐛 Troubleshooting

### Webhook not receiving events

- Check ngrok is running and forwarding to correct port
- Verify webhook URL in Stripe Dashboard matches ngrok URL
- Check STRIPE_WEBHOOK_SECRET is correct
- Look for errors in backend logs

### Subscription not activating

- Check pending subscription exists in database
- Verify userId in Stripe metadata matches user in database
- Check user collection has required attributes (isPremium, subscriptionId, etc.)
- Look for errors in webhook handler logs

### "Webhook Error: No signatures found"

- Webhook secret is incorrect
- Using wrong endpoint (should be `/api/payments/stripe/webhook`)
- Body parser interfering with raw body (webhook route should use raw body)

---

## 📊 Database Collections

### Subscriptions Collection

Required attributes:

- `userId` (string, required)
- `status` (string, required) - "pending", "active", "cancelled"
- `amount` (integer, required)
- `currency` (string, required)
- `paymentMethod` (string, required) - "mpesa", "stripe"
- `expiresAt` (datetime, required)
- `startedAt` (datetime, required)
- `transactionId` (string, optional) - Stripe session ID or M-Pesa transaction ID
- `subscriptionId` (string, optional)
- `checkoutRequestId` (string, optional) - For M-Pesa or Stripe session tracking
- `stripeEventId` (string, optional) - For idempotency
- `paymentConfirmedAt` (datetime, optional)
- `cancelledAt` (datetime, optional)
- `renewedAt` (datetime, optional)

### Users Collection

Required attributes for premium:

- `isPremium` (boolean, optional)
- `subscriptionId` (string, optional)
- `startedAt` (datetime, optional)
- `cancelledAt` (datetime, optional)

---

## 🎉 Summary

✅ Stripe payment method integrated  
✅ Webhook handler for automatic premium activation  
✅ Pending subscription system (payment must be confirmed)  
✅ Both user prefs and user collection updated  
✅ Support for M-Pesa and Stripe payment methods  
✅ Proper error handling and logging  
✅ Test mode ready with Stripe test cards

Your subscription system now supports both M-Pesa (mobile money) and Stripe (card payments)!
