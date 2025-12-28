const { Client, Databases, Query } = require("node-appwrite");
const { db } = require("../../src/appwrite");
const { env } = require("../../src/env");

/**
 * Social Proof & Trust Tower - Captures what others believe
 *
 * This tower learns social signals and trust indicators through:
 * - Reviews and ratings analysis
 * - Purchase velocity and social momentum
 * - Seller trust and reputation scoring
 * - Fraud detection and risk assessment
 * - Return/refund patterns
 * - Social proof signals (recent purchases, popularity)
 *
 * Output: Trust score + Risk penalty vector
 * Key Properties: Fraud detection, reputation modeling, social proof
 */

class SocialProofTrustTower {
  constructor(appwriteClient = null, databaseId = null) {
    this.client = appwriteClient;
    this.databases = appwriteClient
      ? new Databases(appwriteClient)
      : new Databases(new Client());
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;

    // Helper function to log collection operations
    this.logCollectionWrite = (
      operation,
      collectionName,
      itemId,
      collectionId
    ) => {
      // console.log(
      //   `✅ SocialProof: ${operation} ${
      //     itemId || "item"
      //   } in ${collectionName} collection (${collectionId || "N/A"})`
      // );
    };

    // Configuration
    this.TRUST_SCORE_RANGE = [0.0, 1.0];
    this.RISK_PENALTY_MAX = 0.5; // Maximum penalty

    // Trust scoring weights
    this.TRUST_WEIGHTS = {
      REVIEWS: 0.35, // Review quality and quantity
      PURCHASE_VELOCITY: 0.25, // Recent purchase momentum
      SELLER_REPUTATION: 0.2, // Seller trust score
      RETURN_RATE: -0.15, // Returns hurt trust (negative weight)
      FRAUD_FLAGS: -0.25, // Fraud signals (negative weight)
    };

    // Review quality thresholds
    this.REVIEW_THRESHOLDS = {
      EXCELLENT: { rating: 4.5, minReviews: 50 },
      GOOD: { rating: 4.0, minReviews: 10 },
      AVERAGE: { rating: 3.5, minReviews: 5 },
      POOR: { rating: 3.0, minReviews: 1 },
    };

    // Purchase velocity thresholds (purchases per day)
    this.VELOCITY_THRESHOLDS = {
      VIRAL: 100, // Viral/trending items
      HOT: 25, // Hot items
      POPULAR: 5, // Popular items
      STEADY: 1, // Steady sales
      SLOW: 0.1, // Slow movers
    };

    // Fraud detection patterns
    this.FRAUD_INDICATORS = {
      SUSPICIOUS_REVIEWS: "suspicious_review_pattern",
      FAKE_SELLER: "fake_seller_indicators",
      RETURN_ABUSE: "excessive_returns",
      PRICE_MANIPULATION: "price_manipulation",
      INVENTORY_GAMING: "fake_scarcity",
    };

    // Cache for performance
    this.trustCache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
  }

  // ============================================================================
  // CORE TRUST COMPUTATION
  // ============================================================================

