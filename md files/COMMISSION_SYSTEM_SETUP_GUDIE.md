# GMV Tracking & Commission System - Implementation Guide

## Overview

This implementation provides a production-ready GMV (Gross Merchandise Value) tracking and configurable commission system for your Node.js + Express + Appwrite e-commerce marketplace.

## 🏗️ Architecture

The system consists of several interconnected components:

1. **Platform Settings Service** - Manages commission rates and configuration
2. **Commission Service** - Handles commission calculations with fintech-grade precision
3. **GMV Analytics Service** - Provides comprehensive financial analytics
4. **Financial Audit Logger** - Ensures compliance and audit trails
5. **Admin API Endpoints** - Secure interfaces for commission management

## 🚀 Installation & Setup

### Step 1: Environment Variables

Add these environment variables to your `.env` file:

```bash
# Commission & GMV System Configuration
APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID=your_platform_settings_collection_id
APPWRITE_AUDIT_LOGS_COLLECTION_ID=your_audit_logs_collection_id

# Optional: If you want separate audit logging
# AUDIT_LOG_FILE_PATH=/path/to/audit/logs
```

### Step 2: Database Collections Setup

Run these scripts to set up the required database collections:

```bash
# 1. Create platform settings collection
node Backend/services/setup-platform-settings-collection.js

# 2. Add commission tracking fields to orders collection
node Backend/services/setup-order-commission-tracking.js
```

### Step 3: Verify Installation

Create a simple verification script:

```javascript
// verify-commission-system.js
const {
  platformSettingsService,
} = require("./Backend/services/platformSettingsService");
const { commissionService } = require("./Backend/services/commissionService");

async function verifyInstallation() {
  console.log("🔍 Verifying Commission System Installation...");

  try {
    // Test platform settings
    const isSettingsValid =
      await platformSettingsService.validateConfiguration();
    console.log(
      "✅ Platform Settings Service:",
      isSettingsValid ? "OK" : "FAILED",
    );

    // Test commission service
    const isCommissionValid = await commissionService.validateConfiguration();
    console.log("✅ Commission Service:", isCommissionValid ? "OK" : "FAILED");

    // Test current commission rate
    const currentRate = await platformSettingsService.getCommissionRate();
    console.log(
      `💰 Current Commission Rate: ${(currentRate * 100).toFixed(2)}%`,
    );

    console.log("🎉 Commission system verification completed");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

verifyInstallation();
```

## 📊 Usage Examples

### Admin: Update Commission Rate

```javascript
// Update commission rate to 2.5%
const updateResult = await platformSettingsService.updateCommissionRate(
  0.025, // 2.5% as decimal
  "admin_user_123",
  "Adjusting commission rate to improve platform profitability based on Q1 analysis",
  null, // Effective immediately
);

console.log(`Commission updated: ${updateResult.message}`);
```

### System: Calculate Commission for Order

```javascript
// This happens automatically when an order is completed
// But can also be triggered manually:

const commissionResult = await commissionService.calculateOrderCommission(
  "order_123456",
  null, // Will fetch order data automatically
  {
    forceRecalculation: false, // Set to true to recalculate even if already calculated
  },
);

if (commissionResult.success) {
  console.log(
    `Commission calculated: ${commissionResult.commission_earned} at ${commissionResult.commission_percent}%`,
  );
}
```

### Admin: Get Financial Analytics

```javascript
// Get comprehensive financial dashboard
const analytics = await gmvAnalyticsService.generateFinancialDashboard({
  period: "30d",
  vendorId: null, // All vendors
  includeProjections: true,
});

console.log("GMV Analytics:", analytics.summary);
console.log("Commission Metrics:", analytics.commission);
```

## 🔐 API Endpoints

### Commission Settings

```http
GET /api/admin/commission/settings
Authorization: Bearer admin_token

Response:
{
  "success": true,
  "data": {
    "currentCommissionRate": {
      "decimal": 0.025,
      "percentage": "2.50%",
      "basisPoints": 250
    },
    "gmvCalculationMethod": "completed_orders",
    "lastUpdated": "2026-01-22T12:00:00.000Z"
  }
}
```

