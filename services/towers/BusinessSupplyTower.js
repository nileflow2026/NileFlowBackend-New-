const { Client, Databases, Query, ID } = require("node-appwrite");
const { db } = require("../../src/appwrite");
const { env } = require("../../src/env");

/**
 * Business & Supply Tower - Captures what the company must optimize
 *
 * This tower balances business objectives with user experience by considering:
 * - Inventory levels and stock management
 * - Profit margins and pricing strategy
 * - Logistics constraints and delivery costs
 * - Strategic category priorities
 * - Sponsored content (controlled influence)
 * - Supply chain optimization
 *
 * Output: Business boost scalar + Supply suppression score
 * Key Property: INFLUENCES RANKING BUT NEVER DOMINATES IT
 */

class BusinessSupplyTower {
  constructor(appwriteClient = null, databaseId = null) {
    this.client = appwriteClient;
    this.databases = appwriteClient
      ? new Databases(appwriteClient)
      : new Databases(new Client());
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;

    // Configuration
    this.MAX_BUSINESS_BOOST = 2.0; // Maximum business boost (never dominate)
    this.MAX_SUPPLY_SUPPRESSION = 0.7; // Maximum suppression factor

    // Business objective weights
    this.BUSINESS_WEIGHTS = {
      MARGIN: 0.25, // Profit margin considerations
      INVENTORY: 0.3, // Stock management priority
      LOGISTICS: 0.2, // Delivery optimization
      STRATEGIC: 0.15, // Strategic category focus
      SPONSORED: 0.1, // Sponsored content (controlled)
    };

    // Inventory health thresholds
    this.INVENTORY_THRESHOLDS = {
      OVERSTOCKED: { daysOfStock: 90, action: "push", boost: 1.5 },
      HEALTHY: { daysOfStock: 30, action: "normal", boost: 1.0 },
      LOW_STOCK: { daysOfStock: 7, action: "reduce", boost: 0.8 },
      CRITICAL: { daysOfStock: 3, action: "suppress", boost: 0.5 },
      OUT_OF_STOCK: { daysOfStock: 0, action: "hide", boost: 0.0 },
    };

    // Margin bands
    this.MARGIN_BANDS = {
      HIGH: { min: 30, boost: 1.4, priority: "high" }, // >30% margin
      MEDIUM: { min: 15, boost: 1.2, priority: "medium" }, // 15-30% margin
      LOW: { min: 5, boost: 1.0, priority: "low" }, // 5-15% margin
      BREAK_EVEN: { min: 0, boost: 0.8, priority: "avoid" }, // 0-5% margin
      LOSS: { min: -100, boost: 0.6, priority: "critical" }, // Negative margin
    };

    // Strategic priorities
    this.STRATEGIC_CATEGORIES = [
      "electronics", // High growth category
      "fashion", // High engagement
      "home_appliances", // High margin
      "beauty", // Strategic focus
      "sports", // Growth opportunity
    ];

    // Logistics complexity factors
    this.LOGISTICS_FACTORS = {
      DELIVERY_ZONES: {
        same_city: { complexity: 1.0, cost: 1.0, boost: 1.2 },
        same_state: { complexity: 1.2, cost: 1.3, boost: 1.0 },
        neighboring_state: { complexity: 1.5, cost: 1.8, boost: 0.9 },
        cross_country: { complexity: 2.0, cost: 2.5, boost: 0.7 },
      },
      ITEM_TYPES: {
        standard: { complexity: 1.0, boost: 1.0 },
        fragile: { complexity: 1.3, boost: 0.9 },
        large: { complexity: 1.5, boost: 0.8 },
        hazardous: { complexity: 2.0, boost: 0.7 },
        frozen: { complexity: 2.5, boost: 0.6 },
      },
    };

    // Cache for performance
    this.businessCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // ============================================================================
  // CORE BUSINESS COMPUTATION
  // ============================================================================

  /**
   * Compute business boost and supply constraints
   * @param {string} itemId - Item identifier
   * @param {Object} businessData - Business data (optional, for batch processing)
   * @param {Object} userContext - User context for logistics optimization
   * @returns {Object} { businessBoost: Number, supplySuppression: Number, businessMetrics: Object }
   */
  async computeBusinessOptimization(
    itemId,
    businessData = null,
    userContext = {}
  ) {
    try {
      // Check cache first
      const cacheKey = `business_${itemId}_${
        userContext.location || "default"
      }`;
      const cached = this.businessCache.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.data;
      }

      // 1. Get business metrics data
      const business = businessData || (await this.getBusinessMetrics(itemId));
      if (!business) {
        return this.getFallbackBusiness(itemId);
      }

      // 2. Analyze inventory health
      const inventoryAnalysis = this.analyzeInventoryHealth(business);

      // 3. Assess margin impact
      const marginAnalysis = this.assessMarginImpact(business);

      // 4. Evaluate logistics constraints
      const logisticsAnalysis = await this.evaluateLogistics(
        business,
        userContext
      );

      // 5. Apply strategic priorities
      const strategicAnalysis = this.applyStrategicPriorities(business);

      // 6. Handle sponsored content
      const sponsoredAnalysis = this.handleSponsoredContent(business);

      // 7. Compute final business scores
      const businessScores = this.computeFinalBusinessScores({
        inventory: inventoryAnalysis,
        margin: marginAnalysis,
        logistics: logisticsAnalysis,
        strategic: strategicAnalysis,
        sponsored: sponsoredAnalysis,
      });

      // 8. Update business metrics with computed scores
      await this.updateBusinessMetrics(itemId, businessScores);

      const result = {
        businessBoostScalar: businessScores.boost,
        supplySuppression: businessScores.suppression,
        businessMetrics: {
          inventoryHealth: inventoryAnalysis.health,
          marginBand: marginAnalysis.band,
          logisticsComplexity: logisticsAnalysis.complexity,
          strategicPriority: strategicAnalysis.priority,
          isSponsored: sponsoredAnalysis.isSponsored,
        },
        analysis: {
          inventory: inventoryAnalysis,
          margin: marginAnalysis,
          logistics: logisticsAnalysis,
          strategic: strategicAnalysis,
          sponsored: sponsoredAnalysis,
        },
      };

      // Cache result
      this.businessCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(
        `Error computing business optimization for ${itemId}:`,
        error
      );
      return this.getFallbackBusiness(itemId);
    }
  }

