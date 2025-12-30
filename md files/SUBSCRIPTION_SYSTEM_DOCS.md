# Nile Flow Premium Subscription System - Production Documentation

## Overview

Production-ready subscription system with auto-renewal, email notifications, payment provider integration (M-Pesa & Stripe), and comprehensive monitoring.

## Features Implemented

### ✅ Core Subscription Flow

- Pending → Active → Expired/Cancelled state machine
- M-Pesa STK Push integration with callback verification
- Stripe Checkout integration with webhook handling
- Subscription document synchronization with user prefs and user collection

### ✅ Auto-Renewal System

- **7-day reminder**: Sent 7 days before subscription expires
- **3-day reminder**: Sent 3 days before subscription expires
- **Automatic renewal**: Processes payment on expiry date if not cancelled
- **Grace period**: 24-hour grace period before hard expiry
- **Failure handling**: Sends payment failure emails with recovery instructions

### ✅ Email Notifications

All emails use professional templates with responsive design:

1. **Welcome Email**: Sent immediately after successful subscription activation
2. **7-Day Reminder**: Sent 7 days before renewal
3. **3-Day Reminder**: Sent 3 days before renewal (with urgency styling)
4. **Renewal Confirmation**: Sent after successful auto-renewal
5. **Payment Failure**: Sent if renewal payment fails

### ✅ Production-Ready Features

- **Rate Limiting**: Prevents abuse on subscription endpoints
- **Input Validation**: Comprehensive validation and sanitization
- **Metrics Tracking**: Real-time subscription success rates and health monitoring
- **Idempotency**: Prevents duplicate subscriptions
- **Error Handling**: Graceful degradation and compensation logic
- **Logging**: Comprehensive audit trail for all subscription events
- **Security**: Webhook signature verification, JWT authentication

## Architecture

### Services

```
services/
├── subscriptionEmailService.js      # Email templates and sending
├── subscriptionCronService.js       # Auto-renewal and reminder cron jobs
├── subscriptionValidation.js        # Input validation and business rules
├── subscriptionMetrics.js           # Real-time metrics tracking
├── paymentService.js                # M-Pesa and Stripe payment processing
└── appwriteService.js               # Database operations
```

### Cron Jobs

```javascript
// Daily at 6:00 AM - Check for expiring subscriptions
cron.schedule("0 6 * * *", checkExpiringSubscriptions);

// Daily at 2:00 AM - Process auto-renewals
cron.schedule("0 2 * * *", processAutoRenewals);

// Hourly - Expire overdue subscriptions
cron.schedule("0 * * * *", expireOverdueSubscriptions);
```

### Subscription States

```
PENDING → (payment confirmed) → ACTIVE
ACTIVE → (user cancels) → CANCELLED
ACTIVE → (auto-renewal fails) → EXPIRED
ACTIVE → (auto-renewal succeeds) → RENEWED
```

## Configuration

### Required Environment Variables

```env
# Appwrite
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id
APPWRITE_USER_COLLECTION_ID=your_users_collection_id

# M-Pesa
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox|production
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# Application
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### Database Schema - Subscriptions Collection

Required Attributes:

```javascript
{
  userId: string (255, required),
  status: string (50, required), // pending, active, cancelled, expired
  amount: integer (required),
  currency: string (10, required),
  paymentMethod: string (50, required), // mpesa, stripe
  expiresAt: datetime (required),
  startedAt: datetime (required),
  transactionId: string (255),
  subscriptionId: string (255),
  checkoutRequestId: string (255),
  cancelledAt: datetime,
  renewedAt: datetime,

  // Auto-renewal tracking
  sevenDayReminderSent: boolean (default: false),
  threeDayReminderSent: boolean (default: false),
  autoRenewed: boolean (default: false),
  renewalFailed: boolean (default: false),
  renewalFailureReason: string (500),
  renewalFailedAt: datetime,
  lastRenewalTransactionId: string (255),

  // Audit fields
  expiredAt: datetime,
  stripeEventId: string (255),
  paymentConfirmedAt: datetime
}
```

Required Indexes:

```javascript
- userId (for user queries)
- status (for status filtering)
- expiresAt (for cron job queries)
- checkoutRequestId (for callback matching)
- transactionId (for webhook matching)
```

## API Endpoints

### User-Facing Endpoints

#### Subscribe to Premium

```http
POST /api/subscription/subscribe
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentMethod": "mpesa|stripe",
  "amount": 200,
  "currency": "KSH",
  "phoneNumber": "254700000000" // Required for M-Pesa
}