### Update Commission Rate

```http
PUT /api/admin/commission/rate
Authorization: Bearer admin_token
Content-Type: application/json

{
  "commissionRate": 0.035,
  "reason": "Increasing commission rate to 3.5% to improve platform revenue",
  "effectiveDate": null
}

Response:
{
  "success": true,
  "message": "Commission rate updated from 2.50% to 3.50%",
  "data": {
    "changeId": "change_123",
    "previousRate": { "decimal": 0.025, "percentage": "2.50%" },
    "newRate": { "decimal": 0.035, "percentage": "3.50%" },
    "impactNote": "This rate will only apply to NEW orders. Historical orders remain unchanged."
  }
}
```

### Get Financial Analytics

```http
GET /api/admin/commission/analytics?period=30d&vendorId=vendor_123
Authorization: Bearer admin_token

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-22T23:59:59.000Z",
      "days": 22
    },
    "summary": {
      "totalGMV": 125000.50,
      "totalOrders": 1250,
      "totalCommission": 3125.01,
      "averageOrderValue": 100.00,
      "averageCommissionRate": 0.025
    },
    "gmv": {
      "totalGMV": 125000.50,
      "eligibleOrders": 1200,
      "trend": "increasing"
    },
    "commission": {
      "totalCommission": 3125.01,
      "averageCommissionPercent": "2.50%",
      "trend": "stable"
    }
  }
}
```

### Batch Commission Calculation

```http
POST /api/admin/commission/calculate-batch
Authorization: Bearer admin_token
Content-Type: application/json

{
  "orderIds": ["order_123", "order_456", "order_789"],
  "options": {
    "forceRecalculation": true,
    "batchDelay": 100
  }
}

Response:
{
  "success": true,
  "data": {
    "results": {
      "total": 3,
      "successful": 2,
      "failed": 0,
      "skipped": 1
    },
    "processedBy": "admin_user_123",
    "processedAt": "2026-01-22T12:00:00.000Z"
  }
}
```

## 💰 Financial Data Structure

### Order Document (Enhanced)

```javascript
{
  // Existing order fields
  $id: "order_123456",
  userId: "user_789",
  customerEmail: "customer@example.com",
  amount: 250.00,
  currency: "KES",
  paymentMethod: "M-Pesa",
  orderStatus: "Completed",
  paymentStatus: "succeeded",
  createdAt: "2026-01-22T10:00:00.000Z", // ✅ Immutable timestamp

  // NEW: Commission & GMV Tracking Fields
  commission_earned: 12.50,              // ✅ Commission amount (not calculated dynamically)
  commission_rate_used: 0.05,            // ✅ Rate at time of calculation
  transaction_amount: 250.00,            // ✅ Amount for GMV calculation
  vendor_id: "vendor_abc123",            // ✅ Primary vendor ID
  gmv_eligible: true,                    // ✅ Counts toward GMV
  commission_calculated_at: "2026-01-22T12:00:00.000Z", // ✅ Audit timestamp
  financial_status: "calculated"        // ✅ Processing status
}
```

### Platform Settings Document

```javascript
{
  $id: "setting_commission_rate",
  settingKey: "commission_rate",
  settingValue: "0.025",                 // 2.5% as string
  settingType: "commission",
  description: "Platform commission rate as decimal (0.025 = 2.5%)",
  lastUpdatedBy: "admin_user_123",
  isActive: true,
  effectiveFrom: "2026-01-22T12:00:00.000Z",
  validationRules: "{\"type\":\"number\",\"min\":0,\"max\":1,\"step\":0.001}"
}
```

## 🔍 Audit & Compliance

### Audit Log Example