  /**
   * Batch compute business optimizations (more efficient)
   * @param {Array} itemIds - Array of item IDs
   * @param {Object} userContext - User context for logistics
   * @returns {Map} Map of itemId -> business data
   */
  async computeBatchBusiness(itemIds, userContext = {}) {
    const results = new Map();

    try {
      // Get all business data in batches
      const businessDataMap = await this.getBatchBusinessData(itemIds);

      // Process each item
      for (const itemId of itemIds) {
        const businessData = businessDataMap.get(itemId);
        const businessOpt = await this.computeBusinessOptimization(
          itemId,
          businessData,
          userContext
        );
        results.set(itemId, businessOpt);
      }

      return results;
    } catch (error) {
      console.error("Error in batch business computation:", error);

      // Return fallback for all items
      for (const itemId of itemIds) {
        results.set(itemId, this.getFallbackBusiness(itemId));
      }

      return results;
    }
  }

  // ============================================================================
  // DATA RETRIEVAL
  // ============================================================================

  async getBusinessMetrics(itemId) {
    try {
      let businessData = {
        itemId: itemId,
        // Inventory defaults
        currentStock: 50,
        reservedStock: 5,
        availableStock: 45,
        reorderLevel: 10,
        stockoutRisk: 0.2,
        // Financial defaults
        costPrice: 0,
        sellingPrice: 0,
        marginPercent: 30,
        marginBand: "medium",
        // Logistics defaults
        warehouseLocation: "Lagos",
        averageDeliveryTime: 3,
        shippingCost: 500,
        deliveryComplexity: 1.0,
        // Strategic defaults
        isStrategicCategory: false,
        isPromoted: false,
        promotionBoost: 1.0,
        isSponsoredByVendor: false,
        sponsorBoost: 1.0,
        // Computed defaults
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date(),
      };

      // Get real product data if available
      if (env.APPWRITE_PRODUCT_COLLECTION_ID) {
        try {
          const product = await this.databases.getDocument(
            this.databaseId,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            itemId
          );

          // Map product data to business metrics
          businessData.sellingPrice = product.price || 0;
          businessData.costPrice = (product.price || 0) * 0.7; // Assume 30% margin
          businessData.marginPercent =
            product.price > 0
              ? ((product.price - businessData.costPrice) / product.price) * 100
              : 30;
          businessData.marginBand = this.calculateMarginBand(
            businessData.marginPercent
          );
          businessData.currentStock =
            product.stockLevel || product.quantity || 50;
          businessData.availableStock = Math.max(
            0,
            businessData.currentStock - businessData.reservedStock
          );
          businessData.stockoutRisk =
            businessData.currentStock <= businessData.reorderLevel ? 0.8 : 0.2;
          businessData.isPromoted =
            product.isPromoted || product.promoted || false;
          businessData.promotionBoost = businessData.isPromoted ? 1.2 : 1.0;
          businessData.warehouseLocation =
            product.location || product.warehouse || "Lagos";
          businessData.averageDeliveryTime = product.deliveryTime || 3;

          // Calculate business boost based on margin and inventory health
          businessData.businessBoostScalar =
            this.calculateBusinessBoost(businessData);
          businessData.supplySuppression =
            this.calculateSupplySupp(businessData);

          // console.log(
          //   `💼 BusinessSupply: Product ${itemId} - Stock: ${
          //     businessData.currentStock
          //   }, Margin: ${businessData.marginPercent.toFixed(1)}%`
          // );
        } catch (error) {
          console.warn(
            `Could not fetch product data for business metrics: ${error.message}`
          );
        }
      }

      return businessData;
    } catch (error) {
      console.error(`Error retrieving business metrics for ${itemId}:`, error);
      return this.getFallbackBusinessData(itemId);
    }
  }

