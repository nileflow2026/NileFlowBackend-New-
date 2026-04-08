# Backend User Preferences Endpoint Implementation Guide

This guide provides step-by-step instructions to implement user preferences endpoints in your backend server.

## 📋 Overview

The user preferences system allows users to store and manage their personal settings including payment methods, shipping preferences, communication settings, and system preferences.

## 🚀 Quick Start

### 1. Database Setup

#### Appwrite Collection Setup

```javascript
// config/appwrite.js
const { Client, Databases, ID, Query } = require("appwrite");

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
  .setKey(process.env.APPWRITE_API_KEY); // Your secret API key

const databases = new Databases(client);

// Collection configuration
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const USER_PREFERENCES_COLLECTION_ID =
  process.env.APPWRITE_USER_PREFERENCES_COLLECTION_ID;

module.exports = {
  client,
  databases,
  DATABASE_ID,
  USER_PREFERENCES_COLLECTION_ID,
  ID,
  Query,
};
```

#### Appwrite Collection Schema

Create a collection named `user_preferences` in your Appwrite console with these attributes:

```json
[
  {
    "key": "userId",
    "type": "string",
    "status": "available",
    "required": true,
    "array": false,
    "size": 255,
    "default": null
  },
  {
    "key": "preferredPaymentMethod",
    "type": "enum",
    "status": "available",
    "required": false,
    "array": false,
    "elements": [
      "Credit Card",
      "Debit Card",
      "PayPal",
      "M-Pesa",
      "Bank Transfer"
    ],
    "default": "Credit Card"
  },
  {
    "key": "preferredShippingMethod",
    "type": "enum",
    "status": "available",
    "required": false,
    "array": false,
    "elements": [
      "Standard Shipping",
      "Express Shipping",
      "Same Day Delivery",
      "Pickup"
    ],
    "default": "Standard Shipping"
  },
  {
    "key": "emailNotifications",
    "type": "boolean",
    "status": "available",
    "required": false,
    "array": false,
    "default": true
  },
  {
    "key": "smsNotifications",
    "type": "boolean",
    "status": "available",
    "required": false,
    "array": false,
    "default": true
  },
  {
    "key": "marketingEmails",
    "type": "boolean",
    "status": "available",
    "required": false,
    "array": false,
    "default": false
  },
  {
    "key": "orderNotifications",
    "type": "boolean",
    "status": "available",
    "required": false,
    "array": false,
    "default": true
  },
  {
    "key": "promotionalNotifications",
    "type": "boolean",
    "status": "available",
    "required": false,
    "array": false,
    "default": false
  },
  {
    "key": "currency",
    "type": "enum",
    "status": "available",
    "required": false,
    "array": false,
    "elements": ["KSh", "USD", "EUR", "GBP"],
    "default": "KSh"
  },
  {
    "key": "language",
    "type": "enum",
    "status": "available",
    "required": false,
    "array": false,
    "elements": ["en", "sw", "fr", "es"],
    "default": "en"
  },
  {
    "key": "timezone",
    "type": "string",
    "status": "available",
    "required": false,
    "array": false,
    "size": 100,
    "default": "Africa/Nairobi"
  },
  {
    "key": "theme",
    "type": "enum",
    "status": "available",
    "required": false,
    "array": false,
    "elements": ["light", "dark", "auto"],
    "default": "light"
  }
]
```

**Collection Indexes:**

- Create a unique index on `userId` field for faster queries

**Collection Permissions:**

- Read: `role:admin`, `user:{userId}` (users can read their own preferences)
- Write: `role:admin`, `user:{userId}` (users can update their own preferences)

#### PostgreSQL Schema

```sql
-- Create user_preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferred_payment_method VARCHAR(50) DEFAULT 'Credit Card'
        CHECK (preferred_payment_method IN ('Credit Card', 'Debit Card', 'PayPal', 'M-Pesa', 'Bank Transfer')),
    preferred_shipping_method VARCHAR(50) DEFAULT 'Standard Shipping'
        CHECK (preferred_shipping_method IN ('Standard Shipping', 'Express Shipping', 'Same Day Delivery', 'Pickup')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    order_notifications BOOLEAN DEFAULT TRUE,
    promotional_notifications BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'KSh'
        CHECK (currency IN ('KSh', 'USD', 'EUR', 'GBP')),
    language VARCHAR(10) DEFAULT 'en'
        CHECK (language IN ('en', 'sw', 'fr', 'es')),
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
    theme VARCHAR(20) DEFAULT 'light'
        CHECK (theme IN ('light', 'dark', 'auto')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. API Routes Implementation

#### Express.js Route Handler

```javascript
// routes/userPreferences.js
const express = require("express");
const router = express.Router();
const {
  databases,
  DATABASE_ID,
  USER_PREFERENCES_COLLECTION_ID,
  ID,
  Query,
} = require("../config/appwrite");
// const db = require('../config/database'); // PostgreSQL alternative

