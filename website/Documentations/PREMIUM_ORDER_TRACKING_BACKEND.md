# Premium Order Tracking - Backend Implementation Guide

## Overview

Currently, the frontend premium features are fully implemented and working, but the backend is not tracking premium orders. When users place orders, the monthly summary shows:

- `ordersCount: 0`
- `totalSavings: 0`
- `deliverySavings: 0`
- `milesBonus: 0`

This guide explains how to implement order tracking so premium savings are calculated and displayed.

---

## Problem Diagnosis

**Console Output from Frontend:**

```javascript
{
  totalSavings: 0,
  deliverySavings: 0,
  milesBonus: 0,
  milesBonusValue: 0,
  exclusiveDeals: 0,
  ordersCount: 0,          // ❌ No orders tracked
  isPremium: true,         // ✅ User is premium
  subscriptionCost: 200,
  netSavings: -200
}
```

**Root Cause:** When premium users place orders (Cash on Delivery, M-Pesa, Stripe), the backend is not:

1. Recording that the order belongs to a premium user
2. Calculating and storing the savings (delivery, discount, miles)
3. Aggregating these values for the monthly summary endpoint

---

## Required Database Schema Changes

### 1. Add Premium Tracking to Orders Table

Add these columns to your `orders` table:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_premium_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_delivery_savings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_miles_bonus INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_miles_total INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_month VARCHAR(7); -- Format: '2025-12'
```

**Column Descriptions:**

- `user_id`: Links order to the authenticated user
- `is_premium_order`: Flag to identify premium orders
- `premium_discount_amount`: How much discount was applied (5% or 10%)
- `premium_delivery_savings`: What user saved on shipping (if free delivery applied)
- `premium_miles_bonus`: Extra miles from 2x multiplier
- `premium_miles_total`: Total miles earned (base + bonus)
- `order_month`: For efficient monthly aggregation queries

---

## Implementation Steps

### Step 1: Update Order Creation Endpoints

You need to update these three payment endpoints:

- `POST /api/payments/cash-on-delivery`
- `POST /api/payments/mpesa`
- `POST /api/payments/stripe-intent`

**Add Premium Tracking Logic:**

```javascript
// Example for Cash on Delivery endpoint
router.post("/cash-on-delivery", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const { cartItems, shippingAddress, subtotal, shippingFee, total } =
      req.body;

    // 1. Check if user is premium
    const premiumStatus = await checkUserPremiumStatus(userId);
    const isPremium = premiumStatus.isPremium;

    // 2. Calculate premium savings
    let premiumData = {
      isPremiumOrder: isPremium,
      discountAmount: 0,
      deliverySavings: 0,
      milesBonus: 0,
      milesTotal: 0,
    };

    if (isPremium) {
      // Calculate discount (10% for >1000 KSH, 5% for >500 KSH)
      if (subtotal >= 1000) {
        premiumData.discountAmount = subtotal * 0.1;
      } else if (subtotal >= 500) {
        premiumData.discountAmount = subtotal * 0.05;
      }

      // Calculate delivery savings (if free delivery was applied)
      // Assuming standard shipping is 200 KSH
      const standardShippingFee = 200;
      if (shippingFee === 0 && subtotal >= 500) {
        premiumData.deliverySavings = standardShippingFee;
      }

      // Calculate miles bonus (2x multiplier)
      const baseMiles = Math.floor(subtotal / 10);
      const totalMiles = baseMiles * 2; // Premium gets 2x
      premiumData.milesBonus = baseMiles; // The extra miles
      premiumData.milesTotal = totalMiles;
    } else {
      // Regular user gets 1x miles
      premiumData.milesTotal = Math.floor(subtotal / 10);
    }

    // 3. Create order with premium data
    const order = await createOrder({
      userId,
      cartItems,
      shippingAddress,
      subtotal,
      shippingFee,
      total,
      paymentMethod: "cash_on_delivery",
      isPremiumOrder: premiumData.isPremiumOrder,
      premiumDiscountAmount: premiumData.discountAmount,
      premiumDeliverySavings: premiumData.deliverySavings,
      premiumMilesBonus: premiumData.milesBonus,
      premiumMilesTotal: premiumData.milesTotal,
      orderMonth: new Date().toISOString().slice(0, 7), // '2025-12'
    });

    // 4. Award miles to user
    if (premiumData.milesTotal > 0) {
      await awardMilesToUser(userId, premiumData.milesTotal);
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
      premiumBenefits: isPremium
        ? {
            discountSaved: premiumData.discountAmount,
            deliverySaved: premiumData.deliverySavings,
            milesEarned: premiumData.milesTotal,
            milesBonus: premiumData.milesBonus,
          }
        : null,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});