  calculateMarginBand(marginPercent) {
    if (marginPercent < 10) return "low";
    if (marginPercent < 25) return "medium";
    if (marginPercent < 40) return "high";
    return "premium";
  }

  calculateBusinessBoost(businessData) {
    let boost = 1.0;

    // Higher margins get slight boost (but capped to prevent gaming)
    if (businessData.marginPercent > 30) boost += 0.1;
    if (businessData.marginPercent > 50) boost += 0.1;

    // Promoted items get boost
    if (businessData.isPromoted) boost += 0.2;

    // High stock items get slight boost (prevents stockouts)
    if (businessData.currentStock > 20) boost += 0.05;

    return Math.min(boost, this.MAX_BUSINESS_BOOST); // Cap the boost
  }

  calculateSupplySupp(businessData) {
    let suppression = 0.0;

    // Low stock items get suppressed to prevent stockouts
    if (businessData.stockoutRisk > 0.7) suppression += 0.3;
    if (businessData.currentStock < 5) suppression += 0.4;

    // Very low margin items get slight suppression
    if (businessData.marginPercent < 5) suppression += 0.1;

    return Math.min(suppression, this.MAX_SUPPLY_SUPPRESSION);
  }

  getFallbackBusinessData(itemId) {
    return {
      itemId: itemId,
      currentStock: 50,
      reservedStock: 5,
      availableStock: 45,
      reorderLevel: 10,
      stockoutRisk: 0.2,
      costPrice: 0,
      sellingPrice: 0,
      marginPercent: 30,
      marginBand: "medium",
      warehouseLocation: "Lagos",
      averageDeliveryTime: 3,
      shippingCost: 500,
      deliveryComplexity: 1.0,
      isStrategicCategory: false,
      isPromoted: false,
      promotionBoost: 1.0,
      isSponsoredByVendor: false,
      sponsorBoost: 1.0,
      businessBoostScalar: 1.0,
      supplySuppression: 0.0,
      lastUpdated: new Date(),
    };
  }