// Middleware for authentication (add your auth middleware)
const authenticateToken = require("../middleware/auth");

// Default preferences
const defaultPreferences = {
  preferredPaymentMethod: "Credit Card",
  preferredShippingMethod: "Standard Shipping",
  emailNotifications: true,
  smsNotifications: true,
  marketingEmails: false,
  orderNotifications: true,
  promotionalNotifications: false,
  currency: "KSh",
  language: "en",
  timezone: "Africa/Nairobi",
  theme: "light",
};

/**
 * GET /api/users/:userId/preferences
 * Fetch user preferences
 */
router.get(
  "/api/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // Appwrite Implementation
      try {
        // Try to find existing preferences
        const existingPreferences = await databases.listDocuments(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          [Query.equal("userId", userId)]
        );

        let preferences;

        if (existingPreferences.documents.length === 0) {
          // Create default preferences if none exist
          preferences = await databases.createDocument(
            DATABASE_ID,
            USER_PREFERENCES_COLLECTION_ID,
            ID.unique(),
            {
              userId,
              ...defaultPreferences,
            }
          );
          console.log("Created default preferences for user:", userId);
        } else {
          preferences = existingPreferences.documents[0];
        }

        console.log(`Fetching preferences for user: ${userId}`);

        res.status(200).json({
          success: true,
          preferences: preferences,
          message: "User preferences retrieved successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite error:", appwriteError);
        throw appwriteError;
      }

      /* PostgreSQL Implementation Alternative:
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default preferences
      const insertQuery = `
        INSERT INTO user_preferences (user_id, preferred_payment_method, preferred_shipping_method, 
                                    email_notifications, sms_notifications, marketing_emails,
                                    order_notifications, promotional_notifications, currency, 
                                    language, timezone, theme)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`;
      
      const values = [userId, ...Object.values(defaultPreferences)];
      const insertResult = await db.query(insertQuery, values);
      preferences = insertResult.rows[0];
    } else {
      preferences = result.rows[0];
    }
    */
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user preferences",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/users/:userId/preferences
 * Update all user preferences
 */
router.put(
  "/api/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;

      // Validate input
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      if (!preferences || typeof preferences !== "object") {
        return res.status(400).json({
          success: false,
          error: "Valid preferences object is required",
        });
      }

      // Appwrite Implementation
      try {
        // First, check if preferences exist
        const existingPreferences = await databases.listDocuments(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          [Query.equal("userId", userId)]
        );

        let updatedPreferences;

        if (existingPreferences.documents.length === 0) {
          // Create new preferences if none exist
          updatedPreferences = await databases.createDocument(
            DATABASE_ID,
            USER_PREFERENCES_COLLECTION_ID,
            ID.unique(),
            {
              userId,
              ...defaultPreferences,
              ...preferences,
            }
          );
          console.log("Created new preferences for user:", userId);
        } else {
          // Update existing preferences
          const documentId = existingPreferences.documents[0].$id;
          updatedPreferences = await databases.updateDocument(
            DATABASE_ID,
            USER_PREFERENCES_COLLECTION_ID,
            documentId,
            preferences
          );
          console.log("Updated preferences for user:", userId);
        }

        res.status(200).json({
          success: true,
          preferences: updatedPreferences,
          message: "User preferences updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite error:", appwriteError);
        throw appwriteError;
      }

      /* PostgreSQL Implementation Alternative:
    const updateFields = Object.keys(preferences)
      .map((key, index) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE user_preferences 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *`;
    
    const values = [userId, ...Object.values(preferences)];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      // Insert if not exists
      const insertQuery = `INSERT INTO user_preferences (user_id, ${Object.keys(preferences).map(k => k.replace(/([A-Z])/g, '_$1').toLowerCase()).join(', ')}) 
                          VALUES (${Array.from({length: Object.keys(preferences).length + 1}, (_, i) => `$${i + 1}`).join(', ')})
                          RETURNING *`;
      const insertValues = [userId, ...Object.values(preferences)];
      const insertResult = await db.query(insertQuery, insertValues);
      updatedPreferences = insertResult.rows[0];
    } else {
      updatedPreferences = result.rows[0];
    }
    */
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
        message: error.message,
      });
    }
  }
);

/**
 * PATCH /api/users/:userId/preferences
 * Partially update user preferences
 */