```

---

### Step 2: Helper Functions

**Check Premium Status:**

```javascript
async function checkUserPremiumStatus(userId) {
  // Query your premium_subscriptions table
  const subscription = await db.query(
    `SELECT * FROM premium_subscriptions 
     WHERE user_id = $1 
     AND status = 'active' 
     AND expires_at > NOW()`,
    [userId]
  );

  return {
    isPremium: subscription.rows.length > 0,
    expiresAt: subscription.rows[0]?.expires_at || null,
  };
}
```

**Award Miles to User:**

```javascript
async function awardMilesToUser(userId, miles) {
  // Update user's miles balance
  await db.query(
    `UPDATE users 
     SET nile_miles = nile_miles + $1,
         total_miles_earned = total_miles_earned + $1
     WHERE id = $2`,
    [miles, userId]
  );

  // Create miles transaction record
  await db.query(
    `INSERT INTO miles_transactions (user_id, amount, type, description, created_at)
     VALUES ($1, $2, 'earned', 'Order purchase', NOW())`,
    [userId, miles]
  );
}
```

---

### Step 3: Update Monthly Summary Endpoint

Update `GET /api/subscription/monthly-summary` to aggregate order data:

```javascript
router.get("/monthly-summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check premium status
    const premiumStatus = await checkUserPremiumStatus(userId);
    if (!premiumStatus.isPremium) {
      return res.json({
        isPremium: false,
        totalSavings: 0,
        deliverySavings: 0,
        milesBonus: 0,
        milesBonusValue: 0,
        exclusiveDeals: 0,
        ordersCount: 0,
        subscriptionCost: 200,
        netSavings: -200,
      });
    }

    // 2. Get current month in format '2025-12'
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 3. Aggregate all premium orders for this month
    const result = await db.query(
      `SELECT 
        COUNT(*) as orders_count,
        COALESCE(SUM(premium_discount_amount), 0) as total_discount_savings,
        COALESCE(SUM(premium_delivery_savings), 0) as total_delivery_savings,
        COALESCE(SUM(premium_miles_bonus), 0) as total_miles_bonus
       FROM orders
       WHERE user_id = $1
       AND is_premium_order = true
       AND order_month = $2
       AND status != 'cancelled'`,
      [userId, currentMonth]
    );

    const data = result.rows[0];

    // 4. Calculate totals
    const deliverySavings = parseFloat(data.total_delivery_savings) || 0;
    const discountSavings = parseFloat(data.total_discount_savings) || 0;
    const milesBonus = parseInt(data.total_miles_bonus) || 0;

    // Miles bonus value: 100 miles = 10 KSH, so 1 mile = 0.1 KSH
    const milesBonusValue = milesBonus * 0.1;

    // Total savings = delivery + discounts + miles value
    const totalSavings = deliverySavings + discountSavings + milesBonusValue;

    const subscriptionCost = 200;
    const netSavings = totalSavings - subscriptionCost;

    // 5. Return summary
    res.json({
      isPremium: true,
      totalSavings: Math.round(totalSavings * 100) / 100,
      deliverySavings: Math.round(deliverySavings * 100) / 100,
      discountSavings: Math.round(discountSavings * 100) / 100,
      milesBonus: milesBonus,
      milesBonusValue: Math.round(milesBonusValue * 100) / 100,
      exclusiveDeals: 0, // Placeholder for future feature
      ordersCount: parseInt(data.orders_count) || 0,
      subscriptionCost: subscriptionCost,
      netSavings: Math.round(netSavings * 100) / 100,
      currentMonth: currentMonth,
    });
  } catch (error) {
    console.error("Monthly summary error:", error);
    res.status(500).json({ error: "Failed to fetch monthly summary" });
  }
});
```

---

### Step 4: Apply Same Logic to M-Pesa and Stripe

**For M-Pesa Callback:**

```javascript
// In your M-Pesa callback handler
router.post("/mpesa/callback", async (req, res) => {
  // ... existing M-Pesa verification ...

  // After payment verification succeeds:
  const userId = order.userId;
  const premiumStatus = await checkUserPremiumStatus(userId);

  if (premiumStatus.isPremium) {
    // Calculate and update order with premium data
    const premiumData = calculatePremiumSavings(
      order.subtotal,
      order.shippingFee
    );

    await db.query(
      `UPDATE orders SET
        is_premium_order = true,
        premium_discount_amount = $1,
        premium_delivery_savings = $2,
        premium_miles_bonus = $3,
        premium_miles_total = $4
       WHERE id = $5`,
      [
        premiumData.discountAmount,
        premiumData.deliverySavings,
        premiumData.milesBonus,
        premiumData.milesTotal,
        order.id,
      ]
    );

    await awardMilesToUser(userId, premiumData.milesTotal);
  }
});
```

**For Stripe Payment Intent:**

```javascript
// After Stripe payment succeeds
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

