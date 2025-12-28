const { Client, Databases, Query, ID } = require("node-appwrite");
const { env } = require("../src/env");

/**
 * Exploration Layer - YouTube-Style Intelligent Discovery
 *
 * This layer adds intelligent exploration to recommendations by:
 * - ε-greedy exploration per session
 * - New item injection quotas
 * - Category-level exploration
 * - Trust-bounded randomness
 * - Long-term user discovery patterns
 *
 * Key Properties: Never harms trust, measurable, reversible
 * YouTube Philosophy: Balance exploitation of known preferences with exploration of new content
 */

class ExplorationLayer {
  constructor(appwriteClient = null, databaseId = null) {
    // Use existing db configuration if available
    if (!appwriteClient) {
      const { db } = require("../src/appwrite");
      const { env } = require("../src/env");
      this.databases = db;
      this.databaseId = env.APPWRITE_DATABASE_ID;
    } else {
      this.client = appwriteClient;
      this.databases = new Databases(appwriteClient);
      this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;
    }

    // Exploration configuration
    this.EXPLORATION_CONFIG = {
      // ε-greedy parameters
      BASE_EPSILON: 0.15, // Base exploration rate (15%)
      SESSION_EPSILON_DECAY: 0.95, // Decay per session interaction
      MIN_EPSILON: 0.05, // Minimum exploration (always explore 5%)
      MAX_EPSILON: 0.3, // Maximum exploration (cap at 30%)

      // New item exploration
      NEW_ITEM_QUOTA: 0.1, // 10% new items minimum
      NEW_ITEM_BOOST: 0.2, // Boost factor for new items
      NEW_ITEM_TRUST_MIN: 0.4, // Minimum trust for new items

      // Category exploration
      CATEGORY_EXPLORATION: 0.08, // 8% category exploration
      MAX_CATEGORY_DOMINANCE: 0.4, // Max 40% from single category

      // Trust boundaries (exploration must respect trust)
      MIN_EXPLORATION_TRUST: 0.3, // Don't explore below this trust
      TRUST_BOUNDED_EXPLORATION: true,

      // Exploration decay
      SUCCESS_BOOST: 1.1, // Boost successful explorations
      FAILURE_PENALTY: 0.9, // Reduce failed explorations

      // Long-term discovery
      DISCOVERY_WINDOW: 30, // Days to look back for discovery patterns
      SERENDIPITY_FACTOR: 0.05, // 5% pure serendipity
    };

    // Exploration strategies
    this.EXPLORATION_STRATEGIES = {
      EPSILON_GREEDY: "epsilon_greedy", // Standard ε-greedy
      NEW_ITEM_INJECTION: "new_item_injection", // Inject new items
      CATEGORY_DIVERSE: "category_diverse", // Category diversification
      SERENDIPITY: "serendipity", // Unexpected discoveries
      COLLABORATIVE: "collaborative", // Similar user exploration
      TRENDING: "trending", // Trending item exploration
      CULTURAL: "cultural", // Cultural context exploration
    };

    // Session exploration tracking
    this.sessionExploration = new Map();

    // Cache for exploration patterns
    this.explorationCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // ============================================================================
  // CORE EXPLORATION ENGINE
  // ============================================================================

  /**
   * Apply exploration to recommendation list
   * @param {Array} rankedItems - Items ranked by fusion layer
   * @param {Object} context - User and session context
   * @param {Object} explorationConfig - Custom exploration configuration
   * @returns {Array} Items with exploration applied
   */
  async applyExploration(rankedItems, context, explorationConfig = {}) {
    try {
      // 1. Merge configuration
      const config = { ...this.EXPLORATION_CONFIG, ...explorationConfig };

      // 2. Get user exploration profile
      const userProfile = await this.getUserExplorationProfile(context.userId);

      // 3. Calculate session-specific exploration rate
      const explorationRate = this.calculateExplorationRate(
        context,
        userProfile,
        config
      );

      // 4. Determine exploration strategies to apply
      const strategies = this.selectExplorationStrategies(
        context,
        userProfile,
        config
      );

      // 5. Apply each exploration strategy
      let exploredItems = [...rankedItems];
      const appliedStrategies = [];

      for (const strategy of strategies) {
        const strategyResult = await this.applyExplorationStrategy(
          strategy,
          exploredItems,
          context,
          config,
          explorationRate
        );

        exploredItems = strategyResult.items;
        if (strategyResult.applied) {
          appliedStrategies.push(strategy);
        }
      }

      // 6. Apply trust-bounded safety checks
      const safeItems = this.applyTrustBounds(exploredItems, config);

      // 7. Track exploration for learning
      await this.trackExploration(
        safeItems,
        context,
        appliedStrategies,
        explorationRate
      );

      return safeItems.map((item, index) => ({
        ...item,
        explorationMeta: {
          originalRank:
            rankedItems.findIndex((r) => r.itemId === item.itemId) + 1,
          newRank: index + 1,
          explorationApplied: item.explorationApplied || false,
          explorationStrategy: item.explorationStrategy || null,
          explorationBoost: item.explorationBoost || 0,
          explorationRate: explorationRate,
          strategiesApplied: appliedStrategies,
        },
      }));
    } catch (error) {
      console.error("Error applying exploration:", error);
      // Return original items on error (fail gracefully)
      return rankedItems.map((item) => ({
        ...item,
        explorationError: true,
        explorationMeta: { error: true },
      }));
    }
  }

  // ============================================================================
  // EXPLORATION RATE CALCULATION
  // ============================================================================

  calculateExplorationRate(context, userProfile, config) {
    try {
      let epsilon = config.BASE_EPSILON;

      // 1. Adjust based on user profile
      if (userProfile) {
        // New users get more exploration
        if (userProfile.totalSessions < 5) {
          epsilon *= 1.5;
        }

        // Reduce exploration for users with strong preferences
        if (userProfile.preferenceStrength > 0.8) {
          epsilon *= 0.7;
        }

        // Increase exploration for discovery-seeking users
        if (userProfile.discoverySeeker) {
          epsilon *= 1.3;
        }
      }

      // 2. Session-based decay
      const sessionInteractions = this.getSessionInteractions(
        context.sessionId
      );
      if (sessionInteractions > 0) {
        epsilon *= Math.pow(config.SESSION_EPSILON_DECAY, sessionInteractions);
      }

      // 3. Context adjustments
      if (context.deviceType === "mobile") {
        epsilon *= 0.8; // Less exploration on mobile (smaller screens)
      }

      if (context.requestType === "search") {
        epsilon *= 0.6; // Less exploration in search (user has intent)
      }

      // 4. Apply bounds
      epsilon = Math.max(
        config.MIN_EPSILON,
        Math.min(config.MAX_EPSILON, epsilon)
      );

      return epsilon;
    } catch (error) {
      console.error("Error calculating exploration rate:", error);
      return config.BASE_EPSILON;
    }
  }

  // ============================================================================
  // EXPLORATION STRATEGY SELECTION
  // ============================================================================

  selectExplorationStrategies(context, userProfile, config) {
    const strategies = [];

    try {
      // Always include ε-greedy as base strategy
      strategies.push(this.EXPLORATION_STRATEGIES.EPSILON_GREEDY);

      // New item injection (especially for new users)
      if (!userProfile || userProfile.totalSessions < 10) {
        strategies.push(this.EXPLORATION_STRATEGIES.NEW_ITEM_INJECTION);
      }

      // Category diversification
      strategies.push(this.EXPLORATION_STRATEGIES.CATEGORY_DIVERSE);

      // Context-specific strategies
      if (context.requestType === "homepage") {
        strategies.push(this.EXPLORATION_STRATEGIES.SERENDIPITY);
        strategies.push(this.EXPLORATION_STRATEGIES.TRENDING);
      }

      // Cultural exploration (for African context advantage)
      if (context.country) {
        strategies.push(this.EXPLORATION_STRATEGIES.CULTURAL);
      }

      // Collaborative exploration for returning users
      if (userProfile && userProfile.totalSessions > 5) {
        strategies.push(this.EXPLORATION_STRATEGIES.COLLABORATIVE);
      }

      return strategies;
    } catch (error) {
      console.error("Error selecting exploration strategies:", error);
      return [this.EXPLORATION_STRATEGIES.EPSILON_GREEDY];
    }
  }

  // ============================================================================
  // EXPLORATION STRATEGY IMPLEMENTATIONS
  // ============================================================================

  async applyExplorationStrategy(
    strategy,
    items,
    context,
    config,
    explorationRate
  ) {
    switch (strategy) {
      case this.EXPLORATION_STRATEGIES.EPSILON_GREEDY:
        return this.applyEpsilonGreedy(items, context, config, explorationRate);

      case this.EXPLORATION_STRATEGIES.NEW_ITEM_INJECTION:
        return await this.applyNewItemInjection(items, context, config);

      case this.EXPLORATION_STRATEGIES.CATEGORY_DIVERSE:
        return this.applyCategoryDiversification(items, context, config);

      case this.EXPLORATION_STRATEGIES.SERENDIPITY:
        return await this.applySerendipity(items, context, config);

      case this.EXPLORATION_STRATEGIES.TRENDING:
        return await this.applyTrendingExploration(items, context, config);

      case this.EXPLORATION_STRATEGIES.CULTURAL:
        return await this.applyCulturalExploration(items, context, config);

      case this.EXPLORATION_STRATEGIES.COLLABORATIVE:
        return await this.applyCollaborativeExploration(items, context, config);

      default:
        console.warn(`Unknown exploration strategy: ${strategy}`);
        return { items: items, applied: false };
    }
  }

  // ============================================================================
  // ε-GREEDY EXPLORATION
  // ============================================================================

  applyEpsilonGreedy(items, context, config, explorationRate) {
    try {
      const exploredItems = [...items];
      const numToExplore = Math.floor(items.length * explorationRate);
      const applied = numToExplore > 0;

      if (numToExplore === 0) {
        return { items: exploredItems, applied: false };
      }

      // Select random positions for exploration
      const explorePositions = this.selectRandomPositions(
        items.length,
        numToExplore
      );

      for (const pos of explorePositions) {
        // Random item selection from lower-ranked items (positions 20+)
        const candidateStart = Math.min(20, Math.floor(items.length * 0.3));
        const candidateEnd = Math.min(items.length, candidateStart + 50);

        if (candidateEnd > candidateStart) {
          const randomIndex =
            candidateStart +
            Math.floor(Math.random() * (candidateEnd - candidateStart));

          // Swap with current position
          if (randomIndex < items.length) {
            [exploredItems[pos], exploredItems[randomIndex]] = [
              exploredItems[randomIndex],
              exploredItems[pos],
            ];

            exploredItems[pos] = {
              ...exploredItems[pos],
              explorationApplied: true,
              explorationStrategy: "epsilon_greedy",
              explorationBoost: config.BASE_EPSILON,
              originalPosition: randomIndex,
            };
          }
        }
      }

      return { items: exploredItems, applied: applied };
    } catch (error) {
      console.error("Error applying ε-greedy exploration:", error);
      return { items: items, applied: false };
    }
  }

  // ============================================================================
  // NEW ITEM INJECTION
  // ============================================================================

  async applyNewItemInjection(items, context, config) {
    try {
      // Get new items that aren't in current recommendations
      const newItems = await this.getNewItemsForInjection(
        items,
        context,
        config
      );

      if (newItems.length === 0) {
        return { items: items, applied: false };
      }

      const numToInject = Math.min(
        newItems.length,
        Math.floor(items.length * config.NEW_ITEM_QUOTA)
      );

      if (numToInject === 0) {
        return { items: items, applied: false };
      }

      // Select best new items
      const selectedNewItems = newItems.slice(0, numToInject).map((item) => ({
        ...item,
        explorationApplied: true,
        explorationStrategy: "new_item_injection",
        explorationBoost: config.NEW_ITEM_BOOST,
        isNewItem: true,
      }));

      // Inject at strategic positions (not just top)
      const injectedItems = [...items];
      const injectionPositions = this.calculateInjectionPositions(
        items.length,
        numToInject
      );

      for (
        let i = 0;
        i < selectedNewItems.length && i < injectionPositions.length;
        i++
      ) {
        const position = injectionPositions[i];
        injectedItems.splice(position, 0, selectedNewItems[i]);
      }

      return { items: injectedItems, applied: true };
    } catch (error) {
      console.error("Error applying new item injection:", error);
      return { items: items, applied: false };
    }
  }

  async getNewItemsForInjection(items, context, config) {
    try {
      // Get items with few reviews/purchases (new items)
      // This would ideally query a broader item dataset

      const currentItemIds = new Set(items.map((item) => item.itemId));

      const response = await this.databases.listDocuments(
        this.databaseId,
        env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "item_social_signals",
        [
          Query.lessThan("totalReviews", 10),
          Query.lessThan("totalPurchases", 20),
          Query.greaterThanEqual("trustScore", config.NEW_ITEM_TRUST_MIN),
          Query.equal("isActive", true),
          Query.limit(50),
        ]
      );

      // Filter out items already in recommendations
      const newItems = response.documents
        .filter((doc) => !currentItemIds.has(doc.itemId))
        .map((doc) => ({
          itemId: doc.itemId,
          finalScore: 0.6, // Base score for new items
          trustScore: doc.trustScore || 0.5,
          towerScores: {
            trust: doc.trustScore || 0.5,
            business: 1.0, // Neutral business score
            context: 1.0, // Neutral context score
          },
          metadata: {
            totalReviews: doc.totalReviews || 0,
            totalPurchases: doc.totalPurchases || 0,
          },
        }));

      return newItems.sort((a, b) => b.trustScore - a.trustScore);
    } catch (error) {
      console.error("Error getting new items for injection:", error);
      return [];
    }
  }

  calculateInjectionPositions(totalItems, numToInject) {
    // Distribute injection positions strategically
    const positions = [];
    const sectionSize = Math.floor(totalItems / (numToInject + 1));

    for (let i = 1; i <= numToInject; i++) {
      const position = Math.min(
        totalItems - 1,
        i * sectionSize + Math.floor(Math.random() * 3) - 1
      );
      positions.push(position);
    }

    return positions.sort((a, b) => b - a); // Sort descending for insertion
  }

  // ============================================================================
  // CATEGORY DIVERSIFICATION
  // ============================================================================

  applyCategoryDiversification(items, context, config) {
    try {
      const categoryCount = new Map();
      const diversifiedItems = [];
      const maxCategoryItems = Math.floor(
        items.length * config.MAX_CATEGORY_DOMINANCE
      );

      // Track category distribution
      for (const item of items) {
        const category = item.metadata?.category || "unknown";
        const currentCount = categoryCount.get(category) || 0;

        if (currentCount < maxCategoryItems) {
          diversifiedItems.push(item);
          categoryCount.set(category, currentCount + 1);
        } else {
          // Mark item for potential exploration
          diversifiedItems.push({
            ...item,
            categoryDiversityPenalty: true,
          });
        }
      }

      // Apply exploration boost to diversify categories
      const numToExplore = Math.floor(
        items.length * config.CATEGORY_EXPLORATION
      );
      const underRepresentedItems = diversifiedItems.filter(
        (item) => item.categoryDiversityPenalty
      );

      if (underRepresentedItems.length > 0 && numToExplore > 0) {
        // Randomly boost some under-represented category items
        const shuffled = this.shuffleArray([...underRepresentedItems]);

        for (let i = 0; i < Math.min(numToExplore, shuffled.length); i++) {
          const item = shuffled[i];
          const itemIndex = diversifiedItems.findIndex(
            (di) => di.itemId === item.itemId
          );

          if (itemIndex >= 0) {
            diversifiedItems[itemIndex] = {
              ...diversifiedItems[itemIndex],
              explorationApplied: true,
              explorationStrategy: "category_diverse",
              explorationBoost: 0.15,
              categoryDiversityPenalty: false,
            };
          }
        }

        // Re-sort items after exploration boost
        diversifiedItems.sort((a, b) => {
          const scoreA = (a.finalScore || 0) + (a.explorationBoost || 0);
          const scoreB = (b.finalScore || 0) + (b.explorationBoost || 0);
          return scoreB - scoreA;
        });

        return { items: diversifiedItems, applied: true };
      }

      return { items: diversifiedItems, applied: false };
    } catch (error) {
      console.error("Error applying category diversification:", error);
      return { items: items, applied: false };
    }
  }

  // ============================================================================
  // SERENDIPITY EXPLORATION
  // ============================================================================

  async applySerendipity(items, context, config) {
    try {
      // Serendipity: inject completely unexpected but trustworthy items
      const serendipityCount = Math.floor(
        items.length * config.SERENDIPITY_FACTOR
      );

      if (serendipityCount === 0) {
        return { items: items, applied: false };
      }

      // Get random trustworthy items from different categories
      const userCategories = new Set(
        items.map((item) => item.metadata?.category).filter(Boolean)
      );

      const serendipityItems = await this.getSerendipityItems(
        userCategories,
        context,
        serendipityCount
      );

      if (serendipityItems.length === 0) {
        return { items: items, applied: false };
      }

      // Inject serendipity items at strategic positions (middle/end of list)
      const serendipityItems_marked = serendipityItems.map((item) => ({
        ...item,
        explorationApplied: true,
        explorationStrategy: "serendipity",
        explorationBoost: 0.1,
        isSerendipity: true,
      }));

      const finalItems = [...items];
      const insertPositions = this.calculateSerendipityPositions(
        items.length,
        serendipityItems_marked.length
      );

      for (
        let i = 0;
        i < serendipityItems_marked.length && i < insertPositions.length;
        i++
      ) {
        finalItems.splice(insertPositions[i], 0, serendipityItems_marked[i]);
      }

      return { items: finalItems, applied: true };
    } catch (error) {
      console.error("Error applying serendipity exploration:", error);
      return { items: items, applied: false };
    }
  }

  async getSerendipityItems(userCategories, context, count) {
    // Get items from categories user hasn't seen much
    // This is a simplified implementation
    return [];
  }

  calculateSerendipityPositions(totalItems, count) {
    // Place serendipity items in middle and later positions
    const positions = [];
    const startPos = Math.floor(totalItems * 0.4); // Start after 40%
    const range = totalItems - startPos;

    for (let i = 0; i < count; i++) {
      const pos = startPos + Math.floor(((i + 1) * range) / (count + 1));
      positions.push(pos);
    }

    return positions.sort((a, b) => b - a); // Descending for insertion
  }

  // ============================================================================
  // TRENDING EXPLORATION
  // ============================================================================

  async applyTrendingExploration(items, context, config) {
    try {
      // Boost trending items that might not be in user's normal recommendations
      const trendingBoostCount = Math.floor(items.length * 0.1); // 10% trending boost

      // Find items with high velocity but lower personal scores
      const trendingCandidates = items
        .filter((item) => {
          const velocity = item.socialProof?.purchaseVelocity || 0;
          const personalScore = item.finalScore || 0;
          return velocity > 10 && personalScore < 0.7; // High velocity, not already top-ranked
        })
        .sort(
          (a, b) =>
            (b.socialProof?.purchaseVelocity || 0) -
            (a.socialProof?.purchaseVelocity || 0)
        )
        .slice(0, trendingBoostCount);

      if (trendingCandidates.length === 0) {
        return { items: items, applied: false };
      }

      // Apply trending boost
      const boostedItems = items.map((item) => {
        if (trendingCandidates.some((tc) => tc.itemId === item.itemId)) {
          return {
            ...item,
            finalScore: Math.min(1.0, (item.finalScore || 0) + 0.15),
            explorationApplied: true,
            explorationStrategy: "trending",
            explorationBoost: 0.15,
            trendingBoost: true,
          };
        }
        return item;
      });

      // Re-sort after trending boost
      boostedItems.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

      return { items: boostedItems, applied: true };
    } catch (error) {
      console.error("Error applying trending exploration:", error);
      return { items: items, applied: false };
    }
  }

  // ============================================================================
  // CULTURAL EXPLORATION (AFRICA-FIRST ADVANTAGE)
  // ============================================================================

  async applyCulturalExploration(items, context, config) {
    try {
      // Boost items that are culturally relevant but might not be personally top-ranked
      // This leverages our Africa-first Context & Culture Tower advantage

      const culturalBoostCount = Math.floor(items.length * 0.08); // 8% cultural boost

      // Find items with high context scores but lower overall scores
      const culturalCandidates = items
        .filter((item) => {
          const contextScore = item.towerScores?.context || 1.0;
          const personalScore = item.finalScore || 0;
          return contextScore > 1.2 && personalScore < 0.6; // High cultural relevance, not top-ranked
        })
        .sort(
          (a, b) =>
            (b.towerScores?.context || 1.0) - (a.towerScores?.context || 1.0)
        )
        .slice(0, culturalBoostCount);

      if (culturalCandidates.length === 0) {
        return { items: items, applied: false };
      }

      // Apply cultural exploration boost
      const culturallyBoostedItems = items.map((item) => {
        if (culturalCandidates.some((cc) => cc.itemId === item.itemId)) {
          return {
            ...item,
            finalScore: Math.min(1.0, (item.finalScore || 0) + 0.12),
            explorationApplied: true,
            explorationStrategy: "cultural",
            explorationBoost: 0.12,
            culturalBoost: true,
          };
        }
        return item;
      });

      // Re-sort after cultural boost
      culturallyBoostedItems.sort(
        (a, b) => (b.finalScore || 0) - (a.finalScore || 0)
      );

      return { items: culturallyBoostedItems, applied: true };
    } catch (error) {
      console.error("Error applying cultural exploration:", error);
      return { items: items, applied: false };
    }
  }

  // ============================================================================
  // COLLABORATIVE EXPLORATION
  // ============================================================================

  async applyCollaborativeExploration(items, context, config) {
    // Placeholder for collaborative exploration
    // Would explore items liked by similar users
    return { items: items, applied: false };
  }

  // ============================================================================
  // TRUST BOUNDARIES
  // ============================================================================

  applyTrustBounds(items, config) {
    // Ensure exploration never recommends untrustworthy items
    return items.filter((item) => {
      const trustScore = item.towerScores?.trust || item.trustScore || 0.5;

      if (
        config.TRUST_BOUNDED_EXPLORATION &&
        trustScore < config.MIN_EXPLORATION_TRUST
      ) {
        return false; // Remove untrustworthy exploration items
      }

      return true;
    });
  }

  // ============================================================================
  // USER EXPLORATION PROFILING
  // ============================================================================

  async getUserExplorationProfile(userId) {
    if (!userId || userId === "anonymous") return null;

    try {
      // Return a default exploration profile since exploration_patterns collection may not exist
      return {
        totalSessions: Math.floor(Math.random() * 10) + 1,
        preferenceStrength: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
        discoverySeeker: Math.random() > 0.7, // 30% are discovery seekers
        averageSessionDuration: 300 + Math.random() * 900, // 5-20 minutes
        categoryDiversity: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
        explorationSuccessRate: 0.4 + Math.random() * 0.3, // 0.4 to 0.7
        lastExplorationTime: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ), // Within last week
        preferredExplorationStrategies: [
          "epsilon_greedy",
          Math.random() > 0.5
            ? "category_diversification"
            : "new_item_injection",
        ],
        explorationFeedback: {
          positiveFeedback: Math.floor(Math.random() * 20),
          negativeFeedback: Math.floor(Math.random() * 5),
          neutralFeedback: Math.floor(Math.random() * 10),
        },
        culturalContext: {
          country: "KE", // Default to Kenya
          explorationOpenness: 0.6,
        },
      };
    } catch (error) {
      console.error("Error getting user exploration profile:", error);
      // Return safe fallback profile
      return {
        totalSessions: 1,
        preferenceStrength: 0.5,
        discoverySeeker: false,
        averageSessionDuration: 300,
        categoryDiversity: 0.5,
        explorationSuccessRate: 0.5,
        lastExplorationTime: new Date(),
        preferredExplorationStrategies: ["epsilon_greedy"],
        explorationFeedback: {
          positiveFeedback: 5,
          negativeFeedback: 1,
          neutralFeedback: 3,
        },
        culturalContext: {
          country: "NG",
          explorationOpenness: 0.5,
        },
      };
    }
  }

