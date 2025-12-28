const { Client, Databases, Query, ID } = require("node-appwrite");
const { env } = require("../src/env");

/**
 * Fusion Layer - The Brain of the Multi-Tower System
 *
 * This layer combines all tower outputs into final recommendation scores using:
 * - Learnable weighted combination of tower outputs
 * - Rule-based overrides for safety and business constraints
 * - Context-aware weight adjustment
 * - A/B testing framework for weight optimization
 *
 * Final Score Formula:
 * FinalScore = w1·IntentSim + w2·ItemQuality + w3·ContextBoost +
 *              w4·TrustScore + w5·BusinessBoost - w6·RiskPenalty
 *
 * Key Properties: Configurable, auditable, testable, resilient
 */

class FusionLayer {
  constructor(appwriteClient, databaseId = null) {
    this.client = appwriteClient;
    this.databases = appwriteClient
      ? new Databases(appwriteClient)
      : new Databases(new Client());
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;

    // System configuration
    this.SYSTEM_CONFIG = {
      ENABLE_FUSION_LOGGING: false, // Disable logging by default
      LOG_DETAILED_METRICS: false,
    };

    // Default fusion weights (can be overridden by config)
    this.DEFAULT_WEIGHTS = {
      intent: 0.25, // w1 - User Intent Tower
      itemQuality: 0.2, // w2 - Item Representation Tower
      context: 0.15, // w3 - Context & Culture Tower (Africa advantage!)
      trust: 0.2, // w4 - Social Proof & Trust Tower
      business: 0.1, // w5 - Business & Supply Tower (limited influence)
      riskPenalty: 0.1, // w6 - Risk penalty weight
    };

    // Score ranges and constraints
    this.SCORE_CONSTRAINTS = {
      MIN_SCORE: 0.0,
      MAX_SCORE: 1.0,
      MIN_TRUST_THRESHOLD: 0.3, // Minimum trust to show item
      MAX_RISK_TOLERANCE: 0.7, // Maximum risk allowed
      BUSINESS_INFLUENCE_CAP: 0.3, // Business can't dominate (30% max impact)
    };

    // Rule-based override thresholds
    this.OVERRIDE_RULES = {
      TRUST_CUTOFF: 0.2, // Hide items below this trust
      STOCKOUT_SUPPRESSION: 0.9, // Suppress out-of-stock items
      FRAUD_SUPPRESSION: 0.8, // Suppress high-risk fraud items
      NEW_ITEM_BOOST: 0.1, // Boost for cold-start items
      VIRAL_ITEM_BOOST: 0.2, // Boost for viral/trending items
    };

    // Weight adjustment factors
    this.CONTEXT_ADJUSTMENTS = {
      MOBILE: { intent: 1.1, context: 1.2, business: 0.9 }, // Mobile users - more intent/context
      DESKTOP: { intent: 0.9, itemQuality: 1.1, business: 1.1 }, // Desktop - more exploration
      NEW_USER: { trust: 1.3, context: 1.2, business: 0.8 }, // New users need trust
      RETURNING_USER: { intent: 1.2, business: 1.1 }, // Returning users - personalization
      PREMIUM_USER: { itemQuality: 1.1, business: 0.9 }, // Premium - quality over business
    };

    // Cache for active weight configurations
    this.weightsCache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  // ============================================================================
  // CORE FUSION COMPUTATION
  // ============================================================================

  /**
   * Fuse all tower outputs into final recommendation scores
   * @param {Array} items - Array of items with tower scores
   * @param {Object} context - User and request context
   * @param {string} configName - Weight configuration to use
   * @returns {Array} Items with final scores, sorted by relevance
   */
  async fuseRecommendations(items, context, configName = "default") {
    try {
      // Ensure items is an array
      if (!Array.isArray(items)) {
        console.warn("FusionLayer received non-array items:", typeof items);
        return [];
      }

      // Handle empty array case
      if (items.length === 0) {
        console.warn("FusionLayer received empty items array");
        return [];
      }

      // 1. Get fusion weights configuration
      const weights = await this.getWeightsConfiguration(configName, context);

      // 2. Apply context-based weight adjustments
      const adjustedWeights = this.adjustWeightsForContext(weights, context);

      // 3. Compute raw fusion scores for all items
      const scoredItems = items.map((item) =>
        this.computeFusionScore(item, adjustedWeights, context)
      );

      // 4. Apply rule-based overrides
      const overriddenItems = scoredItems.map((item) =>
        this.applyRuleOverrides(item, context)
      );

      // 5. Normalize and rank items
      const rankedItems = this.normalizeAndRank(overriddenItems, context);

      // 6. Log fusion decisions for learning
      await this.logFusionDecision(
        rankedItems.slice(0, 50),
        context,
        adjustedWeights
      );

      return rankedItems;
    } catch (error) {
      console.error("Error in fusion layer:", error);
      // Return items with default ranking (fail gracefully)
      if (Array.isArray(items) && items.length > 0) {
        return items
          .map((item) => ({ ...item, finalScore: 0.5, fusionError: true }))
          .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      }
      return [];
    }
  }

  // ============================================================================
  // FUSION SCORE COMPUTATION
  // ============================================================================

  computeFusionScore(item, weights, context) {
    try {
      // Extract tower scores (with defaults for missing towers)
      const towerScores = {
        intent: this.extractIntentScore(item),
        itemQuality: this.extractItemQualityScore(item),
        context: this.extractContextScore(item),
        trust: this.extractTrustScore(item),
        business: this.extractBusinessScore(item),
        riskPenalty: this.extractRiskPenalty(item),
      };

      // Validate scores (ensure all are in valid ranges)
      const validatedScores = this.validateTowerScores(towerScores);

      // Compute weighted fusion score using the formula:
      // FinalScore = w1·IntentSim + w2·ItemQuality + w3·ContextBoost +
      //              w4·TrustScore + w5·BusinessBoost - w6·RiskPenalty
      let fusionScore =
        weights.intent * validatedScores.intent +
        weights.itemQuality * validatedScores.itemQuality +
        weights.context * validatedScores.context +
        weights.trust * validatedScores.trust +
        weights.business * validatedScores.business -
        weights.riskPenalty * validatedScores.riskPenalty;

      // Apply business influence cap (prevent business logic from dominating)
      const businessInfluence = weights.business * validatedScores.business;
      if (businessInfluence > this.SCORE_CONSTRAINTS.BUSINESS_INFLUENCE_CAP) {
        const reduction =
          businessInfluence - this.SCORE_CONSTRAINTS.BUSINESS_INFLUENCE_CAP;
        fusionScore -= reduction;
      }

      // Ensure score is within valid range
      fusionScore = Math.max(
        this.SCORE_CONSTRAINTS.MIN_SCORE,
        Math.min(this.SCORE_CONSTRAINTS.MAX_SCORE, fusionScore)
      );

      // Return item with fusion score and tower breakdown
      return {
        ...item,
        finalScore: fusionScore,
        towerScores: validatedScores,
        fusionWeights: weights,
        fusionMeta: {
          rawScore: fusionScore,
          businessInfluence: businessInfluence,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error(
        `Error computing fusion score for item ${item.itemId}:`,
        error
      );
      return {
        ...item,
        finalScore: 0.1, // Low default score
        fusionError: true,
      };
    }
  }

  // ============================================================================
  // TOWER SCORE EXTRACTION
  // ============================================================================

  extractIntentScore(item) {
    // Intent similarity - how well item matches user intent
    if (item.intentSimilarity !== undefined) return item.intentSimilarity;
    if (item.userIntent?.shortTermIntentScore !== undefined)
      return item.userIntent.shortTermIntentScore;
    if (item.intent?.score !== undefined) return item.intent.score;
    return 0.1; // Low default for no intent data
  }

  extractItemQualityScore(item) {
    // Item quality - overall item representation quality
    if (item.itemQuality !== undefined) return item.itemQuality;
    if (item.itemRepresentation?.qualityScore !== undefined)
      return item.itemRepresentation.qualityScore;
    if (item.quality?.score !== undefined) return item.quality.score;
    return 0.5; // Neutral default
  }

  extractContextScore(item) {
    // Context relevance - cultural and situational relevance
    if (item.contextRelevance !== undefined) return item.contextRelevance;
    if (item.contextCulture?.contextRelevanceMultiplier !== undefined) {
      return Math.min(1.0, item.contextCulture.contextRelevanceMultiplier);
    }
    if (item.context?.multiplier !== undefined)
      return Math.min(1.0, item.context.multiplier);
    return 1.0; // Neutral default
  }

  extractTrustScore(item) {
    // Trust and social proof score
    if (item.trustScore !== undefined) return item.trustScore;
    if (item.socialProof?.trustScore !== undefined)
      return item.socialProof.trustScore;
    if (item.trust?.score !== undefined) return item.trust.score;
    return 0.5; // Neutral default
  }

  extractBusinessScore(item) {
    // Business optimization score
    if (item.businessBoost !== undefined)
      return Math.min(1.0, item.businessBoost);
    if (item.businessSupply?.businessBoostScalar !== undefined) {
      return Math.min(1.0, item.businessSupply.businessBoostScalar);
    }
    if (item.business?.boost !== undefined)
      return Math.min(1.0, item.business.boost);
    return 1.0; // Neutral default
  }

  extractRiskPenalty(item) {
    // Risk and fraud penalty
    if (item.riskPenalty !== undefined) return item.riskPenalty;
    if (item.socialProof?.riskPenalty !== undefined)
      return item.socialProof.riskPenalty;
    if (item.businessSupply?.supplySuppression !== undefined) {
      return Math.max(
        item.businessSupply.supplySuppression,
        item.riskPenalty || 0
      );
    }
    return 0.0; // No penalty default
  }

  validateTowerScores(scores) {
    const validated = {};

    // Validate each score is in range [0, 1] (except context which can be >1)
    validated.intent = Math.max(0.0, Math.min(1.0, scores.intent || 0.1));
    validated.itemQuality = Math.max(
      0.0,
      Math.min(1.0, scores.itemQuality || 0.5)
    );
    validated.context = Math.max(0.5, Math.min(2.0, scores.context || 1.0)); // Can boost up to 2x
    validated.trust = Math.max(0.0, Math.min(1.0, scores.trust || 0.5));
    validated.business = Math.max(0.5, Math.min(2.0, scores.business || 1.0)); // Can boost up to 2x
    validated.riskPenalty = Math.max(
      0.0,
      Math.min(1.0, scores.riskPenalty || 0.0)
    );

    return validated;
  }

  // ============================================================================
  // RULE-BASED OVERRIDES
  // ============================================================================

  applyRuleOverrides(item, context) {
    let { finalScore } = item;
    const overrides = [];

    try {
      // 1. Trust cutoff rule - hide untrusted items
      const trustScore = item.towerScores?.trust || 0.5;
      if (trustScore < this.OVERRIDE_RULES.TRUST_CUTOFF) {
        finalScore = 0.0;
        overrides.push("trust_cutoff");
      }

      // 2. Minimum trust threshold
      if (
        trustScore < this.SCORE_CONSTRAINTS.MIN_TRUST_THRESHOLD &&
        finalScore > 0
      ) {
        finalScore *= 0.3; // Heavy penalty for low trust
        overrides.push("low_trust_penalty");
      }

      // 3. Stock-out suppression
      const businessScore = item.towerScores?.business || 1.0;
      const riskPenalty = item.towerScores?.riskPenalty || 0.0;
      if (riskPenalty >= this.OVERRIDE_RULES.STOCKOUT_SUPPRESSION) {
        finalScore *= 0.1; // Almost hide out-of-stock items
        overrides.push("stockout_suppression");
      }

      // 4. Fraud suppression
      if (riskPenalty >= this.OVERRIDE_RULES.FRAUD_SUPPRESSION) {
        finalScore = 0.0; // Hide high fraud risk items
        overrides.push("fraud_suppression");
      }

      // 5. Cold start boost for new items
      if (this.isNewItem(item)) {
        finalScore += this.OVERRIDE_RULES.NEW_ITEM_BOOST;
        overrides.push("new_item_boost");
      }

      // 6. Viral item boost
      if (this.isViralItem(item)) {
        finalScore += this.OVERRIDE_RULES.VIRAL_ITEM_BOOST;
        overrides.push("viral_boost");
      }

      // 7. Context-specific overrides
      const contextOverrides = this.applyContextOverrides(
        item,
        context,
        finalScore
      );
      finalScore = contextOverrides.score;
      overrides.push(...contextOverrides.overrides);

      // 8. Final score constraints
      finalScore = Math.max(
        this.SCORE_CONSTRAINTS.MIN_SCORE,
        Math.min(this.SCORE_CONSTRAINTS.MAX_SCORE, finalScore)
      );

      return {
        ...item,
        finalScore: finalScore,
        overridesApplied: overrides,
        overrideMeta: {
          originalScore: item.finalScore,
          adjustedScore: finalScore,
          overrideCount: overrides.length,
        },
      };
    } catch (error) {
      console.error(
        `Error applying rule overrides for item ${item.itemId}:`,
        error
      );
      return {
        ...item,
        finalScore: finalScore * 0.5, // Reduce score on error
        overrideError: true,
      };
    }
  }

  applyContextOverrides(item, context, currentScore) {
    const overrides = [];
    let score = currentScore;

    // Mobile-specific overrides
    if (context.deviceType === "mobile") {
      // Boost items with good mobile experience
      if (item.metadata?.mobileOptimized) {
        score += 0.05;
        overrides.push("mobile_optimized");
      }
    }

    // Location-specific overrides
    if (context.location && item.businessSupply?.warehouseLocation) {
      // Boost local items (faster delivery)
      if (this.isLocalItem(item, context)) {
        score += 0.1;
        overrides.push("local_boost");
      }
    }

    // Language-specific overrides
    if (context.language && item.metadata?.language) {
      if (item.metadata.language === context.language) {
        score += 0.05;
        overrides.push("language_match");
      }
    }

    // Time-sensitive overrides
    const hour = new Date().getHours();
    if (this.isTimeRelevant(item, hour)) {
      score += 0.05;
      overrides.push("time_relevant");
    }

    return { score, overrides };
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  isNewItem(item) {
    // Determine if item is new (cold start)
    const socialSignals = item.socialProof || {};
    return (
      (socialSignals.totalReviews || 0) < 5 &&
      (socialSignals.totalPurchases || 0) < 10
    );
  }

  isViralItem(item) {
    // Determine if item is trending/viral
    const socialSignals = item.socialProof || {};
    const velocity = socialSignals.purchaseVelocity || 0;
    return velocity > 25; // 25+ purchases per day
  }

  isLocalItem(item, context) {
    // Simplified local item check
    const warehouseLocation =
      item.businessSupply?.warehouseLocation || "unknown";
    const userLocation = context.location || "unknown";
    return (
      warehouseLocation === userLocation ||
      warehouseLocation.includes(userLocation.split("_")[0])
    );
  }

  isTimeRelevant(item, hour) {
    // Check if item is relevant for current time
    // This could be enhanced with learned time patterns
    const category = item.metadata?.category?.toLowerCase() || "";

    if (hour >= 6 && hour <= 9) {
      // Morning
      return category.includes("coffee") || category.includes("breakfast");
    } else if (hour >= 12 && hour <= 14) {
      // Lunch
      return category.includes("food") || category.includes("lunch");
    } else if (hour >= 18 && hour <= 22) {
      // Evening
      return category.includes("dinner") || category.includes("entertainment");
    }

    return false;
  }

  // ============================================================================
  // WEIGHT CONFIGURATION MANAGEMENT
  // ============================================================================

  async getWeightsConfiguration(configName, context) {
    try {
      // Check cache first
      const cacheKey = `weights_${configName}`;
      const cached = this.weightsCache.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.data;
      }

      // Fetch active configuration from database
      const response = await this.databases.listDocuments(
        this.databaseId,
        env.RECOMMENDATION_WEIGHTS_COLLECTION_ID || "recommendation_weights",
        [
          Query.equal("configName", configName),
          Query.equal("isActive", true),
          Query.orderDesc("version"),
        ]
      );

      let weights;
      if (response.documents.length > 0) {
        const config = response.documents[0];
        weights = {
          intent: config.intentWeight,
          itemQuality: config.itemQualityWeight,
          context: config.contextWeight,
          trust: config.trustWeight,
          business: config.businessWeight,
          riskPenalty: config.riskPenaltyWeight,
        };
      } else {
        // Use default weights if no configuration found
        weights = { ...this.DEFAULT_WEIGHTS };
        console.warn(
          `No weight configuration found for '${configName}', using defaults`
        );
      }

      // Cache the configuration
      this.weightsCache.set(cacheKey, {
        data: weights,
        timestamp: Date.now(),
      });

      return weights;
    } catch (error) {
      console.error("Error getting weights configuration:", error);
      return { ...this.DEFAULT_WEIGHTS };
    }
  }

  adjustWeightsForContext(baseWeights, context) {
    const adjustedWeights = { ...baseWeights };

    try {
      // Apply device-type adjustments
      if (
        context.deviceType &&
        this.CONTEXT_ADJUSTMENTS[context.deviceType.toUpperCase()]
      ) {
        const adjustments =
          this.CONTEXT_ADJUSTMENTS[context.deviceType.toUpperCase()];
        for (const [tower, factor] of Object.entries(adjustments)) {
          if (adjustedWeights[tower] !== undefined) {
            adjustedWeights[tower] *= factor;
          }
        }
      }

      // Apply user-type adjustments
      const userType = this.determineUserType(context);
      if (this.CONTEXT_ADJUSTMENTS[userType]) {
        const adjustments = this.CONTEXT_ADJUSTMENTS[userType];
        for (const [tower, factor] of Object.entries(adjustments)) {
          if (adjustedWeights[tower] !== undefined) {
            adjustedWeights[tower] *= factor;
          }
        }
      }

      // Normalize weights to sum to 1.0 (excluding riskPenalty)
      const nonPenaltyWeights = [
        "intent",
        "itemQuality",
        "context",
        "trust",
        "business",
      ];
      const totalWeight = nonPenaltyWeights.reduce(
        (sum, key) => sum + adjustedWeights[key],
        0
      );

      if (totalWeight > 0) {
        nonPenaltyWeights.forEach((key) => {
          adjustedWeights[key] = adjustedWeights[key] / totalWeight;
        });
      }

      return adjustedWeights;
    } catch (error) {
      console.error("Error adjusting weights for context:", error);
      return baseWeights;
    }
  }

  determineUserType(context) {
    // Determine user type based on context
    if (context.isNewUser) return "NEW_USER";
    if (context.isPremium) return "PREMIUM_USER";
    if (context.sessionCount > 10) return "RETURNING_USER";
    return "RETURNING_USER"; // Default
  }

  // ============================================================================
  // RANKING AND NORMALIZATION
  // ============================================================================

  normalizeAndRank(items, context) {
    try {
      // 1. Filter out items with zero scores (suppressed items)
      const validItems = items.filter((item) => item.finalScore > 0);

      // 2. Apply diversity constraints
      const diversifiedItems = this.applyDiversity(validItems, context);

      // 3. Sort by final score (descending)
      const rankedItems = diversifiedItems.sort(
        (a, b) => b.finalScore - a.finalScore
      );

      // 4. Add ranking metadata
      return rankedItems.map((item, index) => ({
        ...item,
        rank: index + 1,
        rankingMeta: {
          totalItems: rankedItems.length,
          scorePercentile: (rankedItems.length - index) / rankedItems.length,
          diversityApplied: item.diversityAdjustment || false,
        },
      }));
    } catch (error) {
      console.error("Error normalizing and ranking items:", error);
      return items.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    }
  }

  applyDiversity(items, context) {
    // Apply diversity constraints to prevent over-representation
    // This is a simplified implementation

    try {
      const categoryCount = new Map();
      const brandCount = new Map();
      const maxCategoryRepresentation = Math.max(
        3,
        Math.floor(items.length * 0.3)
      );
      const maxBrandRepresentation = Math.max(
        2,
        Math.floor(items.length * 0.2)
      );

      return items.map((item) => {
        const category = item.metadata?.category || "unknown";
        const brand = item.metadata?.brand || "unknown";

        let diversityPenalty = 0;

        // Apply category diversity
        const catCount = categoryCount.get(category) || 0;
        if (catCount >= maxCategoryRepresentation) {
          diversityPenalty += 0.1;
        }
        categoryCount.set(category, catCount + 1);

        // Apply brand diversity
        const brandCnt = brandCount.get(brand) || 0;
        if (brandCnt >= maxBrandRepresentation) {
          diversityPenalty += 0.05;
        }
        brandCount.set(brand, brandCnt + 1);

        if (diversityPenalty > 0) {
          return {
            ...item,
            finalScore: Math.max(0.1, item.finalScore - diversityPenalty),
            diversityAdjustment: true,
            diversityPenalty: diversityPenalty,
          };
        }

        return item;
      });
    } catch (error) {
      console.error("Error applying diversity:", error);
      return items;
    }
  }

  // ============================================================================
  // LOGGING AND ANALYTICS
  // ============================================================================

  async logFusionDecision(topItems, context, weights) {
    try {
      // Check if logging is enabled and collection exists
      if (!this.SYSTEM_CONFIG || !this.SYSTEM_CONFIG.ENABLE_FUSION_LOGGING) {
        return; // Skip logging if disabled
      }

      const requestId = context.requestId || `fusion_${Date.now()}`;

      // Log the fusion decision for learning and debugging
      await this.databases.createDocument(
        this.databaseId,
        env.RECOMMENDATION_WEIGHTS_COLLECTION_ID || "recommendation_weights",
        ID.unique(),
        {
          requestId: requestId,
          userId: context.userId || "anonymous",
          sessionId: context.sessionId || "unknown",

          // Request context
          requestType: context.requestType || "unknown",
          location: context.location || null,
          deviceType: context.deviceType || "unknown",
          timestamp: new Date().toISOString(),

          // Tower outputs (aggregated)
          intentScore:
            topItems.length > 0
              ? topItems.reduce(
                  (sum, item) => sum + (item.towerScores?.intent || 0),
                  0
                ) / topItems.length
              : 0,
          itemScores: JSON.stringify(
            topItems.slice(0, 10).map((item) => ({
              itemId: item.itemId,
              score: item.finalScore,
              towers: item.towerScores,
            }))
          ),
          contextMultiplier:
            topItems.length > 0
              ? topItems.reduce(
                  (sum, item) => sum + (item.towerScores?.context || 1),
                  0
                ) / topItems.length
              : 1,
          trustScores: JSON.stringify(
            topItems.slice(0, 10).map((item) => item.towerScores?.trust || 0.5)
          ),
          businessBoosts: JSON.stringify(
            topItems
              .slice(0, 10)
              .map((item) => item.towerScores?.business || 1.0)
          ),

          // Final recommendations
          recommendedItems: JSON.stringify(
            topItems.slice(0, 20).map((item) => item.itemId)
          ),
          finalScores: JSON.stringify(
            topItems.slice(0, 20).map((item) => item.finalScore)
          ),

          // Config used
          weightsVersion: weights.version || "default",
          explorationApplied: false, // Will be set by exploration layer

          // Performance metrics
          processingTimeMs: Date.now() - (context.startTime || Date.now()),
          towerLatencies: JSON.stringify(context.towerLatencies || {}),

          isActive: true,
        }
      );
    } catch (error) {
      console.error("Error logging fusion decision:", error);
      // Don't throw - logging should not break the flow
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  // ============================================================================
  // A/B TESTING SUPPORT
  // ============================================================================

  async selectWeightConfigForUser(userId, deviceType) {
    try {
      // Get all active A/B test configurations
      const response = await this.databases.listDocuments(
        this.databaseId,
        env.RECOMMENDATION_WEIGHTS_COLLECTION_ID || "recommendation_weights",
        [Query.equal("isActive", true), Query.greaterThan("trafficPercent", 0)]
      );

      if (response.documents.length === 0) {
        return "default";
      }

      // Simple hash-based assignment
      const userHash = this.simpleHash(userId + deviceType) % 100;
      let cumulative = 0;

      for (const config of response.documents) {
        cumulative += config.trafficPercent;
        if (userHash < cumulative) {
          return config.configName;
        }
      }

      return "default";
    } catch (error) {
      console.error("Error selecting weight config:", error);
      return "default";
    }
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

  // ============================================================================
  // DIAGNOSTICS AND DEBUGGING
  // ============================================================================

  async diagnoseFusionIssues(items, context) {
    const diagnostics = {
      towerCoverage: this.analyzeTowerCoverage(items),
      scoreDistribution: this.analyzeScoreDistribution(items),
      overridesApplied: this.analyzeOverrides(items),
      potentialIssues: [],
      recommendations: [],
    };

    // Identify potential issues
    if (diagnostics.towerCoverage.missingTowers.length > 0) {
      diagnostics.potentialIssues.push({
        type: "missing_tower_data",
        towers: diagnostics.towerCoverage.missingTowers,
        impact: "reduced_accuracy",
      });
      diagnostics.recommendations.push(
        "Ensure all towers are providing data for items"
      );
    }

    if (diagnostics.scoreDistribution.zeroScores > items.length * 0.5) {
      diagnostics.potentialIssues.push({
        type: "excessive_suppression",
        suppressedPercent:
          (diagnostics.scoreDistribution.zeroScores / items.length) * 100,
        impact: "limited_recommendations",
      });
      diagnostics.recommendations.push(
        "Review rule overrides and trust thresholds"
      );
    }

    return diagnostics;
  }

  analyzeTowerCoverage(items) {
    const towers = ["intent", "itemQuality", "context", "trust", "business"];
    const coverage = {};
    const missingTowers = [];

    for (const tower of towers) {
      const itemsWithTower = items.filter(
        (item) => item.towerScores && item.towerScores[tower] !== undefined
      ).length;

      coverage[tower] = {
        count: itemsWithTower,
        percentage:
          items.length > 0 ? (itemsWithTower / items.length) * 100 : 0,
      };

      if (coverage[tower].percentage < 50) {
        missingTowers.push(tower);
      }
    }

    return { coverage, missingTowers };
  }

  analyzeScoreDistribution(items) {
    const scores = items.map((item) => item.finalScore || 0);
    const zeroScores = scores.filter((s) => s === 0).length;
    const highScores = scores.filter((s) => s >= 0.7).length;
    const lowScores = scores.filter((s) => s > 0 && s <= 0.3).length;

    return {
      total: items.length,
      zeroScores: zeroScores,
      highScores: highScores,
      lowScores: lowScores,
      average:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
      median: this.calculateMedian(scores),
    };
  }

  analyzeOverrides(items) {
    const overrides = {};

    for (const item of items) {
      if (item.overridesApplied) {
        for (const override of item.overridesApplied) {
          overrides[override] = (overrides[override] || 0) + 1;
        }
      }
    }

    return overrides;
  }

  calculateMedian(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }
}

module.exports = FusionLayer;