router.patch(
  "/api/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // Appwrite Implementation
      try {
        // Find existing preferences
        const existingPreferences = await databases.listDocuments(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          [Query.equal("userId", userId)]
        );

        if (existingPreferences.documents.length === 0) {
          return res.status(404).json({
            success: false,
            error: "User preferences not found",
          });
        }

        // Update existing preferences
        const documentId = existingPreferences.documents[0].$id;
        const updatedPreferences = await databases.updateDocument(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          documentId,
          updates
        );

        console.log(
          `Partially updated preferences for user: ${userId}`,
          updates
        );

        res.status(200).json({
          success: true,
          preferences: updatedPreferences,
          message: "User preferences partially updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User preferences not found",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error partially updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
        message: error.message,
      });
    }
  }
);

module.exports = router;
```

### 3. Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    // Optional: Check if user can access this userId
    if (
      req.params.userId &&
      user.id !== req.params.userId &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Cannot access other users preferences",
      });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
```

### 4. Main App Integration

```javascript
// app.js or server.js
const express = require("express");
const cors = require("cors");
const userPreferencesRoutes = require("./routes/userPreferences");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use(userPreferencesRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🧪 Testing the Endpoints

### Using curl

```bash
# Get user preferences
curl -X GET "http://localhost:3000/api/users/user123/preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"

# Update all preferences
curl -X PUT "http://localhost:3000/api/users/user123/preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "preferredPaymentMethod": "M-Pesa",
      "emailNotifications": false,
      "currency": "KSh"
    }
  }'

# Partial update
curl -X PATCH "http://localhost:3000/api/users/user123/preferences" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "theme": "dark"
  }'
```

### Using Postman

1. **GET Request**: `http://localhost:3000/api/users/user123/preferences`
2. **PUT Request**: `http://localhost:3000/api/users/user123/preferences`
   ```json
   {
     "preferences": {
       "preferredPaymentMethod": "M-Pesa",
       "currency": "KSh",
       "emailNotifications": true
     }
   }
   ```
3. **PATCH Request**: `http://localhost:3000/api/users/user123/preferences`
   ```json
   {
     "theme": "dark",
     "language": "sw"
   }
   ```

## 🔧 Environment Variables

Create a `.env` file in your backend root:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
# or your self-hosted endpoint: http://localhost/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_USER_PREFERENCES_COLLECTION_ID=your-user-preferences-collection-id

# Alternative Database (if using PostgreSQL alongside)
DATABASE_URL=postgresql://username:password@localhost:5432/your-app-name

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3000
NODE_ENV=development
```

## 📝 Validation Rules

### Input Validation

```javascript
// utils/validation.js
const { body, param } = require("express-validator");

const validateUserPreferences = [
  param("userId").notEmpty().withMessage("User ID is required"),
  body("preferences.preferredPaymentMethod")
    .optional()
    .isIn(["Credit Card", "Debit Card", "PayPal", "M-Pesa", "Bank Transfer"])
    .withMessage("Invalid payment method"),
  body("preferences.currency")
    .optional()
    .isIn(["KSh", "USD", "EUR", "GBP"])
    .withMessage("Invalid currency"),
  body("preferences.language")
    .optional()
    .isIn(["en", "sw", "fr", "es"])
    .withMessage("Invalid language"),
  body("preferences.theme")
    .optional()
    .isIn(["light", "dark", "auto"])
    .withMessage("Invalid theme"),
];

module.exports = { validateUserPreferences };
```

## 🚀 Deployment Checklist

- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Authentication middleware implemented
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] CORS configured for frontend domain
- [ ] API endpoints tested
- [ ] Rate limiting added (optional)
- [ ] Logging implemented
- [ ] Database migrations run (if using PostgreSQL)

## 🔗 Frontend Integration

The frontend is already configured to use these endpoints. Make sure your backend server is running on `http://localhost:3000` or update the `baseURL` in your frontend's `api.js` file.

## 📊 API Response Examples

### Success Response

```json
{
  "success": true,
  "preferences": {
    "userId": "user123",
    "preferredPaymentMethod": "Credit Card",
    "preferredShippingMethod": "Standard Shipping",
    "emailNotifications": true,
    "smsNotifications": true,
    "marketingEmails": false,
    "currency": "KSh",
    "language": "en",
    "timezone": "Africa/Nairobi",
    "theme": "light",
    "createdAt": "2025-12-26T10:00:00.000Z",
    "updatedAt": "2025-12-26T10:00:00.000Z"
  },
  "message": "User preferences retrieved successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "User preferences not found",
  "message": "The requested user preferences could not be found"
}
```

## 🎯 Next Steps

1. Choose your database (MongoDB or PostgreSQL)
2. Implement the database schema
3. Add the route handlers to your Express app
4. Test the endpoints
5. Deploy and monitor

Your user preferences system is now ready for production! 🚀