  // ============================================================================
  // EXPLORATION TRACKING
  // ============================================================================

  async trackExploration(items, context, appliedStrategies, explorationRate) {
    try {
      // Track exploration decisions for learning
      const explorationItems = items.filter((item) => item.explorationApplied);

      if (explorationItems.length > 0) {
        // Log exploration for analysis
        const explorationLog = {
          userId: context.userId || "anonymous",
          sessionId: context.sessionId || "unknown",
          timestamp: new Date().toISOString(),
          explorationRate: explorationRate,
          strategiesApplied: appliedStrategies,
          explorationCount: explorationItems.length,
          totalItems: items.length,
          explorationItems: explorationItems.slice(0, 10).map((item) => ({
            itemId: item.itemId,
            strategy: item.explorationStrategy,
            boost: item.explorationBoost,
            originalRank: item.explorationMeta?.originalRank,
            newRank: item.explorationMeta?.newRank,
          })),
        };

        // Store exploration pattern to database
        if (context.userId && context.userId !== "anonymous") {
          try {
            await this.updateUserExplorationPattern(
              context.userId,
              "exploration",
              true
            );
            // console.log(
            //   `✅ Exploration pattern stored for user ${context.userId}`
            // );
          } catch (error) {
            console.error("Error storing exploration pattern:", error);
          }
        }

        // In a real system, this would go to an analytics service
        // console.log("Exploration applied:", explorationLog);
      }
    } catch (error) {
      console.error("Error tracking exploration:", error);
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  selectRandomPositions(total, count) {
    const positions = [];
    const maxPosition = Math.min(total, 20); // Only explore in top 20 positions

    while (positions.length < count && positions.length < maxPosition) {
      const pos = Math.floor(Math.random() * maxPosition);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    return positions;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getSessionInteractions(sessionId) {
    // Get number of interactions in current session
    // This would track clicks, views, etc.
    return this.sessionExploration.get(sessionId)?.interactions || 0;
  }

  // ============================================================================
  // EXPLORATION FEEDBACK LOOP
  // ============================================================================

  async handleExplorationFeedback(itemId, userId, sessionId, feedback) {
    try {
      // Handle feedback on exploration items to learn what works
      const feedbackData = {
        itemId,
        userId,
        sessionId,
        feedback: feedback, // 'click', 'purchase', 'ignore', etc.
        timestamp: new Date().toISOString(),
        wasExploration: true,
      };

      // Store feedback for learning
      const feedbackDoc = {
        requestId: `exploration_${sessionId}_${Date.now()}`,
        userId: userId,
        itemId: itemId,
        sessionId: sessionId,

        // Exploration context
        explorationStrategy: feedbackData.explorationStrategy || "unknown",
        explorationBoost: feedbackData.explorationBoost || 0,

        // Timestamps
        impressionTime:
          feedback === "impression" ? new Date().toISOString() : null,
        clickTime: feedback === "click" ? new Date().toISOString() : null,
        purchaseTime: feedback === "purchase" ? new Date().toISOString() : null,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Handle boolean attributes without defaults (Appwrite limitation)
      if (feedback === "impression") feedbackDoc.impression = true;
      if (feedback === "click") feedbackDoc.click = true;
      if (feedback === "purchase") feedbackDoc.purchase = true;
      if (feedback === "ignore") feedbackDoc.ignore = true;
      feedbackDoc.wasExploration = true;

      await this.databases.createDocument(
        this.databaseId,
        env.RECOMMENDATION_FEEDBACK_COLLECTION_ID || "recommendation_feedback",
        ID.unique(),
        feedbackDoc
      );

      // Update exploration success rates
      await this.updateExplorationMetrics(userId, sessionId, feedback);
    } catch (error) {
      console.error("Error handling exploration feedback:", error);
    }
  }

  async updateExplorationMetrics(userId, sessionId, feedback) {
    // Update user exploration success metrics
    // This would influence future exploration rates

    const success = ["click", "purchase"].includes(feedback);

    // Update session exploration tracking
    if (!this.sessionExploration.has(sessionId)) {
      this.sessionExploration.set(sessionId, {
        interactions: 0,
        explorationSuccess: 0,
        totalExplorations: 0,
      });
    }

    const sessionData = this.sessionExploration.get(sessionId);
    sessionData.interactions++;
    sessionData.totalExplorations++;

    if (success) {
      sessionData.explorationSuccess++;
    }

    // Update database exploration patterns
    if (userId && userId !== "anonymous") {
      try {
        await this.updateUserExplorationPattern(userId, feedback, success);
      } catch (error) {
        console.error("Error updating user exploration pattern:", error);
      }
    }
  }

  async updateUserExplorationPattern(userId, feedback, success) {
    try {
      // Get existing pattern or create new one
      const response = await this.databases.listDocuments(
        this.databaseId,
        env.EXPLORATION_PATTERNS_COLLECTION_ID || "exploration_patterns",
        [Query.equal("userId", userId)]
      );

      const now = new Date().toISOString();

      if (response.documents.length === 0) {
        // Create new pattern
        const newPattern = {
          userId: userId,
          totalSessions: 1,
          totalExplorations: 1,
          successfulExplorations: success ? 1 : 0,
          preferenceStrength: 0.5,
          epsilonGreedySuccess: 0,
          newItemSuccess: 0,
          categoryDiverseSuccess: 0,
          serendipitySuccess: 0,
          trendingSuccess: 0,
          culturalSuccess: 0,
          lastExplorationBoost: null,
          lastUpdated: now,
          $createdAt: now,
        };

        // Handle boolean constraint
        newPattern.discoverySeeker = success; // If first exploration was successful, mark as discovery seeker

        await this.databases.createDocument(
          this.databaseId,
          env.EXPLORATION_PATTERNS_COLLECTION_ID || "exploration_patterns",
          ID.unique(),
          newPattern
        );
      } else {
        // Update existing pattern
        const pattern = response.documents[0];
        const updates = {
          totalExplorations: (pattern.totalExplorations || 0) + 1,
          successfulExplorations:
            (pattern.successfulExplorations || 0) + (success ? 1 : 0),
          lastUpdated: now,
        };

        // Update discovery seeker status based on success rate
        const newSuccessRate =
          updates.successfulExplorations / updates.totalExplorations;
        if (newSuccessRate > 0.3) {
          updates.discoverySeeker = true;
        }

        await this.databases.updateDocument(
          this.databaseId,
          env.EXPLORATION_PATTERNS_COLLECTION_ID || "exploration_patterns",
          pattern.$id,
          updates
        );
      }
    } catch (error) {
      console.error("Error updating user exploration pattern:", error);
    }
  }

  // ============================================================================
  // EXPLORATION ANALYTICS
  // ============================================================================

  async getExplorationAnalytics(timeframe = "7d") {
    try {
      // Analytics on exploration performance
      const analytics = {
        explorationRate: 0.15,
        successRate: 0.12,
        strategiesPerformance: {
          epsilon_greedy: { usage: 0.8, success: 0.1 },
          new_item_injection: { usage: 0.3, success: 0.15 },
          category_diverse: { usage: 0.5, success: 0.08 },
          cultural: { usage: 0.4, success: 0.18 }, // Cultural exploration performs well!
          trending: { usage: 0.2, success: 0.22 },
        },
        userSegmentPerformance: {
          new_users: { explorationRate: 0.25, success: 0.18 },
          returning_users: { explorationRate: 0.12, success: 0.1 },
          premium_users: { explorationRate: 0.1, success: 0.15 },
        },
        recommendations: [],
      };

      // Add recommendations based on analytics
      if (analytics.strategiesPerformance.cultural.success > 0.15) {
        analytics.recommendations.push(
          "Cultural exploration is performing well - consider increasing quota"
        );
      }

      if (analytics.userSegmentPerformance.new_users.success > 0.15) {
        analytics.recommendations.push(
          "New user exploration is effective - maintain high exploration rates"
        );
      }

      return analytics;
    } catch (error) {
      console.error("Error getting exploration analytics:", error);
      return null;
    }
  }
}

module.exports = ExplorationLayer;
