const { Client, Databases, Query } = require("node-appwrite");
const { db } = require("../../src/appwrite");
const { env } = require("../../src/env");

/**
 * Item Representation Tower - Captures what the product is
 *
 * This tower learns item characteristics through:
 * - Category hierarchy and attributes
 * - Brand reputation and features
 * - Price positioning
 * - Text embeddings (name, description)
 * - Seller reputation
 * - Stock velocity and trends
 *
 * Output: ItemEmbedding (D=64-128)
 * Key Properties: Static + dynamic features, popularity smoothing, trend dampening
 */

class ItemRepresentationTower {
  constructor(appwriteClient = null, databaseId = null) {
    this.client = appwriteClient;
    this.databases = appwriteClient ? new Databases(appwriteClient) : db;
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID; // Use your existing database

    // Configuration
    this.EMBEDDING_DIMENSION = 128;
    this.TEXT_EMBEDDING_DIM = 64; // For title/description embeddings

    // Smoothing factors
    this.POPULARITY_SMOOTHING = 0.1; // Prevents over-amplifying viral items
    this.TREND_DAMPENING = 0.7; // Prevents chasing short-term trends
    this.VELOCITY_DECAY = 0.8; // Daily decay for stock velocity

    // Cache for performance
    this.categoryCache = new Map();
    this.brandCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // ============================================================================
  // CORE ITEM REPRESENTATION COMPUTATION
  // ============================================================================

  /**
   * Compute item representation embedding
   * @param {string} itemId - Item identifier
   * @param {Object} itemData - Item data (optional, for batch processing)
   * @returns {Object} { itemEmbedding: Array, metadata: Object }
   */
  async computeItemRepresentation(itemId, itemData = null) {
    try {
      // 1. Get item data (from parameter or database)
      const item = itemData || (await this.getItemData(itemId));
      if (!item) {
        return this.getFallbackRepresentation(itemId);
      }

      // 2. Extract features from item data
      const features = await this.extractItemFeatures(item);

      // 3. Compute embedding from features
      const embedding = this.computeEmbedding(features);

      // 4. Update item embedding in database
      await this.updateItemEmbedding(itemId, embedding, features);

      return {
        itemEmbedding: embedding,
        features: features, // For debugging/analysis
        metadata: {
          category: item.category,
          brand: item.brand,
          priceUSD: item.priceUSD,
          popularityScore: features.popularityScore,
          qualityScore: features.qualityScore,
        },
      };
    } catch (error) {
      console.error(
        `Error computing item representation for ${itemId}:`,
        error
      );
      return this.getFallbackRepresentation(itemId);
    }
  }

  /**
   * Batch compute item representations (more efficient)
   * @param {Array} itemIds - Array of item IDs
   * @returns {Map} Map of itemId -> representation
   */
  async computeBatchRepresentations(itemIds) {
    const results = new Map();

    try {
      // Get all item data in batches
      const items = await this.getBatchItemData(itemIds);

      // Process each item
      for (const [itemId, itemData] of items.entries()) {
        const representation = await this.computeItemRepresentation(
          itemId,
          itemData
        );
        results.set(itemId, representation);
      }

      return results;
    } catch (error) {
      console.error("Error in batch item representation:", error);

      // Return fallback for all items
      for (const itemId of itemIds) {
        results.set(itemId, this.getFallbackRepresentation(itemId));
      }

      return results;
    }
  }

  // ============================================================================
  // DATA RETRIEVAL
  // ============================================================================

  async getItemData(itemId) {
    try {
      if (!env.APPWRITE_PRODUCT_COLLECTION_ID) {
        console.warn("APPWRITE_PRODUCT_COLLECTION_ID not configured");
        return null;
      }

      const product = await this.databases.getDocument(
        this.databaseId,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        itemId
      );

      // Fetch category name if category ID is provided
      let categoryName = product.category || "general";
      if (
        product.category &&
        product.category !== "general" &&
        env.APPWRITE_CATEGORIES_COLLECTION_ID
      ) {
        try {
          const category = await this.databases.getDocument(
            this.databaseId,
            env.APPWRITE_CATEGORIES_COLLECTION_ID,
            product.category
          );
          categoryName =
            category.name ||
            category.categoryName ||
            category.title ||
            categoryName;
        } catch (error) {
          console.warn(
            `Failed to fetch category name for ${product.category}:`,
            error.message
          );
        }
      }

      // Return structured product data with all available fields
      return {
        itemId: product.$id,
        productName: product.productName || product.name || product.title,
        description: product.description || "",
        price: product.price || 0,
        priceUSD: product.price || 0, // Assuming prices are in local currency
        priceBand: this.calculatePriceBand(product.price || 0),
        category: product.category,
        categoryName: categoryName,
        subcategory: product.subcategory || null,
        brand: product.brand || "",
        stockLevel: product.stockLevel || product.quantity || 100,
        stockVelocity: product.stockVelocity || Math.random() * 10, // Mock velocity if not available
        popularityScore: (product.ratingsCount || 0) * 0.01, // Convert ratings count to popularity
        trendingScore: product.trending || Math.random() * 0.5,
        sellerId: product.vendor || product.seller || "",
        sellerReputation: product.sellerRating || 0.8,
        rating: product.rating || 0,
        ratingsCount: product.ratingsCount || 0,
        inStock: product.inStock !== false,
        image: product.image || product.imageUrl || product.thumbnail,
        tags: product.tags || [],
        titleEmbedding: null, // Will be computed if needed
        descriptionEmbedding: null, // Will be computed if needed
        lastUpdated: new Date(product.$updatedAt || product.$createdAt),
        $createdAt: product.$createdAt,
        $updatedAt: product.$updatedAt,
      };
    } catch (error) {
      console.error(`Error retrieving item data for ${itemId}:`, error);
      return null;
    }
  }

  calculatePriceBand(price) {
    if (price < 1000) return "low";
    if (price < 5000) return "medium";
    if (price < 20000) return "high";
    return "premium";
  }

  async getBatchItemData(itemIds) {
    const results = new Map();

    try {
      // Query in batches of 100 (Appwrite limit)
      const batchSize = 100;
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);

        const response = await this.databases.listDocuments(
          this.databaseId,
          env.ITEM_EMBEDDINGS_COLLECTION_ID,
          [Query.equal("itemId", batch), Query.equal("isActive", true)]
        );

        for (const doc of response.documents) {
          results.set(doc.itemId, {
            itemId: doc.itemId,
            category: doc.category,
            subcategory: doc.subcategory,
            brand: doc.brand,
            priceUSD: doc.priceUSD,
            priceBand: doc.priceBand,
            stockLevel: doc.stockLevel,
            stockVelocity: doc.stockVelocity || 0,
            popularityScore: doc.popularityScore || 0,
            trendingScore: doc.trendingScore || 0,
            sellerId: doc.sellerId,
            sellerReputation: doc.sellerReputation || 0.5,
            titleEmbedding: doc.titleEmbedding
              ? JSON.parse(doc.titleEmbedding)
              : null,
            descriptionEmbedding: doc.descriptionEmbedding
              ? JSON.parse(doc.descriptionEmbedding)
              : null,
            lastUpdated: new Date(doc.lastUpdated),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error retrieving batch item data:", error);
      return results;
    }
  }

  // ============================================================================
  // FEATURE EXTRACTION
  // ============================================================================

  async extractItemFeatures(item) {
    const features = {
      // Static categorical features
      category: item.category,
      subcategory: item.subcategory || "unknown",
      brand: item.brand,
      priceBand: item.priceBand,

      // Price features
      priceUSD: item.priceUSD,
      pricePosition: await this.computePricePosition(
        item.category,
        item.priceUSD
      ),

      // Text embeddings
      titleEmbedding: item.titleEmbedding || this.getDefaultTextEmbedding(),
      descriptionEmbedding:
        item.descriptionEmbedding || this.getDefaultTextEmbedding(),

      // Dynamic popularity features (smoothed)
      popularityScore: this.smoothPopularity(item.popularityScore || 0),
      trendingScore: this.dampenTrend(item.trendingScore || 0),

      // Stock and velocity features
      stockLevel: item.stockLevel,
      stockVelocity: item.stockVelocity || 0,
      stockHealth: this.computeStockHealth(item.stockLevel, item.stockVelocity),

      // Seller features
      sellerId: item.sellerId,
      sellerReputation: item.sellerReputation || 0.5,

      // Category and brand embeddings
      categoryEmbedding: await this.getCategoryEmbedding(
        item.category,
        item.subcategory
      ),
      brandEmbedding: await this.getBrandEmbedding(item.brand),

      // Quality indicators
      qualityScore: this.computeQualityScore(item),
      freshnessScore: this.computeFreshnessScore(item.lastUpdated),
    };

    return features;
  }

  // ============================================================================
  // EMBEDDING COMPUTATION
  // ============================================================================

  computeEmbedding(features) {
    // Initialize embedding with zeros
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0.0);

    try {
      // Dimensions allocation:
      // 0-31: Category & brand embeddings (32 dims)
      // 32-63: Text embeddings (title + description) (32 dims)
      // 64-95: Price & popularity features (32 dims)
      // 96-127: Stock, quality & seller features (32 dims)

      // 1. Category & brand embeddings (0-31)
      this.embedCategoryBrand(features, embedding, 0, 32);

      // 2. Text embeddings (32-63)
      this.embedTextFeatures(features, embedding, 32, 32);

      // 3. Price & popularity features (64-95)
      this.embedPricePopularity(features, embedding, 64, 32);

      // 4. Stock, quality & seller features (96-127)
      this.embedStockQualitySeller(features, embedding, 96, 32);

      // 5. Normalize embedding
      return this.normalizeEmbedding(embedding);
    } catch (error) {
      console.error("Error computing item embedding:", error);
      return embedding; // Return zeros on error
    }
  }

  embedCategoryBrand(features, embedding, start, length) {
    // Combine category and brand embeddings
    const categoryEmb = features.categoryEmbedding || [];
    const brandEmb = features.brandEmbedding || [];

    // Use first half for category, second half for brand
    const halfLength = Math.floor(length / 2);

    for (let i = 0; i < halfLength && i < categoryEmb.length; i++) {
      embedding[start + i] = categoryEmb[i];
    }

    for (let i = 0; i < halfLength && i < brandEmb.length; i++) {
      embedding[start + halfLength + i] = brandEmb[i];
    }
  }

  embedTextFeatures(features, embedding, start, length) {
    // Combine title and description embeddings
    const titleEmb = features.titleEmbedding || [];
    const descEmb = features.descriptionEmbedding || [];

    const halfLength = Math.floor(length / 2);

    for (let i = 0; i < halfLength && i < titleEmb.length; i++) {
      embedding[start + i] = titleEmb[i];
    }

    for (let i = 0; i < halfLength && i < descEmb.length; i++) {
      embedding[start + halfLength + i] = descEmb[i];
    }
  }

  embedPricePopularity(features, embedding, start, length) {
    const pricePopFeatures = [
      Math.log(1 + features.priceUSD) / 10, // Log-scaled price
      features.pricePosition, // Price position in category
      features.priceBand === "budget" ? 1.0 : 0.0, // Price band indicators
      features.priceBand === "mid" ? 1.0 : 0.0,
      features.priceBand === "premium" ? 1.0 : 0.0,
      Math.tanh(features.popularityScore), // Popularity (smoothed)
      Math.tanh(features.trendingScore), // Trending (dampened)
      features.qualityScore, // Overall quality
      features.freshnessScore, // Data freshness
      Math.log(1 + features.stockVelocity) / 5, // Stock velocity (log-scaled)
    ];

    for (let i = 0; i < pricePopFeatures.length && i < length; i++) {
      embedding[start + i] = Math.max(-1, Math.min(1, pricePopFeatures[i])); // Clamp to [-1, 1]
    }
  }

  embedStockQualitySeller(features, embedding, start, length) {
    const stockQualityFeatures = [
      Math.tanh(features.stockLevel / 100), // Stock level (normalized)
      features.stockHealth, // Stock health score
      features.sellerReputation, // Seller reputation
      features.sellerId ? 1.0 : 0.0, // Has seller indicator
      // Add more features as needed
    ];

    for (let i = 0; i < stockQualityFeatures.length && i < length; i++) {
      embedding[start + i] = stockQualityFeatures[i];
    }
  }

  normalizeEmbedding(embedding) {
    // L2 normalization
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map((val) => val / norm);
    }
    return embedding;
  }

  // ============================================================================
  // FEATURE COMPUTATION HELPERS
  // ============================================================================

  async computePricePosition(category, price) {
    try {
      // Get price distribution for category from cache or database
      const cacheKey = `price_dist_${category}`;
      let priceStats = this.categoryCache.get(cacheKey);

      if (!priceStats || this.isCacheExpired(priceStats.timestamp)) {
        priceStats = await this.getCategoryPriceStats(category);
        this.categoryCache.set(cacheKey, {
          ...priceStats,
          timestamp: Date.now(),
        });
      }

      if (priceStats.max === priceStats.min) {
        return 0.5; // Default if no price variation
      }

      // Normalize price to [0, 1] within category
      return (price - priceStats.min) / (priceStats.max - priceStats.min);
    } catch (error) {
      console.error("Error computing price position:", error);
      return 0.5; // Default middle position
    }
  }

  async getCategoryPriceStats(category) {
    try {
      // This would ideally be precomputed and cached
      // For now, return default stats
      return {
        min: 1.0,
        max: 1000.0,
        avg: 50.0,
        median: 25.0,
      };
    } catch (error) {
      console.error("Error getting category price stats:", error);
      return { min: 1.0, max: 1000.0, avg: 50.0, median: 25.0 };
    }
  }

  smoothPopularity(rawPopularity) {
    // Apply smoothing to prevent viral items from dominating
    return Math.tanh(rawPopularity * this.POPULARITY_SMOOTHING);
  }

  dampenTrend(rawTrending) {
    // Apply dampening to prevent chasing short-term trends
    return rawTrending * this.TREND_DAMPENING;
  }

  computeStockHealth(stockLevel, stockVelocity) {
    if (stockVelocity <= 0) {
      return stockLevel > 0 ? 0.8 : 0.0; // High stock, no velocity
    }

    const daysOfStock = stockLevel / stockVelocity;

    if (daysOfStock > 30) return 1.0; // Healthy stock
    if (daysOfStock > 7) return 0.8; // Good stock
    if (daysOfStock > 3) return 0.6; // Medium risk
    if (daysOfStock > 1) return 0.4; // Low stock warning
    return 0.2; // Critical stock level
  }

  computeQualityScore(item) {
    // Combine multiple quality indicators
    const factors = [
      item.sellerReputation || 0.5, // Seller quality
      Math.min(1.0, item.stockLevel / 10), // Stock availability
      item.trendingScore > 0 ? 0.8 : 0.5, // Market interest
      item.brand && item.brand !== "unknown" ? 0.8 : 0.4, // Brand presence
    ];

    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  computeFreshnessScore(lastUpdated) {
    if (!lastUpdated) return 0.5;

    const hoursOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursOld < 1) return 1.0; // Very fresh
    if (hoursOld < 6) return 0.9; // Fresh
    if (hoursOld < 24) return 0.7; // Recent
    if (hoursOld < 168) return 0.5; // This week
    return 0.3; // Stale data
  }

  async getCategoryEmbedding(category, subcategory) {
    // Simple categorical encoding (could be enhanced with learned embeddings)
    const categories = [
      "electronics",
      "fashion",
      "home",
      "beauty",
      "sports",
      "books",
      "toys",
      "automotive",
      "grocery",
      "health",
    ];

    const embedding = new Array(16).fill(0.0); // 16-dim category embedding

    const mainIndex = categories.indexOf(category.toLowerCase());
    if (mainIndex >= 0 && mainIndex < embedding.length) {
      embedding[mainIndex] = 1.0;
    }

    return embedding;
  }

  async getBrandEmbedding(brand) {
    // Simple brand encoding (could be enhanced with learned embeddings)
    const embedding = new Array(16).fill(0.0); // 16-dim brand embedding

    // Simple hash-based encoding for now
    const hash = this.simpleHash(brand.toLowerCase()) % embedding.length;
    embedding[hash] = 1.0;

    return embedding;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getDefaultTextEmbedding() {
    // Default text embedding when none available
    return new Array(this.TEXT_EMBEDDING_DIM).fill(0.0);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  getFallbackRepresentation(itemId) {
    return {
      itemEmbedding: new Array(this.EMBEDDING_DIMENSION).fill(0.0),
      metadata: {
        itemId: itemId,
        category: "unknown",
        brand: "unknown",
        priceUSD: 0,
        popularityScore: 0,
        qualityScore: 0.1,
      },
      error: true,
    };
  }

  async updateItemEmbedding(itemId, embedding, features) {
    try {
      const items = await this.databases.listDocuments(
        this.databaseId,
        env.ITEM_EMBEDDINGS_COLLECTION_ID,
        [Query.equal("itemId", itemId)]
      );

      if (items.documents.length > 0) {
        await this.databases.updateDocument(
          this.databaseId,
          env.ITEM_EMBEDDINGS_COLLECTION_ID,
          items.documents[0].$id,
          {
            itemEmbedding: JSON.stringify(embedding),
            popularityScore: features.popularityScore,
            trendingScore: features.trendingScore,
            lastUpdated: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      console.error("Error updating item embedding:", error);
      // Don't throw - this is not critical for the response
    }
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  // ============================================================================
  // BATCH PROCESSING & MAINTENANCE
  // ============================================================================

  async updateAllItemEmbeddings(batchSize = 100) {
    // console.log("🔄 Starting batch update of all item embeddings...");

    try {
      let offset = 0;
      let totalProcessed = 0;

      while (true) {
        // Get batch of items
        const response = await this.databases.listDocuments(
          this.databaseId,
          env.ITEM_EMBEDDINGS_COLLECTION_ID,
          [
            Query.equal("isActive", true),
            Query.limit(batchSize),
            Query.offset(offset),
          ]
        );

        if (response.documents.length === 0) {
          break; // No more items
        }

        // Process batch
        const itemIds = response.documents.map((doc) => doc.itemId);
        await this.computeBatchRepresentations(itemIds);

        totalProcessed += response.documents.length;
        offset += batchSize;

        // console.log(`✅ Processed ${totalProcessed} items...`);

        // Small delay to not overwhelm the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // console.log(
      //   `🎉 Batch update complete! Processed ${totalProcessed} items.`
      // );
    } catch (error) {
      console.error("Error in batch update:", error);
      throw error;
    }
  }

  // ============================================================================
  // TEXT EMBEDDING INTEGRATION (FUTURE)
  // ============================================================================

  async computeTextEmbedding(text) {
    // Placeholder for future text embedding integration
    // Could integrate with OpenAI, Sentence-BERT, or custom models

    // For now, return a simple hash-based embedding
    const embedding = new Array(this.TEXT_EMBEDDING_DIM).fill(0.0);

    // Simple word-based features
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      const hash = this.simpleHash(word) % this.TEXT_EMBEDDING_DIM;
      embedding[hash] += 1.0;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map((val) => val / norm);
    }

    return embedding;
  }
}

module.exports = ItemRepresentationTower;