Response:
{
  "success": true,
  "status": "pending",
  "checkoutRequestId": "ws_CO...",
  "checkoutUrl": "https://checkout.stripe.com/...", // For Stripe
  "message": "Payment request sent..."
}
```

#### Check Payment Status

```http
GET /api/subscription/payment-status/:checkoutRequestId
Authorization: Bearer <jwt_token>

Response:
{
  "status": "pending|active",
  "isPremium": false|true,
  "expiresAt": "2026-01-22T...",
  "subscriptionId": "sub_..."
}
```

#### Get Subscription Status

```http
GET /api/subscription/status
Authorization: Bearer <jwt_token>

Response:
{
  "isPremium": true,
  "expiresAt": "2026-01-22T...",
  "subscriptionId": "sub_...",
  "expired": false
}
```

#### Cancel Subscription

```http
POST /api/subscription/cancel
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Subscription cancelled. Benefits will remain active until Jan 22, 2026",
  "expiresAt": "2026-01-22T..."
}
```

### Admin/Monitoring Endpoints

#### System Metrics

```http
GET /api/subscription/metrics

Response:
{
  "realtime": {
    "subscriptionAttempts": 150,
    "subscriptionSuccesses": 145,
    "subscriptionFailures": 5,
    "subscriptionSuccessRate": "96.67%",
    "renewalAttempts": 20,
    "renewalSuccesses": 18,
    "renewalSuccessRate": "90.00%",
    "paymentProviderErrors": {
      "mpesa": 2,
      "stripe": 1
    },
    "emailFailures": 3
  },
  "database": {
    "activeSubscriptions": 450,
    "pendingSubscriptions": 15,
    "cancelledSubscriptions": 50,
    "expiredSubscriptions": 100
  },
  "healthy": true,
  "timestamp": "2025-12-25T..."
}
```

### Webhook Endpoints

#### M-Pesa Callback

```http
POST /api/payments/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "ResultCode": 0,
      "CheckoutRequestID": "ws_CO...",
      "CallbackMetadata": { ... }
    }
  }
}
```

#### Stripe Webhook

```http
POST /api/payments/stripe/webhook
Stripe-Signature: t=...,v1=...
Content-Type: application/json

{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": { ... }
}
```

## Testing

### Manual Testing Checklist

#### New Subscription

- [ ] Subscribe with M-Pesa → STK push received
- [ ] Complete payment on phone → subscription activated
- [ ] Welcome email received
- [ ] User prefs updated (isPremium: true)
- [ ] User collection document updated
- [ ] Subscription document created with correct expiry

#### Auto-Renewal

- [ ] Create subscription with expiry in 7 days
- [ ] Verify 7-day reminder sent
- [ ] Change expiry to 3 days → 3-day reminder sent
- [ ] Change expiry to tomorrow → auto-renewal triggered
- [ ] Renewal email sent
- [ ] Subscription extended by 30 days

#### Cancellation

- [ ] Cancel active subscription
- [ ] Premium access remains until expiry
- [ ] No renewal reminders sent
- [ ] No auto-renewal attempted

#### Edge Cases

- [ ] Duplicate subscription attempt → rejected
- [ ] Invalid phone number → validation error
- [ ] Payment failure → failure email sent
- [ ] Expired subscription → status updated to expired

### Load Testing

```bash
# Test 100 concurrent subscriptions
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
   -p subscribe.json \
   https://api.yourdomain.com/api/subscription/subscribe
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Subscription Success Rate**: Alert if < 95%
2. **Renewal Success Rate**: Alert if < 90%
3. **Payment Provider Errors**: Alert if > 50/day
4. **Email Delivery Rate**: Alert if < 98%
5. **Pending Subscriptions**: Alert if stale > 1 hour