```javascript
{
  eventType: "commission_rate_change",
  severity: "high",
  userId: "admin_user_123",
  entityType: "PlatformSettings",
  entityId: "commission_rate",
  action: "UPDATE",
  timestamp: "2026-01-22T12:00:00.000Z",

  financialData: {
    previousCommissionRate: 0.02,
    newCommissionRate: 0.025,
    percentageChange: "25.00",
    businessJustification: "Adjusting commission to improve profitability",
    basisPointsChange: 50
  },

  complianceData: {
    approvedBy: "admin_user_123",
    requiresNotification: true,
    retroactiveImpact: false,
    documentationRequired: true
  }
}
```

## 📈 GMV Calculation

GMV is calculated as the sum of `transaction_amount` for all orders where:

- `gmv_eligible = true`
- `financial_status` is in completed states
- Order is not cancelled or refunded

```sql
-- Conceptual SQL (actual implementation uses Appwrite queries)
SELECT SUM(transaction_amount) as total_gmv
FROM orders
WHERE gmv_eligible = true
  AND financial_status IN ('calculated', 'settled')
  AND order_status NOT IN ('cancelled', 'refunded')
  AND created_at BETWEEN start_date AND end_date
```

## ⚡ Performance Considerations

1. **Caching**: Commission rates and analytics are cached for performance
2. **Batch Processing**: Large commission calculations are processed in batches
3. **Indexing**: Database indexes are created for commission and GMV queries
4. **Async Operations**: Commission calculations don't block order completion

## 🛡️ Security & Financial Integrity

1. **Immutable Records**: Historical commission data never changes
2. **Audit Trails**: All financial operations are logged
3. **Admin-Only Access**: Commission management requires admin privileges
4. **Input Validation**: All commission rates are validated (0-100%)
5. **Idempotency**: Commission calculations prevent double-processing
6. **Precision**: Uses 2-decimal place precision for financial calculations

## 🚨 Troubleshooting

### Commission Not Calculating

1. Check if order is eligible:

```javascript
const eligibility = commissionService.checkCommissionEligibility(order);
console.log("Eligibility:", eligibility);
```

2. Verify platform settings:

```javascript
const rate = await platformSettingsService.getCommissionRate();
console.log("Current rate:", rate);
```

3. Check order completion status:

```javascript
// Ensure order has paymentStatus: 'succeeded' or orderStatus: 'completed'
```

### GMV Analytics Missing Data

1. Verify GMV eligibility:

```javascript
// Check that orders have gmv_eligible: true
// Check that transaction_amount is set correctly
```

2. Check date ranges:

```javascript
// Ensure your date range includes the orders you expect
```

### Audit Logs Not Appearing

1. Check environment variable:

```javascript
console.log("Audit Collection:", process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID);
```

2. Verify collection permissions in Appwrite Console

## 🔄 Migration & Backfill

### Backfill Historical Orders

```javascript
// Get all completed orders without commission data
const orders = await db.listDocuments(
  env.APPWRITE_DATABASE_ID,
  env.APPWRITE_ORDERS_COLLECTION,
  [
    Query.isNull("commission_calculated_at"),
    Query.equal("paymentStatus", "succeeded"),
  ],
);

// Batch calculate commissions
const orderIds = orders.documents.map((order) => order.$id);
await commissionService.batchCalculateCommissions(orderIds, {
  batchDelay: 200, // Slow processing to avoid overwhelming database
});
```

## 📞 Support & Maintenance

### Health Checks

Create health check endpoints to monitor the system:

```javascript
app.get("/health/commission-system", async (req, res) => {
  try {
    const currentRate = await platformSettingsService.getCommissionRate();
    const isConfigValid = await commissionService.validateConfiguration();

    res.json({
      status: isConfigValid ? "healthy" : "degraded",
      currentCommissionRate: `${(currentRate * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

### Regular Maintenance Tasks

1. **Monthly**: Review commission rates and performance
2. **Quarterly**: Audit commission calculations for accuracy
3. **Annually**: Archive old audit logs (if compliance permits)
4. **As Needed**: Backfill commission data for historical orders

This implementation provides a robust, audit-ready commission system that can scale with your marketplace while maintaining financial integrity and compliance.
