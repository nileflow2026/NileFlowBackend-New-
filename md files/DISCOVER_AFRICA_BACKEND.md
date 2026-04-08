# Discover Africa Backend Setup Guide

## Overview

This guide explains how to set up the backend infrastructure for the Discover Africa feature, including database collections, API endpoints, and data management.

## Table of Contents

1. [Database Structure](#database-structure)
2. [Setup Instructions](#setup-instructions)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Backend Implementation](#backend-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Database Structure

### Collections

#### 1. **africanFacts** Collection

Stores educational content about African culture, nature, history, art, and wildlife.

**Attributes:**

| Field         | Type     | Required | Size/Details | Description                                       |
| ------------- | -------- | -------- | ------------ | ------------------------------------------------- |
| `category`    | string   | Yes      | 50           | Category: nature, culture, history, art, wildlife |
| `title`       | string   | Yes      | 200          | Fact title                                        |
| `description` | string   | Yes      | 2000         | Detailed description                              |
| `image`       | url      | Yes      | -            | Image URL                                         |
| `location`    | string   | Yes      | 100          | Geographic location                               |
| `iconName`    | string   | No       | 50           | Lucide icon name (e.g., "Mountain", "Shield")     |
| `gradient`    | string   | No       | 100          | Tailwind gradient classes                         |
| `tags`        | string[] | No       | 50 each      | Array of tags                                     |
| `duration`    | string   | No       | 100          | For time-based facts (e.g., "July - October")     |
| `population`  | string   | No       | 50           | Population information                            |
| `height`      | string   | No       | 50           | Height information (mountains)                    |
| `count`       | string   | No       | 50           | Count information (e.g., "200+ Pyramids")         |
| `tradition`   | string   | No       | 100          | Tradition information                             |
| `origin`      | string   | No       | 100          | Origin information                                |
| `size`        | string   | No       | 50           | Size information (geographic features)            |
| `animals`     | string   | No       | 200          | Animal information (wildlife)                     |
| `featured`    | boolean  | No       | -            | Featured on homepage (default: false)             |
| `sortOrder`   | integer  | No       | -            | Display order (default: 0)                        |
| `active`      | boolean  | No       | -            | Active status (default: true)                     |

**Indexes:**

- `category_index` - Index on `category` field
- `featured_index` - Index on `featured` field
- `active_index` - Index on `active` field

#### 2. **africanProverbs** Collection

Stores African proverbs and wisdom.

**Attributes:**

| Field         | Type    | Required | Size | Description                       |
| ------------- | ------- | -------- | ---- | --------------------------------- |
| `proverb`     | string  | Yes      | 500  | The proverb text                  |
| `language`    | string  | No       | 50   | Language of origin                |
| `country`     | string  | No       | 100  | Country of origin                 |
| `region`      | string  | No       | 100  | Region (e.g., "West Africa")      |
| `translation` | string  | No       | 500  | English translation if applicable |
| `active`      | boolean | No       | -    | Active status (default: true)     |
| `sortOrder`   | integer | No       | -    | Display order (default: 0)        |

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install node-appwrite
```

### Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
```

### Step 3: Run Schema Creation Script

Update the script with your credentials:

```javascript
// scripts/createAfricanFactsSchema.js
const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
```

Run the script:

```bash
node scripts/createAfricanFactsSchema.js
```

**Expected Output:**

```
============================================================
African Facts & Proverbs Database Setup
============================================================

Creating African Facts collection...
✓ Collection created: africanFacts
✓ Created attribute: category
✓ Created attribute: title
✓ Created attribute: description
...
✓ Created index: category_index
✓ Created index: featured_index
✓ Created index: active_index

✓ African Facts collection setup complete!

Creating African Proverbs collection...
✓ Collection created: africanProverbs
✓ Created attribute: proverb
...

✓ African Proverbs collection setup complete!

============================================================
Setup Complete!
============================================================
```

### Step 4: Seed Initial Data

Update the seed script with your credentials, then run:

```bash
node scripts/seedAfricanFacts.js
```

**Expected Output:**

```
============================================================
Seeding African Facts & Proverbs
============================================================

Seeding African Facts...

✓ Created: The Great Migration
✓ Created: The Maasai Warriors
✓ Created: Mount Kilimanjaro
...

✓ African Facts seeding complete!

Seeding African Proverbs...

✓ Created: "It takes a village to raise a child."
...

✓ African Proverbs seeding complete!

============================================================
Seeding Complete!
============================================================
```

---

## API Endpoints

### Backend API Routes (Express.js Example)

Create these endpoints in your backend:

#### 1. Get All African Facts

```javascript
// GET /api/african-facts
router.get("/african-facts", async (req, res) => {
  try {
    const { category, search, limit } = req.query;

    const queries = [Query.equal("active", true), Query.orderDesc("sortOrder")];

    if (category && category !== "all") {
      queries.push(Query.equal("category", category));
    }

    if (search) {
      queries.push(Query.search("title", search));
    }

    if (limit) {
      queries.push(Query.limit(parseInt(limit)));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      "africanFacts",
      queries
    );

    res.json({ facts: response.documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Get Single African Fact

```javascript
// GET /api/african-facts/:id
router.get("/african-facts/:id", async (req, res) => {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      "africanFacts",
      req.params.id
    );

    res.json(document);
  } catch (error) {
    res.status(404).json({ error: "Fact not found" });
  }
});
```

#### 3. Get Categories

```javascript
// GET /api/african-facts/categories
router.get("/african-facts/categories", async (req, res) => {
  try {
    // Return static categories or fetch from database
    const categories = [
      { id: "all", name: "All Wonders" },
      { id: "culture", name: "Cultural Heritage" },
      { id: "nature", name: "Natural Wonders" },
      { id: "history", name: "Historical Facts" },
      { id: "art", name: "Art & Creativity" },
      { id: "wildlife", name: "Wildlife & Safari" },
    ];

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 4. Get African Proverbs

```javascript
// GET /api/african-proverbs
router.get("/african-proverbs", async (req, res) => {
  try {
    const { limit = 7 } = req.query;

    const response = await databases.listDocuments(
      DATABASE_ID,
      "africanProverbs",
      [
        Query.equal("active", true),
        Query.orderDesc("sortOrder"),
        Query.limit(parseInt(limit)),
      ]
    );

    res.json({ proverbs: response.documents.map((doc) => doc.proverb) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 5. Get African Stats

```javascript
// GET /api/african-stats
router.get("/african-stats", async (req, res) => {
  try {
    // Could be dynamic based on database counts
    const stats = {
      countries: 54,
      languages: 2000,
      ethnicGroups: 3000,
      naturalWonders: 7,
      musicalTraditions: 500,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Data Models

### Frontend TypeScript Interfaces

```typescript
// types/africanFacts.ts

export interface AfricanFact {
  $id: string;
  category: "nature" | "culture" | "history" | "art" | "wildlife";
  title: string;
  description: string;
  image: string;
  location: string;
  iconName?: string;
  gradient?: string;
  tags: string[];
  duration?: string;
  population?: string;
  height?: string;
  count?: string;
  tradition?: string;
  origin?: string;
  size?: string;
  animals?: string;
  featured: boolean;
  sortOrder: number;
  active: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface AfricanProverb {
  $id: string;
  proverb: string;
  language?: string;
  country?: string;
  region?: string;
  translation?: string;
  active: boolean;
  sortOrder: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

export interface AfricanStats {
  countries: number;
  languages: number;
  ethnicGroups: number;
  naturalWonders: number;
  musicalTraditions: number;
}
```

---

## Backend Implementation

### Complete Express.js Route Example

```javascript
// routes/africanFacts.js
const express = require("express");
const { Databases, Query } = require("node-appwrite");
const router = express.Router();

// Initialize Appwrite
const client = require("../config/appwrite");
const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

// Get all African facts
router.get("/african-facts", async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;

    const queries = [
      Query.equal("active", true),
      Query.orderDesc("sortOrder"),
      Query.limit(parseInt(limit)),
    ];

    if (category && category !== "all") {
      queries.push(Query.equal("category", category));
    }

    if (search) {
      queries.push(Query.search("title", search));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      "africanFacts",
      queries
    );

    res.json({
      facts: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching African facts:", error);
    res.status(500).json({ error: "Failed to fetch African facts" });
  }
});

// Get single fact
router.get("/african-facts/:id", async (req, res) => {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      "africanFacts",
      req.params.id
    );

    res.json(document);
  } catch (error) {
    console.error("Error fetching fact:", error);
    res.status(404).json({ error: "Fact not found" });
  }
});

// Get categories
router.get("/african-facts/categories", async (req, res) => {
  const categories = [
    { id: "all", name: "All Wonders" },
    { id: "culture", name: "Cultural Heritage" },
    { id: "nature", name: "Natural Wonders" },
    { id: "history", name: "Historical Facts" },
    { id: "art", name: "Art & Creativity" },
    { id: "wildlife", name: "Wildlife & Safari" },
  ];

  res.json({ categories });
});

// Get proverbs
router.get("/african-proverbs", async (req, res) => {
  try {
    const { limit = 7 } = req.query;

    const response = await databases.listDocuments(
      DATABASE_ID,
      "africanProverbs",
      [
        Query.equal("active", true),
        Query.orderDesc("sortOrder"),
        Query.limit(parseInt(limit)),
      ]
    );

    res.json({
      proverbs: response.documents.map((doc) => doc.proverb),
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching proverbs:", error);
    res.status(500).json({ error: "Failed to fetch proverbs" });
  }
});

// Get stats
router.get("/african-stats", async (req, res) => {
  try {
    // Optionally fetch from database or return static
    const stats = {
      countries: 54,
      languages: 2000,
      ethnicGroups: 3000,
      naturalWonders: 7,
      musicalTraditions: 500,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
```

### Register Routes in Main App

```javascript
// app.js or server.js
const africanFactsRoutes = require("./routes/africanFacts");

app.use("/api", africanFactsRoutes);
```

---

## Testing

### Manual Testing with cURL

```bash
# Get all facts
curl http://localhost:5000/api/african-facts

# Get facts by category
curl http://localhost:5000/api/african-facts?category=nature

# Get single fact
curl http://localhost:5000/api/african-facts/DOCUMENT_ID

# Get proverbs
curl http://localhost:5000/api/african-proverbs?limit=5

# Get stats
curl http://localhost:5000/api/african-stats
```

### Testing with Postman

1. Import the following collection:

```json
{
  "info": {
    "name": "African Facts API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Facts",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/african-facts"
      }
    },
    {
      "name": "Get Facts by Category",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/african-facts?category=nature"
      }
    },
    {
      "name": "Get Single Fact",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/african-facts/:id"
      }
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### 1. **Schema Creation Fails**

**Error:** `Collection already exists`

**Solution:**

- Delete the existing collection in Appwrite Console
- Or modify the script to update existing collections

#### 2. **Seeding Fails**

**Error:** `Attribute not found` or `Invalid data`

**Solution:**

- Wait 2-3 minutes after creating attributes (Appwrite needs time to process)
- Verify all required fields are included in seed data
- Check attribute types match the data

#### 3. **API Returns Empty Array**

**Possible Causes:**

- No data seeded
- `active` field is `false`
- Category filter doesn't match any documents

**Solution:**

```bash
# Check if data exists
node scripts/seedAfricanFacts.js

# Verify in Appwrite Console
# Go to Database → africanFacts → Documents
```

#### 4. **Frontend Not Receiving Data**

**Check:**

1. Backend API is running
2. CORS is configured correctly
3. axiosClient baseURL is correct
4. Network tab shows successful requests

**Fix CORS:**

```javascript
// app.js
const cors = require("cors");

app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-domain.com"],
    credentials: true,
  })
);
```

---

## Next Steps

1. **Add Admin Panel**: Create CRUD interface for managing facts and proverbs
2. **Add Image Upload**: Integrate Appwrite Storage for uploading images
3. **Add Search**: Implement full-text search with Appwrite
4. **Add Pagination**: Implement cursor-based pagination for large datasets
5. **Add Analytics**: Track popular facts and user engagement
6. **Add Translations**: Integrate with translation service for multilingual support
7. **Add Comments**: Allow users to comment on facts
8. **Add Ratings**: Let users rate facts

---

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Node SDK](https://github.com/appwrite/sdk-for-node)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Query for Data Fetching](https://tanstack.com/query/latest)

---

## Support

For issues or questions:

- Check the troubleshooting section above
- Review Appwrite Console logs
- Check browser Network tab for API errors
- Review backend server logs

## License

This setup guide is part of the Nile Flow project.