### Log Levels

- **INFO**: Normal operations (subscriptions, renewals)
- **WARN**: Recoverable errors (email failures, pending checks)
- **ERROR**: Critical failures (payment errors, database errors)

### Health Check

```http
GET /api/health

Response:
{
  "status": "healthy",
  "services": {
    "appwrite": "connected",
    "stripe": "available",
    "mpesa": "available",
    "email": "available"
  },
  "subscriptionSystem": "active"
}
```

## Security

### Implemented Controls

✅ JWT authentication on all user endpoints
✅ Rate limiting (5 subscriptions per 15 mins)
✅ Input validation and sanitization
✅ Webhook signature verification (Stripe)
✅ HTTPS enforced in production
✅ No sensitive data in logs
✅ Idempotency keys for payments

### Recommended Additional Controls

⚠️ M-Pesa IP whitelist verification
⚠️ Redis distributed lock for cron jobs (multi-instance)
⚠️ PCI DSS compliance audit (if handling cards directly)

## Deployment

### Pre-Deployment Checklist

1. [ ] All environment variables configured
2. [ ] Database indexes created
3. [ ] Webhook endpoints registered with providers
4. [ ] Email templates tested
5. [ ] Rate limits configured
6. [ ] Monitoring dashboards set up
7. [ ] Alert thresholds configured
8. [ ] Backup procedures verified
9. [ ] Rollback plan documented
10. [ ] Load testing completed

### Post-Deployment Verification

1. [ ] Health check passes
2. [ ] Metrics endpoint accessible
3. [ ] Test subscription successful
4. [ ] Webhooks receiving events
5. [ ] Cron jobs running on schedule
6. [ ] Logs flowing to monitoring system

## Maintenance

### Daily Tasks

- Check payment success rates
- Review failed renewal queue
- Monitor error logs

### Weekly Tasks

- Audit subscription state consistency
- Review cron job execution times
- Check email delivery rates

### Monthly Tasks

- Review churn metrics
- Analyze payment method success rates
- Update exchange rates (if using live rates)

### Quarterly Tasks

- Security audit
- Load testing
- Disaster recovery drill

## Known Limitations

1. **Fixed Exchange Rate**: 1 USD = 130 KSH (hardcoded)

   - **Impact**: May lose/gain money if rates change significantly
   - **Mitigation**: Use live exchange rate API or adjust pricing

2. **Stripe Checkout (not Subscriptions API)**: Uses one-time checkout sessions

   - **Impact**: Auto-renewal requires re-initiating checkout
   - **Mitigation**: Implement Stripe Subscriptions API with stored payment methods

3. **M-Pesa Auto-Renewal**: Requires user to have phone accessible

   - **Impact**: User must approve each renewal STK push
   - **Mitigation**: Offer alternative payment method or saved card option

4. **Single-Instance Cron Jobs**: No distributed locking
   - **Impact**: Running multiple instances could cause duplicate processing
   - **Mitigation**: Use Redis distributed lock in production

## Troubleshooting

### Subscription Not Activating

1. Check webhook delivery in Stripe/M-Pesa dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` or M-Pesa callback URL
3. Check server logs for webhook errors
4. Verify subscription document status in Appwrite

### Reminder Emails Not Sending

1. Check `RESEND_API_KEY` is valid
2. Verify cron jobs are running: check logs for "Running subscription expiry check..."
3. Check `sevenDayReminderSent` / `threeDayReminderSent` flags

### Auto-Renewal Failing

1. Check user has valid payment method on file
2. Verify M-Pesa phone number is correct
3. Check renewal failure logs
4. Verify payment provider credentials

## Support

For technical issues:

- Check logs: `tail -f logs/combined.log`
- Review metrics: `GET /api/subscription/metrics`
- Contact: engineering@nileflowafrica.com

---

**Version**: 2.0  
**Last Updated**: December 25, 2025  
**Author**: Backend Engineering Team