  async getBatchBusinessData(itemIds) {
    const results = new Map();

    try {
      // Query in batches of 100 (Appwrite limit)
      const batchSize = 100;
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);

        const response = await this.databases.listDocuments(
          this.databaseId,
          env.BUSINESS_METRICS_COLLECTION_ID,
          [Query.equal("itemId", batch), Query.equal("isActive", true)]
        );

        for (const doc of response.documents) {
          results.set(doc.itemId, {
            itemId: doc.itemId,
            currentStock: doc.currentStock || 0,
            reservedStock: doc.reservedStock || 0,
            availableStock: doc.availableStock || 0,
            reorderLevel: doc.reorderLevel || 0,
            stockoutRisk: doc.stockoutRisk || 0,
            costPrice: doc.costPrice || 0,
            sellingPrice: doc.sellingPrice || 0,
            marginPercent: doc.marginPercent || 0,
            marginBand: doc.marginBand || "low",
            warehouseLocation: doc.warehouseLocation || "unknown",
            averageDeliveryTime: doc.averageDeliveryTime || 7,
            shippingCost: doc.shippingCost || 0,
            deliveryComplexity: doc.deliveryComplexity || 1.0,
            isStrategicCategory: doc.isStrategicCategory || false,
            isPromoted: doc.isPromoted || false,
            promotionBoost: doc.promotionBoost || 1.0,
            isSponsoredByVendor: doc.isSponsoredByVendor || false,
            sponsorBoost: doc.sponsorBoost || 1.0,
            lastUpdated: new Date(doc.lastUpdated),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error retrieving batch business data:", error);
      return results;
    }
  }

  // ============================================================================
  // INVENTORY HEALTH ANALYSIS
  // ============================================================================

  analyzeInventoryHealth(business) {
    const analysis = {
      health: "unknown",
      daysOfStock: 0,
      action: "normal",
      boost: 1.0,
      risk: "low",
      urgency: "none",
    };

    try {
      const availableStock = business.availableStock || 0;
      const stockVelocity = this.estimateStockVelocity(business);

      // Calculate days of stock remaining
      if (stockVelocity > 0) {
        analysis.daysOfStock = availableStock / stockVelocity;
      } else {
        analysis.daysOfStock = availableStock > 0 ? 999 : 0; // High if no velocity, 0 if no stock
      }

      // Determine health category
      if (
        analysis.daysOfStock >=
        this.INVENTORY_THRESHOLDS.OVERSTOCKED.daysOfStock
      ) {
        analysis.health = "overstocked";
        analysis.action = this.INVENTORY_THRESHOLDS.OVERSTOCKED.action;
        analysis.boost = this.INVENTORY_THRESHOLDS.OVERSTOCKED.boost;
        analysis.urgency = "high"; // Need to move inventory
      } else if (
        analysis.daysOfStock >= this.INVENTORY_THRESHOLDS.HEALTHY.daysOfStock
      ) {
        analysis.health = "healthy";
        analysis.action = this.INVENTORY_THRESHOLDS.HEALTHY.action;
        analysis.boost = this.INVENTORY_THRESHOLDS.HEALTHY.boost;
      } else if (
        analysis.daysOfStock >= this.INVENTORY_THRESHOLDS.LOW_STOCK.daysOfStock
      ) {
        analysis.health = "low_stock";
        analysis.action = this.INVENTORY_THRESHOLDS.LOW_STOCK.action;
        analysis.boost = this.INVENTORY_THRESHOLDS.LOW_STOCK.boost;
        analysis.risk = "medium";
      } else if (
        analysis.daysOfStock >= this.INVENTORY_THRESHOLDS.CRITICAL.daysOfStock
      ) {
        analysis.health = "critical";
        analysis.action = this.INVENTORY_THRESHOLDS.CRITICAL.action;
        analysis.boost = this.INVENTORY_THRESHOLDS.CRITICAL.boost;
        analysis.risk = "high";
        analysis.urgency = "medium";
      } else {
        analysis.health = "out_of_stock";
        analysis.action = this.INVENTORY_THRESHOLDS.OUT_OF_STOCK.action;
        analysis.boost = this.INVENTORY_THRESHOLDS.OUT_OF_STOCK.boost;
        analysis.risk = "critical";
      }

      // Consider stockout risk
      if (business.stockoutRisk > 0.7) {
        analysis.boost *= 0.8; // Reduce boost for high stockout risk
        analysis.risk = "high";
      }

      return analysis;
    } catch (error) {
      console.error("Error analyzing inventory health:", error);
      return analysis;
    }
  }

  estimateStockVelocity(business) {
    // Estimate daily stock velocity (items sold per day)
    // This could be enhanced with actual sales data

    // Simple heuristic based on stock levels and reorder patterns
    const totalStock = business.currentStock + business.reservedStock;
    const reorderLevel = business.reorderLevel || totalStock * 0.2;

    if (totalStock > 0 && reorderLevel > 0) {
      // Assume reorder happens when stock hits reorder level
      // and estimate velocity from that
      return (totalStock - reorderLevel) / 30; // 30-day cycle assumption
    }

    return 0.1; // Default low velocity
  }

  // ============================================================================
  // MARGIN ANALYSIS
  // ============================================================================

  assessMarginImpact(business) {
    const analysis = {
      band: "unknown",
      priority: "low",
      boost: 1.0,
      profitability: "unknown",
      recommendation: "maintain",
    };

    try {
      const marginPercent = business.marginPercent || 0;

      // Determine margin band
      if (marginPercent >= this.MARGIN_BANDS.HIGH.min) {
        analysis.band = "high";
        analysis.priority = this.MARGIN_BANDS.HIGH.priority;
        analysis.boost = this.MARGIN_BANDS.HIGH.boost;
        analysis.profitability = "excellent";
        analysis.recommendation = "promote";
      } else if (marginPercent >= this.MARGIN_BANDS.MEDIUM.min) {
        analysis.band = "medium";
        analysis.priority = this.MARGIN_BANDS.MEDIUM.priority;
        analysis.boost = this.MARGIN_BANDS.MEDIUM.boost;
        analysis.profitability = "good";
        analysis.recommendation = "maintain";
      } else if (marginPercent >= this.MARGIN_BANDS.LOW.min) {
        analysis.band = "low";
        analysis.priority = this.MARGIN_BANDS.LOW.priority;
        analysis.boost = this.MARGIN_BANDS.LOW.boost;
        analysis.profitability = "acceptable";
        analysis.recommendation = "monitor";
      } else if (marginPercent >= this.MARGIN_BANDS.BREAK_EVEN.min) {
        analysis.band = "break_even";
        analysis.priority = this.MARGIN_BANDS.BREAK_EVEN.priority;
        analysis.boost = this.MARGIN_BANDS.BREAK_EVEN.boost;
        analysis.profitability = "poor";
        analysis.recommendation = "review";
      } else {
        analysis.band = "loss";
        analysis.priority = this.MARGIN_BANDS.LOSS.priority;
        analysis.boost = this.MARGIN_BANDS.LOSS.boost;
        analysis.profitability = "critical";
        analysis.recommendation = "urgent_review";
      }

      // Additional considerations
      if (business.costPrice > business.sellingPrice) {
        analysis.boost *= 0.5; // Severe penalty for selling at loss
      }

      return analysis;
    } catch (error) {
      console.error("Error assessing margin impact:", error);
      return analysis;
    }
  }

  // ============================================================================
  // LOGISTICS EVALUATION
  // ============================================================================

  async evaluateLogistics(business, userContext) {
    const analysis = {
      complexity: "unknown",
      deliveryZone: "unknown",
      cost: 1.0,
      boost: 1.0,
      estimatedDeliveryTime: business.averageDeliveryTime || 7,
      feasibility: "possible",
    };

    try {
      const warehouseLocation = business.warehouseLocation || "unknown";
      const userLocation = userContext.location || "unknown";

      // 1. Determine delivery zone complexity
      const deliveryZone = this.determineDeliveryZone(
        warehouseLocation,
        userLocation
      );
      analysis.deliveryZone = deliveryZone;

      if (this.LOGISTICS_FACTORS.DELIVERY_ZONES[deliveryZone]) {
        const zoneInfo = this.LOGISTICS_FACTORS.DELIVERY_ZONES[deliveryZone];
        analysis.complexity = zoneInfo.complexity;
        analysis.cost = zoneInfo.cost;
        analysis.boost = zoneInfo.boost;
        analysis.estimatedDeliveryTime =
          business.averageDeliveryTime * zoneInfo.complexity;
      }

      // 2. Apply item type complexity
      const itemType = this.determineItemType(business);
      if (this.LOGISTICS_FACTORS.ITEM_TYPES[itemType]) {
        const typeInfo = this.LOGISTICS_FACTORS.ITEM_TYPES[itemType];
        analysis.complexity *= typeInfo.complexity;
        analysis.boost *= typeInfo.boost;
      }

      // 3. Consider shipping costs
      const shippingCostRatio =
        business.shippingCost / (business.sellingPrice || 1);
      if (shippingCostRatio > 0.3) {
        analysis.boost *= 0.8; // High shipping cost relative to item price
      }

      // 4. Delivery feasibility
      if (analysis.estimatedDeliveryTime > 14) {
        analysis.feasibility = "difficult";
        analysis.boost *= 0.7;
      } else if (analysis.estimatedDeliveryTime > 7) {
        analysis.feasibility = "moderate";
        analysis.boost *= 0.9;
      } else {
        analysis.feasibility = "easy";
      }

      return analysis;
    } catch (error) {
      console.error("Error evaluating logistics:", error);
      return analysis;
    }
  }

  determineDeliveryZone(warehouseLocation, userLocation) {
    // Simplified zone determination
    // In production, this would use actual geographic data

    if (warehouseLocation === "unknown" || userLocation === "unknown") {
      return "same_state"; // Default assumption
    }

    if (warehouseLocation === userLocation) {
      return "same_city";
    }

    // This would be enhanced with actual geographic logic
    return "same_state"; // Default for now
  }

  determineItemType(business) {
    // Determine item type based on business data
    // This would ideally be part of the item data

    // Simple heuristics based on delivery complexity
    const complexity = business.deliveryComplexity || 1.0;

    if (complexity >= 2.5) return "frozen";
    if (complexity >= 2.0) return "hazardous";
    if (complexity >= 1.5) return "large";
    if (complexity >= 1.3) return "fragile";
    return "standard";
  }

  // ============================================================================
  // STRATEGIC PRIORITIES
  // ============================================================================

  applyStrategicPriorities(business) {
    const analysis = {
      priority: "normal",
      boost: 1.0,
      strategic: false,
      promoted: false,
      recommendation: "none",
    };

    try {
      // 1. Strategic category boost
      if (business.isStrategicCategory) {
        analysis.strategic = true;
        analysis.priority = "high";
        analysis.boost = 1.3; // Strategic category boost
        analysis.recommendation = "prioritize";
      }

      // 2. Promotional boost
      if (business.isPromoted) {
        analysis.promoted = true;
        analysis.boost *= business.promotionBoost || 1.2;
        analysis.recommendation = "promote";
      }

      // 3. Consider business objectives alignment
      // This is where company strategy influences recommendations
      // but within controlled bounds

      return analysis;
    } catch (error) {
      console.error("Error applying strategic priorities:", error);
      return analysis;
    }
  }

  // ============================================================================
  // SPONSORED CONTENT HANDLING
  // ============================================================================

  handleSponsoredContent(business) {
    const analysis = {
      isSponsored: false,
      sponsorType: "none",
      boost: 1.0,
      transparency: "clear",
      ethicalScore: 1.0,
    };

    try {
      // 1. Check for vendor sponsorship
      if (business.isSponsoredByVendor) {
        analysis.isSponsored = true;
        analysis.sponsorType = "vendor";

        // Apply controlled sponsored boost
        const sponsorBoost = Math.min(1.5, business.sponsorBoost || 1.2);
        analysis.boost = sponsorBoost;

        // Ensure transparency
        analysis.transparency = "sponsored";
      }

      // 2. Ethical considerations
      // Sponsored content should never completely override user intent
      // or compromise trust
      const maxSponsoredImpact = 0.3; // 30% max impact from sponsorship
      if (analysis.boost > 1.0 + maxSponsoredImpact) {
        analysis.boost = 1.0 + maxSponsoredImpact;
        analysis.ethicalScore = 0.8; // Reduced ethical score for excessive sponsorship
      }

      return analysis;
    } catch (error) {
      console.error("Error handling sponsored content:", error);
      return analysis;
    }
  }

  // ============================================================================
  // FINAL SCORE COMPUTATION
  // ============================================================================

  computeFinalBusinessScores(analysis) {
    const { inventory, margin, logistics, strategic, sponsored } = analysis;

    try {
      // 1. Compute business boost (weighted combination)
      let businessBoost =
        (this.BUSINESS_WEIGHTS.INVENTORY * inventory.boost +
          this.BUSINESS_WEIGHTS.MARGIN * margin.boost +
          this.BUSINESS_WEIGHTS.LOGISTICS * logistics.boost +
          this.BUSINESS_WEIGHTS.STRATEGIC * strategic.boost +
          this.BUSINESS_WEIGHTS.SPONSORED * sponsored.boost) /
        Object.values(this.BUSINESS_WEIGHTS).reduce((sum, w) => sum + w, 0);

      // 2. Apply caps to prevent business logic from dominating
      businessBoost = Math.min(
        this.MAX_BUSINESS_BOOST,
        Math.max(0.5, businessBoost)
      );

      // 3. Compute supply suppression
      let supplySuppression = 0.0;

      // Inventory-based suppression
      if (inventory.health === "out_of_stock") {
        supplySuppression = 1.0; // Complete suppression
      } else if (inventory.health === "critical") {
        supplySuppression = 0.8;
      } else if (inventory.health === "low_stock") {
        supplySuppression = 0.3;
      }

      // Logistics-based suppression
      if (logistics.feasibility === "difficult") {
        supplySuppression = Math.max(supplySuppression, 0.4);
      }

      // Margin-based suppression (for loss-making items)
      if (margin.band === "loss") {
        supplySuppression = Math.max(supplySuppression, 0.5);
      }

      // Apply suppression cap
      supplySuppression = Math.min(
        this.MAX_SUPPLY_SUPPRESSION,
        supplySuppression
      );

      // 4. Final adjustments
      // Business boost should be reduced by supply issues
      businessBoost *= 1.0 - supplySuppression * 0.5;

      return {
        boost: businessBoost,
        suppression: supplySuppression,
        confidence: this.computeConfidence(analysis),
      };
    } catch (error) {
      console.error("Error computing final business scores:", error);
      return {
        boost: 1.0,
        suppression: 0.0,
        confidence: 0.5,
      };
    }
  }

  computeConfidence(analysis) {
    // Confidence in business score based on data quality
    let confidence = 1.0;

    // Reduce confidence for unknown/default values
    if (analysis.inventory.health === "unknown") confidence *= 0.8;
    if (analysis.margin.band === "unknown") confidence *= 0.8;
    if (analysis.logistics.complexity === "unknown") confidence *= 0.9;

    return Math.max(0.1, confidence);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  getFallbackBusiness(itemId) {
    return {
      businessBoostScalar: 1.0,
      supplySuppression: 0.0,
      businessMetrics: {
        inventoryHealth: "unknown",
        marginBand: "unknown",
        logisticsComplexity: "unknown",
        strategicPriority: "normal",
        isSponsored: false,
      },
      error: true,
    };
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  async updateBusinessMetrics(itemId, businessScores) {
    try {
      const metrics = await this.databases.listDocuments(
        this.databaseId,
        env.BUSINESS_METRICS_COLLECTION_ID,
        [Query.equal("itemId", itemId)]
      );

      if (metrics.documents.length > 0) {
        await this.databases.updateDocument(
          this.databaseId,
          env.BUSINESS_METRICS_COLLECTION_ID,
          metrics.documents[0].$id,
          {
            businessBoostScalar: businessScores.boost,
            supplySuppression: businessScores.suppression,
            lastUpdated: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      console.error("Error updating business metrics:", error);
      // Don't throw - this is not critical for the response
    }
  }

  // ============================================================================
  // BUSINESS INTELLIGENCE & REPORTING
  // ============================================================================

  async generateBusinessInsights(timeframe = "7d") {
    try {
      const insights = {
        inventoryHealth: await this.analyzeInventoryTrends(timeframe),
        marginOptimization: await this.analyzeMarginOpportunities(),
        logisticsEfficiency: await this.analyzeLogisticsPerformance(),
        strategicImpact: await this.analyzeStrategicPerformance(),
        sponsoredROI: await this.analyzeSponsoredPerformance(),
      };

      return insights;
    } catch (error) {
      console.error("Error generating business insights:", error);
      return null;
    }
  }

  async analyzeInventoryTrends(timeframe) {
    // Analyze inventory health across all items
    // This would aggregate inventory status and identify trends
    return {
      overstocked: 0,
      healthy: 0,
      low_stock: 0,
      critical: 0,
      out_of_stock: 0,
      recommendations: [],
    };
  }

  async analyzeMarginOpportunities() {
    // Identify items with margin optimization potential
    return {
      highMarginItems: [],
      lowMarginItems: [],
      lossItems: [],
      opportunities: [],
    };
  }

  async analyzeLogisticsPerformance() {
    // Analyze logistics efficiency and costs
    return {
      averageDeliveryTime: 0,
      averageShippingCost: 0,
      complexityDistribution: {},
      optimizationOpportunities: [],
    };
  }

  async analyzeStrategicPerformance() {
    // Analyze performance of strategic categories and promotions
    return {
      strategicCategoryPerformance: {},
      promotionEffectiveness: {},
      recommendations: [],
    };
  }

  async analyzeSponsoredPerformance() {
    // Analyze ROI and effectiveness of sponsored content
    return {
      totalSponsored: 0,
      averageBoost: 0,
      roi: 0,
      ethicalCompliance: 1.0,
      recommendations: [],
    };
  }

  // ============================================================================
  // REAL-TIME BUSINESS UPDATES
  // ============================================================================

  async handleInventoryUpdate(itemId, newStock) {
    try {
      // Update inventory data and recompute business scores
      const metrics = await this.databases.listDocuments(
        this.databaseId,
        env.BUSINESS_METRICS_COLLECTION_ID,
        [Query.equal("itemId", itemId)]
      );

      if (metrics.documents.length > 0) {
        await this.databases.updateDocument(
          this.databaseId,
          env.BUSINESS_METRICS_COLLECTION_ID,
          metrics.documents[0].$id,
          {
            currentStock:
              newStock.currentStock || metrics.documents[0].currentStock,
            availableStock:
              newStock.availableStock || metrics.documents[0].availableStock,
            reservedStock:
              newStock.reservedStock || metrics.documents[0].reservedStock,
            stockoutRisk: this.calculateStockoutRisk(newStock),
            lastUpdated: new Date().toISOString(),
          }
        );

        // Clear cache to force recomputation
        const cacheKeys = Array.from(this.businessCache.keys()).filter((key) =>
          key.startsWith(`business_${itemId}`)
        );
        cacheKeys.forEach((key) => this.businessCache.delete(key));

        // Recompute business scores
        await this.computeBusinessOptimization(itemId);
      }
    } catch (error) {
      console.error("Error handling inventory update:", error);
    }
  }

  calculateStockoutRisk(stock) {
    const available = stock.availableStock || 0;
    const velocity = this.estimateStockVelocity(stock);

    if (velocity === 0) return 0.0;

    const daysRemaining = available / velocity;

    if (daysRemaining <= 1) return 1.0; // Critical
    if (daysRemaining <= 3) return 0.8; // High
    if (daysRemaining <= 7) return 0.5; // Medium
    if (daysRemaining <= 14) return 0.2; // Low
    return 0.0; // Very low
  }

  async handlePriceUpdate(itemId, newPricing) {
    try {
      // Update pricing and margin data
      const costPrice = newPricing.costPrice || 0;
      const sellingPrice = newPricing.sellingPrice || 0;
      const marginPercent =
        sellingPrice > 0
          ? ((sellingPrice - costPrice) / sellingPrice) * 100
          : 0;

      let marginBand = "low";
      if (marginPercent >= 30) marginBand = "high";
      else if (marginPercent >= 15) marginBand = "medium";
      else if (marginPercent < 0) marginBand = "loss";
      else if (marginPercent < 5) marginBand = "break_even";

      const metrics = await this.databases.listDocuments(
        this.databaseId,
        env.BUSINESS_METRICS_COLLECTION_ID,
        [Query.equal("itemId", itemId)]
      );

      if (metrics.documents.length > 0) {
        await this.databases.updateDocument(
          this.databaseId,
          env.BUSINESS_METRICS_COLLECTION_ID,
          metrics.documents[0].$id,
          {
            costPrice: costPrice,
            sellingPrice: sellingPrice,
            marginPercent: marginPercent,
            marginBand: marginBand,
            lastUpdated: new Date().toISOString(),
          }
        );

        // Clear cache and recompute
        const cacheKeys = Array.from(this.businessCache.keys()).filter((key) =>
          key.startsWith(`business_${itemId}`)
        );
        cacheKeys.forEach((key) => this.businessCache.delete(key));

        await this.computeBusinessOptimization(itemId);
      }
    } catch (error) {
      console.error("Error handling price update:", error);
    }
  }

  // ============================================================================
  // ADDITIONAL UTILITY METHODS
  // ============================================================================

  /**
   * Store business metrics for an item
   * @param {string} itemId - Item identifier
   * @param {Object} metrics - Business metrics data
   */
  async storeBusinessMetrics(itemId, metrics) {
    try {
      const document = {
        itemId: itemId,
        currentStock: metrics.currentStock || 0,
        reservedStock: metrics.reservedStock || 0,
        availableStock: metrics.availableStock || 0,
        reorderLevel: metrics.reorderLevel || 0,
        stockoutRisk: metrics.stockoutRisk || 0.0,
        costPrice: metrics.costPrice || 0.0,
        sellingPrice: metrics.sellingPrice || 0.0,
        marginPercent: metrics.marginPercent || 0.0,
        marginBand: metrics.marginBand || "low",
        warehouseLocation: metrics.warehouseLocation || "main",
        averageDeliveryTime: metrics.averageDeliveryTime || 3,
        shippingCost: metrics.shippingCost || 0.0,
        deliveryComplexity: this.mapDeliveryComplexity(
          metrics.deliveryComplexity || "same_city"
        ),
        isStrategicCategory: metrics.isStrategicItem || false,
        isPromoted: metrics.isPremiumItem || false,
        promotionBoost: 1.0,
        isSponsoredByVendor: metrics.isSponsored || false,
        sponsorBoost: metrics.isSponsored ? 1.2 : 1.0,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: metrics.lastUpdated || new Date().toISOString(),
        isActive: true,
      };

      await this.databases.createDocument(
        this.databaseId,
        env.BUSINESS_METRICS_COLLECTION_ID,
        ID.unique(),
        document
      );

      return true;
    } catch (error) {
      console.error(`Error storing business metrics for ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Batch compute business optimizations (alias for computeBatchBusiness)
   * @param {Array} itemIds - Array of item IDs
   * @param {Object} userContext - User context
   * @returns {Object} Results object with itemId keys
   */
  async computeBatchOptimization(itemIds, userContext = {}) {
    const batchMap = await this.computeBatchBusiness(itemIds, userContext);
    const results = {};

    for (const [itemId, data] of batchMap.entries()) {
      results[itemId] = {
        success: true,
        businessBoostScalar: data.businessBoostScalar,
        supplySuppression: data.supplySuppression,
        analysis: data.analysis,
      };
    }

    return results;
  }

  /**
   * Helper to map delivery complexity from string to float
   */
  mapDeliveryComplexity(complexity) {
    const mapping = {
      same_city: 1.0,
      cross_city: 1.5,
      same_state: 2.0,
      cross_state: 3.0,
      international: 5.0,
    };
    return mapping[complexity] || 1.0;
  }
}

module.exports = BusinessSupplyTower;