if (paymentIntent.status === "succeeded") {
  const userId = req.user.id;
  const premiumStatus = await checkUserPremiumStatus(userId);

  // Same premium calculation and tracking as above
  // ...
}
```

---

## Testing Checklist

### 1. Test Premium Order Creation

- [ ] Place order as premium user
- [ ] Verify `is_premium_order = true` in database
- [ ] Check `premium_discount_amount` is calculated correctly (5% or 10%)
- [ ] Verify `premium_delivery_savings = 200` if free delivery applied
- [ ] Confirm `premium_miles_bonus` equals base miles (for 2x multiplier)

### 2. Test Monthly Summary

- [ ] Call `GET /api/subscription/monthly-summary`
- [ ] Verify `ordersCount > 0`
- [ ] Check `deliverySavings` matches sum of order delivery savings
- [ ] Confirm `milesBonus` matches sum of order miles bonuses
- [ ] Validate `totalSavings` calculation
- [ ] Test with multiple orders in same month

### 3. Test Non-Premium Orders

- [ ] Place order as non-premium user
- [ ] Verify `is_premium_order = false`
- [ ] Check premium columns are 0
- [ ] Confirm regular miles (1x) are awarded

---

## Discount Calculation Reference

**Premium Discount Tiers:**

- Orders ≥ 1000 KSH: **10% discount**
- Orders ≥ 500 KSH: **5% discount**
- Orders < 500 KSH: **No discount**

**Discount Applied To:** Subtotal only (not shipping or tax)

**Example:**

```javascript
// Cart subtotal = 1200 KSH
const discount = 1200 * 0.1; // 120 KSH saved
const discountedSubtotal = 1200 - 120; // 1080 KSH
const tax = discountedSubtotal * 0.08; // 86.4 KSH
const shipping = 0; // Free for premium
const total = discountedSubtotal + tax + shipping; // 1166.4 KSH
```

---

## Delivery Savings Calculation

**Free Delivery Rules:**

- Premium users get free delivery on orders ≥ 500 KSH
- Standard shipping fee: 200 KSH

**Delivery Savings Logic:**

```javascript
const standardShippingFee = 200;