  /**
   * Compute trust score and risk penalty for an item
   * @param {string} itemId - Item identifier
   * @param {Object} socialData - Social data (optional, for batch processing)
   * @returns {Object} { trustScore: Number, riskPenalty: Number, socialProof: Object }
   */
  async computeTrustAndRisk(itemId, socialData = null) {
    try {
      // Check cache first
      const cacheKey = `trust_${itemId}`;
      const cached = this.trustCache.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.data;
      }

      // 1. Get social signals data
      const social = socialData || (await this.getSocialSignalsData(itemId));
      if (!social) {
        return this.getFallbackTrust(itemId);
      }

      // 2. Analyze review quality and patterns
      const reviewAnalysis = this.analyzeReviews(social);

      // 3. Compute purchase velocity score
      const velocityScore = this.computeVelocityScore(social);

      // 4. Assess seller trust
      const sellerTrust = this.assessSellerTrust(social);

      // 5. Detect fraud indicators
      const fraudAssessment = this.detectFraudIndicators(social);

      // 6. Compute final trust score
      const trustScore = this.computeFinalTrustScore({
        reviews: reviewAnalysis,
        velocity: velocityScore,
        seller: sellerTrust,
        fraud: fraudAssessment,
      });

      // 7. Compute risk penalty
      const riskPenalty = this.computeRiskPenalty(fraudAssessment, social);

      // 8. Generate social proof signals
      const socialProof = this.generateSocialProof(
        social,
        velocityScore,
        reviewAnalysis
      );

      // 9. Update social signals with computed scores
      await this.updateSocialSignals(
        itemId,
        trustScore,
        riskPenalty,
        socialProof
      );

      const result = {
        trustScore: trustScore,
        riskPenalty: riskPenalty,
        socialProof: socialProof,
        analysis: {
          reviews: reviewAnalysis,
          velocity: velocityScore,
          seller: sellerTrust,
          fraud: fraudAssessment,
        },
        collectionTracking: {
          socialSignalsConnected: !!env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID,
          itemId: itemId,
          dataUpdated: true,
        },
      };

      // Cache result
      this.trustCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error computing trust for item ${itemId}:`, error);
      return this.getFallbackTrust(itemId);
    }
  }

  /**
   * Batch compute trust scores (more efficient)
   * @param {Array} itemIds - Array of item IDs
   * @returns {Map} Map of itemId -> trust data
   */
  async computeBatchTrust(itemIds) {
    const results = new Map();

    try {
      // Get all social data in batches
      const socialDataMap = await this.getBatchSocialData(itemIds);

      // Process each item
      for (const itemId of itemIds) {
        const socialData = socialDataMap.get(itemId);
        const trustData = await this.computeTrustAndRisk(itemId, socialData);
        results.set(itemId, trustData);
      }

      return results;
    } catch (error) {
      console.error("Error in batch trust computation:", error);

      // Return fallback for all items
      for (const itemId of itemIds) {
        results.set(itemId, this.getFallbackTrust(itemId));
      }

      return results;
    }
  }

  // ============================================================================
  // DATA RETRIEVAL
  // ============================================================================

  async getSocialSignalsData(itemId) {
    try {
      let socialData = {
        itemId: itemId,
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        totalPurchases: 0,
        purchaseVelocity: 0,
        recentPurchases24h: 0,
        recentPurchases7d: 0,
        returnRate: 0,
        refundRate: 0,
        fraudFlags: 0,
        sellerTrustScore: 0.8,
        sellerResponseTime: 24,
        sellerRating: 0,
        trustScore: 0.5,
        riskPenalty: 0,
        socialProofBoost: 1.0,
        lastUpdated: new Date(),
      };

      // Get product data first
      if (env.APPWRITE_PRODUCT_COLLECTION_ID) {
        try {
          const product = await this.databases.getDocument(
            this.databaseId,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            itemId
          );

          socialData.averageRating = product.rating || 0;
          socialData.totalReviews = product.ratingsCount || 0;
          socialData.sellerRating = product.sellerRating || 0.8;

          // Mock rating distribution based on average rating
          if (socialData.totalReviews > 0) {
            socialData.ratingDistribution = this.generateRatingDistribution(
              socialData.averageRating,
              socialData.totalReviews
            );
          }

          // console.log(
          //   `⭐ SocialProof: Product ${itemId} - Rating: ${socialData.averageRating}, Reviews: ${socialData.totalReviews}`
          // );
        } catch (error) {
          console.warn(
            `Could not fetch product data for social signals: ${error.message}`
          );
        }
      }

      // Get purchase data from orders collection
      if (env.APPWRITE_ORDERS_COLLECTION) {
        try {
          // Try different possible product ID field names
          let ordersResponse;
          const possibleFields = [
            "productId",
            "product_id",
            "itemId",
            "item_id",
          ];

          for (const fieldName of possibleFields) {
            try {
              ordersResponse = await this.databases.listDocuments(
                this.databaseId,
                env.APPWRITE_ORDERS_COLLECTION,
                [
                  Query.equal(fieldName, itemId),
                  Query.orderDesc("$createdAt"),
                  Query.limit(500),
                ]
              );
              break; // Success, exit the loop
            } catch (fieldError) {
              if (fieldError.message.includes("Attribute not found")) {
                continue; // Try next field name
              } else {
                throw fieldError; // Other error, propagate it
              }
            }
          }

          if (ordersResponse) {
            socialData.totalPurchases =
              ordersResponse.total || ordersResponse.documents.length;

            // Calculate recent purchases
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            );

            socialData.recentPurchases24h = ordersResponse.documents.filter(
              (order) => new Date(order.$createdAt) > oneDayAgo
            ).length;

            socialData.recentPurchases7d = ordersResponse.documents.filter(
              (order) => new Date(order.$createdAt) > sevenDaysAgo
            ).length;

            // Calculate purchase velocity (purchases per day)
            if (
              socialData.totalPurchases > 0 &&
              ordersResponse.documents.length > 0
            ) {
              const firstOrderDate = new Date(
                ordersResponse.documents[
                  ordersResponse.documents.length - 1
                ].$createdAt
              );
              const daysSinceFirstOrder = Math.max(
                1,
                (now.getTime() - firstOrderDate.getTime()) /
                  (24 * 60 * 60 * 1000)
              );
              socialData.purchaseVelocity =
                socialData.totalPurchases / daysSinceFirstOrder;
            }

            // console.log(
            //   `🛍️ SocialProof: Product ${itemId} - ${
            //     socialData.totalPurchases
            //   } total purchases, velocity: ${socialData.purchaseVelocity.toFixed(
            //     2
            //   )}`
            // );
          }
        } catch (error) {
          console.warn(
            `Could not fetch order data for social signals: ${error.message}`
          );
        }
      }

      return socialData;
    } catch (error) {
      console.error(`Error retrieving social data for ${itemId}:`, error);
      return this.getFallbackSocialData(itemId);
    }
  }

  generateRatingDistribution(averageRating, totalReviews) {
    // Generate realistic rating distribution based on average rating
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (averageRating >= 4.5) {
      // Mostly 5 and 4 stars
      distribution[5] = Math.floor(totalReviews * 0.7);
      distribution[4] = Math.floor(totalReviews * 0.25);
      distribution[3] = Math.floor(totalReviews * 0.04);
      distribution[2] = Math.floor(totalReviews * 0.01);
      distribution[1] =
        totalReviews -
        distribution[5] -
        distribution[4] -
        distribution[3] -
        distribution[2];
    } else if (averageRating >= 4.0) {
      // Mostly 4 and 5 stars
      distribution[5] = Math.floor(totalReviews * 0.5);
      distribution[4] = Math.floor(totalReviews * 0.35);
      distribution[3] = Math.floor(totalReviews * 0.1);
      distribution[2] = Math.floor(totalReviews * 0.03);
      distribution[1] =
        totalReviews -
        distribution[5] -
        distribution[4] -
        distribution[3] -
        distribution[2];
    } else {
      // More mixed ratings
      distribution[5] = Math.floor(totalReviews * 0.3);
      distribution[4] = Math.floor(totalReviews * 0.3);
      distribution[3] = Math.floor(totalReviews * 0.25);
      distribution[2] = Math.floor(totalReviews * 0.1);
      distribution[1] =
        totalReviews -
        distribution[5] -
        distribution[4] -
        distribution[3] -
        distribution[2];
    }

    return distribution;
  }

  getFallbackSocialData(itemId) {
    return {
      itemId: itemId,
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalPurchases: 0,
      purchaseVelocity: 0,
      recentPurchases24h: 0,
      recentPurchases7d: 0,
      returnRate: 0,
      refundRate: 0,
      fraudFlags: 0,
      sellerTrustScore: 0.5,
      sellerResponseTime: 24,
      sellerRating: 0,
      trustScore: 0.5,
      riskPenalty: 0,
      socialProofBoost: 1.0,
      lastUpdated: new Date(),
    };
  }

  async getBatchSocialData(itemIds) {
    const results = new Map();

    try {
      // Query in batches of 100 (Appwrite limit)
      const batchSize = 100;
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);

        const response = await this.databases.listDocuments(
          this.databaseId,
          env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
          [Query.equal("itemId", batch), Query.equal("isActive", true)]
        );

        for (const doc of response.documents) {
          results.set(doc.itemId, {
            itemId: doc.itemId,
            totalReviews: doc.totalReviews || 0,
            averageRating: doc.averageRating || 0,
            ratingDistribution: {
              5: doc.rating5Star || 0,
              4: doc.rating4Star || 0,
              3: doc.rating3Star || 0,
              2: doc.rating2Star || 0,
              1: doc.rating1Star || 0,
            },
            totalPurchases: doc.totalPurchases || 0,
            purchaseVelocity: doc.purchaseVelocity || 0,
            recentPurchases24h: doc.recentPurchases24h || 0,
            recentPurchases7d: doc.recentPurchases7d || 0,
            returnRate: doc.returnRate || 0,
            refundRate: doc.refundRate || 0,
            fraudFlags: doc.fraudFlags || 0,
            sellerTrustScore: doc.sellerTrustScore || 0.5,
            sellerResponseTime: doc.sellerResponseTime || 24,
            sellerRating: doc.sellerRating || 0,
            lastUpdated: new Date(doc.lastUpdated),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error retrieving batch social data:", error);
      return results;
    }
  }

  // ============================================================================
  // REVIEW ANALYSIS
  // ============================================================================

  analyzeReviews(social) {
    const analysis = {
      quality: "unknown",
      credibility: 0.5,
      sentiment: "neutral",
      volume: "low",
      recentTrend: "stable",
      flags: [],
      score: 0.5,
    };

    try {
      const { totalReviews, averageRating, ratingDistribution } = social;

      // 1. Determine review quality tier
      analysis.quality = this.getReviewQuality(averageRating, totalReviews);

      // 2. Assess review credibility
      analysis.credibility = this.assessReviewCredibility(
        ratingDistribution,
        totalReviews
      );

      // 3. Determine sentiment
      analysis.sentiment = this.determineSentiment(averageRating);

      // 4. Categorize review volume
      analysis.volume = this.categorizeVolume(totalReviews);

      // 5. Detect suspicious patterns
      analysis.flags = this.detectSuspiciousReviews(
        ratingDistribution,
        totalReviews
      );

      // 6. Compute final review score
      analysis.score = this.computeReviewScore(analysis);

      return analysis;
    } catch (error) {
      console.error("Error analyzing reviews:", error);
      return analysis;
    }
  }

  getReviewQuality(averageRating, totalReviews) {
    if (
      averageRating >= this.REVIEW_THRESHOLDS.EXCELLENT.rating &&
      totalReviews >= this.REVIEW_THRESHOLDS.EXCELLENT.minReviews
    ) {
      return "excellent";
    } else if (
      averageRating >= this.REVIEW_THRESHOLDS.GOOD.rating &&
      totalReviews >= this.REVIEW_THRESHOLDS.GOOD.minReviews
    ) {
      return "good";
    } else if (
      averageRating >= this.REVIEW_THRESHOLDS.AVERAGE.rating &&
      totalReviews >= this.REVIEW_THRESHOLDS.AVERAGE.minReviews
    ) {
      return "average";
    } else if (totalReviews >= this.REVIEW_THRESHOLDS.POOR.minReviews) {
      return "poor";
    }
    return "insufficient";
  }

  assessReviewCredibility(ratingDistribution, totalReviews) {
    try {
      if (totalReviews === 0 || !ratingDistribution) return 0.5;

      // Ensure rating distribution has all needed keys
      const safeDistribution = {
        1: ratingDistribution[1] || 0,
        2: ratingDistribution[2] || 0,
        3: ratingDistribution[3] || 0,
        4: ratingDistribution[4] || 0,
        5: ratingDistribution[5] || 0,
      };

      // Natural review distributions have certain patterns
      const fiveStar = safeDistribution[5] / totalReviews;
      const oneStar = safeDistribution[1] / totalReviews;

      // Red flags for fake reviews:
      let credibility = 1.0;

      // Too many 5-star reviews (>80%)
      if (fiveStar > 0.8 && totalReviews > 10) credibility -= 0.3;

      // Extreme polarization (mostly 1s and 5s)
      const extremes = fiveStar + oneStar;
      if (extremes > 0.8 && totalReviews > 10) credibility -= 0.2;

      // Too few middle ratings (suspicious uniformity)
      const middles =
        (ratingDistribution[2] +
          ratingDistribution[3] +
          ratingDistribution[4]) /
        totalReviews;
      if (middles < 0.1 && totalReviews > 20) credibility -= 0.2;

      return Math.max(0.1, Math.min(1.0, credibility));
    } catch (error) {
      console.error("Error assessing review credibility:", error);
      return 0.5; // Return neutral credibility on error
    }
  }

  determineSentiment(averageRating) {
    if (averageRating >= 4.0) return "positive";
    if (averageRating >= 3.0) return "neutral";
    return "negative";
  }

  categorizeVolume(totalReviews) {
    if (totalReviews >= 100) return "high";
    if (totalReviews >= 20) return "medium";
    if (totalReviews >= 5) return "low";
    return "very_low";
  }

  detectSuspiciousReviews(ratingDistribution, totalReviews) {
    const flags = [];

    if (totalReviews === 0 || !ratingDistribution) return flags;

    // Ensure rating distribution has all needed keys
    const safeDistribution = {
      1: ratingDistribution[1] || 0,
      2: ratingDistribution[2] || 0,
      3: ratingDistribution[3] || 0,
      4: ratingDistribution[4] || 0,
      5: ratingDistribution[5] || 0,
    };

    const fiveStar = safeDistribution[5] / totalReviews;
    const oneStar = safeDistribution[1] / totalReviews;

    // Suspicious patterns
    if (fiveStar > 0.9 && totalReviews > 10) {
      flags.push("too_many_perfect_ratings");
    }

    if (oneStar > 0.7 && totalReviews > 5) {
      flags.push("review_bombing");
    }

    const extremes = fiveStar + oneStar;
    if (extremes > 0.85 && totalReviews > 15) {
      flags.push("extreme_polarization");
    }

    return flags;
  }

  computeReviewScore(analysis) {
    let score = 0.5; // Base score

    // Quality bonus
    switch (analysis.quality) {
      case "excellent":
        score += 0.3;
        break;
      case "good":
        score += 0.2;
        break;
      case "average":
        score += 0.1;
        break;
      case "poor":
        score -= 0.1;
        break;
      case "insufficient":
        score -= 0.2;
        break;
    }

    // Credibility impact
    score = score * analysis.credibility;

    // Sentiment impact
    switch (analysis.sentiment) {
      case "positive":
        score += 0.1;
        break;
      case "negative":
        score -= 0.2;
        break;
    }

    // Penalty for flags
    score -= analysis.flags.length * 0.1;

    return Math.max(0.0, Math.min(1.0, score));
  }

  // ============================================================================
  // PURCHASE VELOCITY ANALYSIS
  // ============================================================================

  computeVelocityScore(social) {
    const velocity = social.purchaseVelocity || 0;
    const recent24h = social.recentPurchases24h || 0;
    const recent7d = social.recentPurchases7d || 0;

    const analysis = {
      tier: "slow",
      momentum: "stable",
      acceleration: 0,
      socialProofLevel: "low",
      score: 0.3,
    };

    try {
      // 1. Categorize velocity tier
      if (velocity >= this.VELOCITY_THRESHOLDS.VIRAL) {
        analysis.tier = "viral";
        analysis.score = 1.0;
        analysis.socialProofLevel = "viral";
      } else if (velocity >= this.VELOCITY_THRESHOLDS.HOT) {
        analysis.tier = "hot";
        analysis.score = 0.9;
        analysis.socialProofLevel = "high";
      } else if (velocity >= this.VELOCITY_THRESHOLDS.POPULAR) {
        analysis.tier = "popular";
        analysis.score = 0.7;
        analysis.socialProofLevel = "medium";
      } else if (velocity >= this.VELOCITY_THRESHOLDS.STEADY) {
        analysis.tier = "steady";
        analysis.score = 0.5;
        analysis.socialProofLevel = "low";
      } else {
        analysis.tier = "slow";
        analysis.score = 0.3;
        analysis.socialProofLevel = "very_low";
      }

      // 2. Analyze momentum (recent trend)
      const expected7d = velocity * 7;
      if (expected7d > 0) {
        const momentum = recent7d / expected7d;
        if (momentum > 1.2) {
          analysis.momentum = "accelerating";
          analysis.acceleration = momentum - 1;
          analysis.score *= 1.1; // Bonus for acceleration
        } else if (momentum < 0.8) {
          analysis.momentum = "decelerating";
          analysis.acceleration = momentum - 1;
          analysis.score *= 0.9; // Penalty for deceleration
        }
      }

      // 3. Recent activity boost
      if (recent24h > 0) {
        const recentBoost = Math.min(0.2, (recent24h / 10) * 0.1); // Up to 20% boost
        analysis.score += recentBoost;
      }

      analysis.score = Math.max(0.0, Math.min(1.0, analysis.score));

      return analysis;
    } catch (error) {
      console.error("Error computing velocity score:", error);
      return analysis;
    }
  }

  // ============================================================================
  // SELLER TRUST ASSESSMENT
  // ============================================================================

  assessSellerTrust(social) {
    const analysis = {
      trustLevel: "unknown",
      reliability: "average",
      responsiveness: "slow",
      reputation: "new",
      score: 0.5,
      flags: [],
    };

    try {
      const sellerTrust = social.sellerTrustScore || 0.5;
      const sellerRating = social.sellerRating || 0;
      const responseTime = social.sellerResponseTime || 24;

      // 1. Categorize trust level
      if (sellerTrust >= 0.8) {
        analysis.trustLevel = "high";
        analysis.score = 0.9;
      } else if (sellerTrust >= 0.6) {
        analysis.trustLevel = "medium";
        analysis.score = 0.7;
      } else if (sellerTrust >= 0.4) {
        analysis.trustLevel = "low";
        analysis.score = 0.4;
      } else {
        analysis.trustLevel = "very_low";
        analysis.score = 0.2;
        analysis.flags.push("low_seller_trust");
      }

      // 2. Assess responsiveness
      if (responseTime <= 2) {
        analysis.responsiveness = "excellent";
        analysis.score += 0.1;
      } else if (responseTime <= 6) {
        analysis.responsiveness = "good";
      } else if (responseTime <= 24) {
        analysis.responsiveness = "average";
      } else {
        analysis.responsiveness = "poor";
        analysis.score -= 0.1;
      }

      // 3. Factor in seller rating
      if (sellerRating > 0) {
        if (sellerRating >= 4.5) {
          analysis.reputation = "excellent";
          analysis.score += 0.1;
        } else if (sellerRating >= 4.0) {
          analysis.reputation = "good";
        } else if (sellerRating < 3.0) {
          analysis.reputation = "poor";
          analysis.score -= 0.2;
          analysis.flags.push("poor_seller_rating");
        }
      }

      analysis.score = Math.max(0.0, Math.min(1.0, analysis.score));

      return analysis;
    } catch (error) {
      console.error("Error assessing seller trust:", error);
      return analysis;
    }
  }

  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================

  detectFraudIndicators(social) {
    const indicators = [];
    let riskLevel = "low";
    let riskScore = 0.0;

    try {
      // 1. Check return/refund abuse
      if (social.returnRate > 0.3 || social.refundRate > 0.2) {
        indicators.push(this.FRAUD_INDICATORS.RETURN_ABUSE);
        riskScore += 0.3;
      }

      // 2. Check for fake reviews (from review analysis)
      const reviewCredibility = this.assessReviewCredibility(
        social.ratingDistribution,
        social.totalReviews
      );
      if (reviewCredibility < 0.4) {
        indicators.push(this.FRAUD_INDICATORS.SUSPICIOUS_REVIEWS);
        riskScore += 0.4;
      }

      // 3. Check seller indicators
      if (social.sellerTrustScore < 0.3) {
        indicators.push(this.FRAUD_INDICATORS.FAKE_SELLER);
        riskScore += 0.3;
      }

      // 4. Check for unusual velocity patterns
      if (
        social.purchaseVelocity > this.VELOCITY_THRESHOLDS.VIRAL &&
        social.totalReviews < 10
      ) {
        indicators.push(this.FRAUD_INDICATORS.INVENTORY_GAMING);
        riskScore += 0.2;
      }

      // 5. Check explicit fraud flags
      if (social.fraudFlags > 0) {
        riskScore += social.fraudFlags * 0.1;
      }

      // Determine risk level
      if (riskScore >= 0.6) {
        riskLevel = "high";
      } else if (riskScore >= 0.3) {
        riskLevel = "medium";
      }

      return {
        indicators: indicators,
        riskLevel: riskLevel,
        riskScore: Math.min(1.0, riskScore),
        hasFraud: indicators.length > 0,
      };
    } catch (error) {
      console.error("Error detecting fraud indicators:", error);
      return {
        indicators: [],
        riskLevel: "unknown",
        riskScore: 0.5,
        hasFraud: false,
      };
    }
  }

  // ============================================================================
  // FINAL SCORE COMPUTATION
  // ============================================================================

  computeFinalTrustScore(analysis) {
    const { reviews, velocity, seller, fraud } = analysis;

    // Base weighted combination
    let trustScore =
      this.TRUST_WEIGHTS.REVIEWS * reviews.score +
      this.TRUST_WEIGHTS.PURCHASE_VELOCITY * velocity.score +
      this.TRUST_WEIGHTS.SELLER_REPUTATION * seller.score;

    // Apply fraud penalties (negative weights already in TRUST_WEIGHTS)
    trustScore += this.TRUST_WEIGHTS.FRAUD_FLAGS * fraud.riskScore;

    // Apply return rate penalty (if available)
    // This would use actual return rate from social data

    // Ensure score is within valid range
    return Math.max(
      this.TRUST_SCORE_RANGE[0],
      Math.min(this.TRUST_SCORE_RANGE[1], trustScore)
    );
  }

  computeRiskPenalty(fraudAssessment, social) {
    let penalty = 0.0;

    // Base risk penalty from fraud score
    penalty += fraudAssessment.riskScore * 0.3;

    // Additional penalties for specific issues
    if (social.returnRate > 0.2) penalty += 0.1;
    if (social.refundRate > 0.15) penalty += 0.1;
    if (social.sellerTrustScore < 0.3) penalty += 0.2;

    return Math.min(this.RISK_PENALTY_MAX, penalty);
  }

  generateSocialProof(social, velocity, reviews) {
    const proof = {
      level: "low",
      messages: [],
      badges: [],
      urgency: "none",
      trustIndicators: [],
    };

    try {
      // Purchase velocity proof
      if (velocity.tier === "viral") {
        proof.level = "viral";
        proof.messages.push(
          `${social.recentPurchases24h} people bought this today`
        );
        proof.badges.push("trending");
        proof.urgency = "high";
      } else if (velocity.tier === "hot") {
        proof.level = "high";
        proof.messages.push(`${social.recentPurchases7d} sold this week`);
        proof.badges.push("popular");
        proof.urgency = "medium";
      } else if (social.totalPurchases > 100) {
        proof.messages.push(`${social.totalPurchases}+ happy customers`);
      }

      // Review proof
      if (reviews.quality === "excellent") {
        proof.trustIndicators.push("highly_rated");
        proof.messages.push(
          `${social.averageRating}⭐ from ${social.totalReviews} reviews`
        );
      } else if (reviews.quality === "good") {
        proof.trustIndicators.push("well_reviewed");
      }

      // Seller trust proof
      if (social.sellerTrustScore >= 0.8) {
        proof.trustIndicators.push("trusted_seller");
        proof.badges.push("verified");
      }

      return proof;
    } catch (error) {
      console.error("Error generating social proof:", error);
      return proof;
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  getFallbackTrust(itemId) {
    return {
      trustScore: 0.5,
      riskPenalty: 0.0,
      socialProof: {
        level: "low",
        messages: [],
        badges: [],
        urgency: "none",
        trustIndicators: [],
      },
      error: true,
    };
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  async updateSocialSignals(itemId, trustScore, riskPenalty, socialProof) {
    try {
      const signals = await this.databases.listDocuments(
        this.databaseId,
        env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
        [Query.equal("itemId", itemId)]
      );

      if (signals.documents.length > 0) {
        await this.databases.updateDocument(
          this.databaseId,
          env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
          signals.documents[0].$id,
          {
            trustScore: trustScore,
            riskPenalty: riskPenalty,
            socialProofBoost:
              socialProof.level === "viral"
                ? 2.0
                : socialProof.level === "high"
                ? 1.5
                : 1.0,
            lastUpdated: new Date().toISOString(),
          }
        );
        // console.log(
        //   `✅ SocialProof: Updated signals for item ${itemId} in collection ${
        //     env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals"
        //   }`
        // );
      } else {
        // console.log(
        //   `ℹ️ SocialProof: No existing signals found for item ${itemId}, skipping update`
        // );
      }
    } catch (error) {
      console.error("Error updating social signals:", error);
      // Don't throw - this is not critical for the response
    }
  }

  // ============================================================================
  // BATCH PROCESSING & MAINTENANCE
  // ============================================================================

  async updateAllTrustScores(batchSize = 100) {
    // console.log("🔄 Starting batch update of all trust scores...");

    try {
      let offset = 0;
      let totalProcessed = 0;

      while (true) {
        // Get batch of items
        const response = await this.databases.listDocuments(
          this.databaseId,
          env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
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
        await this.computeBatchTrust(itemIds);

        totalProcessed += response.documents.length;
        offset += batchSize;

        // console.log(`✅ Processed ${totalProcessed} trust scores...`);

        // Small delay to not overwhelm the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // console.log(
      //   `🎉 Batch trust update complete! Processed ${totalProcessed} items.`
      // );
    } catch (error) {
      console.error("Error in batch trust update:", error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME TRUST UPDATES
  // ============================================================================

  async handleNewReview(itemId, rating, reviewData) {
    try {
      // Update social signals with new review
      const signals = await this.databases.listDocuments(
        this.databaseId,
        env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
        [Query.equal("itemId", itemId)]
      );

      if (signals.documents.length > 0) {
        const current = signals.documents[0];
        const totalReviews = (current.totalReviews || 0) + 1;
        const newAverage =
          ((current.averageRating || 0) * (totalReviews - 1) + rating) /
          totalReviews;

        // Update rating distribution
        const ratingField = `rating${rating}Star`;
        const updates = {
          totalReviews: totalReviews,
          averageRating: newAverage,
          [ratingField]: (current[ratingField] || 0) + 1,
          lastUpdated: new Date().toISOString(),
        };

        await this.databases.updateDocument(
          this.databaseId,
          env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
          current.$id,
          updates
        );

        // Recompute trust score
        await this.computeTrustAndRisk(itemId);
      }
    } catch (error) {
      console.error("Error handling new review:", error);
    }
  }

  async handleNewPurchase(itemId, purchaseData) {
    try {
      // Update purchase velocity and social signals
      const signals = await this.databases.listDocuments(
        this.databaseId,
        env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
        [Query.equal("itemId", itemId)]
      );

      if (signals.documents.length > 0) {
        const current = signals.documents[0];
        const updates = {
          totalPurchases: (current.totalPurchases || 0) + 1,
          recentPurchases24h: (current.recentPurchases24h || 0) + 1,
          recentPurchases7d: (current.recentPurchases7d || 0) + 1,
          lastUpdated: new Date().toISOString(),
        };

        // Recalculate velocity (this could be more sophisticated)
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        updates.purchaseVelocity = updates.recentPurchases24h; // Simplified

        await this.databases.updateDocument(
          this.databaseId,
          env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
          current.$id,
          updates
        );

        // Recompute trust score
        await this.computeTrustAndRisk(itemId);
      }
    } catch (error) {
      console.error("Error handling new purchase:", error);
    }
  }
}

module.exports = SocialProofTrustTower;
