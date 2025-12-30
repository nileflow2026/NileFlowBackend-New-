# Subscription System Fixes - December 23, 2025

## Problems Fixed

### ✅ Problem 1: Payment Confirmed Before User Approval

**Issue**: Premium was granted immediately after STK push, without waiting for user to confirm payment on phone.

**Solution**:

- Subscription now created with `status: "pending"`
- `checkoutRequestId` stored to track the payment request
- User must confirm payment on phone
- M-Pesa callback activates premium only after successful payment
- If user cancels or times out, no premium granted

**Flow**:

1. User clicks subscribe → STK push sent → Returns `status: "pending"`
2. Frontend polls `GET /api/subscription/payment-status/:checkoutRequestId`
3. User confirms on phone → M-Pesa callback → Status changes to `"active"`
4. Premium access granted!

---

### ✅ Problem 2: User Collection Attributes Not Updated

**Issue**: `isPremium`, `subscriptionId`, `startedAt`, `cancelledAt` were `null` in Users collection, but had values in Preferences.

**Solution**: Now updates **both** locations:

- **User Prefs** (for quick access in API)
- **User Collection Document** (for database queries/reports)

**M-Pesa Callback now updates**:

```javascript
// 1. User Prefs
await users.updatePrefs(userId, {
  isPremium: true,
  subscriptionId: "...",
  subscriptionExpiresAt: "...",
  subscriptionStartedAt: "...",
});

// 2. User Collection Document
await db.updateDocument(
  env.APPWRITE_DATABASE_ID,
  env.APPWRITE_USER_COLLECTION_ID,
  userDocId,
  {
    isPremium: true,
    subscriptionId: "...",
    startedAt: "...",
  }
);
```

---

### ✅ Problem 3: Cancel Not Updating subscriptionCancelledAt

**Issue**: When cancelling subscription, `subscriptionCancelledAt` was not showing in Preferences.

**Solution**: Fixed to update both prefs and user document:

```javascript
const cancelledAt = new Date().toISOString();

// Update prefs
await users.updatePrefs(userId, {
  ...user.prefs,
  subscriptionCancelledAt: cancelledAt,
});

// Update user document
await db.updateDocument(..., { cancelledAt });
```

---

## New Endpoint

### GET /api/subscription/payment-status/:checkoutRequestId

Use this to poll payment status after initiating subscription.

**Response**:

```json
{
  "status": "pending" | "active" | "cancelled",
  "isPremium": true | false,
  "expiresAt": "2026-01-22T...",
  "subscriptionId": "sub_..."
}
```

**Frontend polling example**:

```javascript
const response = await api.post("/api/subscription/subscribe", {
  paymentMethod: "mpesa",
  amount: 200,
  currency: "KSH",
  phoneNumber: "254712345678",
});

const { checkoutRequestId } = response.data;

// Poll every 3 seconds
const pollInterval = setInterval(async () => {
  const status = await api.get(
    `/api/subscription/payment-status/${checkoutRequestId}`
  );

  if (status.data.status === "active") {
    clearInterval(pollInterval);
    // Show success message!
  }
}, 3000);

// Stop polling after 2 minutes
setTimeout(() => clearInterval(pollInterval), 120000);
```

---

## Database Schema Updates

### Subscriptions Collection - New Attribute

Add this attribute in Appwrite Console:

| Attribute         | Type   | Size | Required |
| ----------------- | ------ | ---- | -------- |
| checkoutRequestId | string | 255  | No       |

**Or run the setup script**:

```bash
node setup-subscriptions-collection.js
```

### Users Collection - Required Attributes

Ensure your Users collection has these attributes:

| Attribute      | Type         | Required |
| -------------- | ------------ | -------- |
| isPremium      | boolean      | No       |
| subscriptionId | string (255) | No       |
| startedAt      | datetime     | No       |
| cancelledAt    | datetime     | No       |

---

## Testing

### Test M-Pesa Flow

1. **Initiate subscription**:

```bash
POST /api/subscription/subscribe
{
  "paymentMethod": "mpesa",
  "amount": 200,
  "currency": "KSH",
  "phoneNumber": "254712345678"
}
```

Response:

```json
{
  "success": true,
  "status": "pending",
  "checkoutRequestId": "ws_CO_...",
  "message": "Payment request sent to your phone. Please enter your M-Pesa PIN to confirm."
}
```

2. **Check your phone** - M-Pesa STK push appears

3. **Poll payment status**:

```bash
GET /api/subscription/payment-status/ws_CO_...
```

Response (while pending):

```json
{
  "status": "pending",
  "isPremium": false
}
```

4. **Enter M-Pesa PIN** on phone

5. **Poll again** - Status should be `"active"`:

```json
{
  "status": "active",
  "isPremium": true,
  "expiresAt": "2026-01-22T...",
  "subscriptionId": "sub_mpesa_..."
}
```

6. **Verify in Appwrite Console**:
   - Users collection → Check `isPremium`, `subscriptionId`, `startedAt`
   - Users prefs → Check same values
   - Subscriptions collection → Status should be `"active"`

---

## Files Modified

1. **controllers/subscriptionController.js**

   - Changed subscribe to create pending subscription
   - Added `checkPaymentStatus()` method
   - Fixed cancel to update both prefs and document
   - Fixed renew to use `startedAt` instead of `startDate`

2. **controllers/paymentCallbackController.js**

   - Added logic to find pending subscription by `checkoutRequestId`
   - Updates both user prefs and user document on payment confirmation
   - Activates subscription only after successful payment

3. **routes/subscriptionRoutes.js**

   - Added `/payment-status/:checkoutRequestId` route

4. **setup-subscriptions-collection.js** (NEW)
   - Script to add `checkoutRequestId` attribute
   - Verifies all required attributes exist

---

## Migration for Existing Subscriptions

If you have existing active subscriptions that need the `checkoutRequestId`:

```javascript
// In Appwrite Console or via API
// Update existing subscriptions to add checkoutRequestId (can be null for old ones)
// New subscriptions will automatically have this field
```

---

## Summary

✅ Subscriptions now require user confirmation before granting premium  
✅ User collection attributes properly synchronized with preferences  
✅ Cancel endpoint properly updates `subscriptionCancelledAt`  
✅ Frontend can poll payment status with new endpoint  
✅ Complete payment flow: pending → user confirms → callback → active → premium!

---

## Support

If you encounter issues:

1. Check M-Pesa callback logs: `info: Received M-Pesa callback:`
2. Verify `checkoutRequestId` is stored in subscriptions collection
3. Ensure `APPWRITE_USER_COLLECTION_ID` is set in .env
4. Check user document has premium attributes: `isPremium`, `subscriptionId`, `startedAt`, `cancelledAt`