if (isPremium && subtotal >= 500 && shippingFee === 0) {
  deliverySavings = standardShippingFee; // User saved 200 KSH
} else {
  deliverySavings = 0;
}
```

---

## Miles Calculation

**Base Miles:** `orderTotal / 10` (rounded down)
**Premium Multiplier:** 2x

**Example:**

```javascript
const subtotal = 850;
const baseMiles = Math.floor(subtotal / 10); // 85 miles

// Regular user:
const regularMiles = baseMiles; // 85 miles

// Premium user:
const premiumMiles = baseMiles * 2; // 170 miles
const milesBonus = baseMiles; // 85 extra miles
```

**Miles Value:** 100 miles = 10 KSH, so **1 mile = 0.1 KSH**

---

## SQL Queries for Debugging

### Check if order has premium tracking:

```sql
SELECT
  id,
  user_id,
  is_premium_order,
  premium_discount_amount,
  premium_delivery_savings,
  premium_miles_bonus,
  order_month,
  created_at
FROM orders
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

### Get monthly summary manually:

```sql
SELECT
  COUNT(*) as orders_count,
  SUM(premium_discount_amount) as total_discount,
  SUM(premium_delivery_savings) as total_delivery_savings,
  SUM(premium_miles_bonus) as total_miles_bonus,
  SUM(premium_discount_amount + premium_delivery_savings) as total_cash_savings
FROM orders
WHERE user_id = 'YOUR_USER_ID'
  AND is_premium_order = true
  AND order_month = '2025-12'
  AND status != 'cancelled';
```

---

## Expected Frontend Behavior After Implementation

Once backend tracking is implemented, the frontend `PremiumMonthlySummary` component will automatically display:

1. **Delivery Savings**: Total shipping fees saved this month
2. **Bonus Miles**: Extra miles from 2x multiplier
3. **Exclusive Deals**: Premium discounts (5-10%)
4. **Total Savings**: Sum of all benefits
5. **Net Savings**: Total savings minus 200 KSH subscription cost

The component auto-refreshes every 30 seconds and has a manual refresh button.

---

## Migration Script (If You Have Existing Orders)

If you have existing orders in the database, run this migration:

```sql
-- Add new columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_premium_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_delivery_savings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_miles_bonus INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS premium_miles_total INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_month VARCHAR(7);

-- Update order_month for existing orders
UPDATE orders
SET order_month = TO_CHAR(created_at, 'YYYY-MM')
WHERE order_month IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_premium_monthly
ON orders(user_id, order_month, is_premium_order)
WHERE is_premium_order = true;
```

---

## Common Issues & Solutions

### Issue 1: Orders showing ordersCount = 0

**Cause:** Orders aren't linked to user_id or is_premium_order flag not set
**Solution:** Ensure authenticateToken middleware provides req.user.id and set is_premium_order = true

### Issue 2: Savings showing 0 even though orders exist

**Cause:** premium_discount_amount, premium_delivery_savings columns are 0
**Solution:** Make sure you calculate and store these values during order creation

### Issue 3: milesBonus shows 0

**Cause:** premium_miles_bonus not calculated or stored
**Solution:** Calculate base miles × 2 for premium users, store the bonus (extra miles)

### Issue 4: Wrong month data showing

**Cause:** order_month format mismatch
**Solution:** Ensure order_month is stored as 'YYYY-MM' format (e.g., '2025-12')

---

## Summary

**What needs to happen:**

1. ✅ Add premium tracking columns to orders table
2. ✅ Update order creation endpoints (COD, M-Pesa, Stripe) to calculate and store premium data
3. ✅ Update monthly summary endpoint to aggregate premium orders
4. ✅ Award 2x miles to premium users
5. ✅ Test with real orders

**Result:** Premium users will see their savings accumulate in the Monthly Summary dashboard, showing them the value of their 200 KSH/month subscription.

---

## Contact for Questions

If you need clarification on any part of this implementation:

- Frontend is fully ready and will automatically work once backend tracking is implemented
- Focus on: Order creation endpoints + Monthly summary aggregation
- Test thoroughly with multiple orders to ensure calculations are correct
