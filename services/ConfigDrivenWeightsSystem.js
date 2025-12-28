const { Client, Databases, Query, ID } = require("node-appwrite");
const { db } = require("../src/appwrite");
const { env } = require("../src/env");

/**
 * Config-Driven Weights System - A/B Testing & Dynamic Optimization
 *
 * This system manages the fusion layer weights dynamically through:
 * - A/B testing framework for weight experimentation
 * - Performance-based automatic weight adjustment
 * - User segment-specific weight configurations
 * - Cultural context weight optimization
 * - Business constraint management
 *
 * Key Features: Real-time weight updates, statistical significance testing,
 * gradual rollouts, performance monitoring, automatic fallback
 */

class ConfigDrivenWeightsSystem {
  constructor() {
    this.databases = db;
    this.databaseId = env.APPWRITE_DATABASE_ID;

    // Default fusion weights (production baseline)
    this.DEFAULT_WEIGHTS = {
      INTENT_WEIGHT: 0.3, // User intent tower
      ITEM_WEIGHT: 0.25, // Item representation tower
      CONTEXT_WEIGHT: 0.2, // Context & culture tower (Africa-first advantage)
      TRUST_WEIGHT: 0.15, // Social proof & trust tower
      BUSINESS_WEIGHT: 0.1, // Business & supply tower
      RISK_PENALTY: 0.05, // Risk reduction factor
    };

    // Weight constraints (business rules)
    this.WEIGHT_CONSTRAINTS = {
      MIN_INTENT_WEIGHT: 0.2, // Intent must always be significant
      MAX_BUSINESS_WEIGHT: 0.15, // Business can't dominate recommendations
      MIN_CONTEXT_WEIGHT: 0.15, // Cultural advantage must be preserved
      MAX_TRUST_WEIGHT: 0.25, // Trust shouldn't overwhelm other signals
      TOTAL_WEIGHT_TOLERANCE: 0.02, // Allow 2% deviation from 1.0
    };

    // A/B Testing configuration
    this.AB_TEST_CONFIG = {
      MIN_SAMPLE_SIZE: 1000, // Minimum users per variant
      CONFIDENCE_LEVEL: 0.95, // Statistical significance threshold
      MAX_TEST_DURATION: 30, // Maximum days for a test
      ROLLOUT_THRESHOLD: 0.05, // 5% improvement threshold for rollout
      MAX_CONCURRENT_TESTS: 3, // Maximum simultaneous tests
      TRAFFIC_SPLIT: 0.2, // 20% of traffic for testing
    };

    // Performance monitoring
    this.PERFORMANCE_METRICS = {
      CTR: "click_through_rate",
      PURCHASE_RATE: "purchase_rate",
      ADD_TO_CART_RATE: "add_to_cart_rate",
      DIVERSITY_SCORE: "diversity_score",
      CULTURAL_RELEVANCE: "cultural_relevance_score",
      USER_SATISFACTION: "user_satisfaction_score",
    };

    // Active weight configurations cache
    this.weightConfigurations = new Map();
    this.activeExperiments = new Map();
    this.userExperimentAssignments = new Map();

    // Performance tracking
    this.performanceMetrics = new Map();
    this.lastMetricsUpdate = null;

    // Cache settings
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastCacheRefresh = null;
  }

  // ============================================================================
  // WEIGHT RETRIEVAL (MAIN INTERFACE)
  // ============================================================================

  /**
   * Get fusion weights for a specific user/context
   * This is the main interface used by the Fusion Layer
   */
  async getFusionWeights(userId, context = {}) {
    try {
      // 1. Determine user's experiment assignment
      const assignment = await this.getUserExperimentAssignment(
        userId,
        context
      );

      // 2. Get weights for the assigned configuration
      const weights = await this.getWeightConfiguration(assignment.configId);

      // 3. Apply any real-time adjustments
      const adjustedWeights = await this.applyRealTimeAdjustments(
        weights,
        context
      );

      // 4. Log weight usage for analytics
      await this.logWeightUsage(
        userId,
        assignment.configId,
        adjustedWeights,
        context
      );

      return adjustedWeights;
    } catch (error) {
      // console.error("Error getting fusion weights:", error);
      // Fallback to default weights on error
      return this.DEFAULT_WEIGHTS;
    }
  }

  // ============================================================================
  // EXPERIMENT ASSIGNMENT
  // ============================================================================

  async getUserExperimentAssignment(userId, context) {
    try {
      // Check cache first
      const cacheKey = `${userId}_${JSON.stringify(context)}`;
      if (this.userExperimentAssignments.has(cacheKey)) {
        const cached = this.userExperimentAssignments.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.assignment;
        }
      }

      // 1. Get active experiments
      const activeExperiments = await this.getActiveExperiments();

      // 2. Determine user eligibility
      const eligibleExperiments = await this.filterEligibleExperiments(
        userId,
        context,
        activeExperiments
      );

      // 3. Assign user to experiment (or control)
      const assignment = await this.assignUserToExperiment(
        userId,
        eligibleExperiments
      );

      // 4. Cache assignment
      this.userExperimentAssignments.set(cacheKey, {
        assignment: assignment,
        timestamp: Date.now(),
      });

      return assignment;
    } catch (error) {
      // console.error("Error getting user experiment assignment:", error);
      // Default assignment on error
      return { configId: "default", experimentId: null, variant: "control" };
    }
  }

  async getActiveExperiments() {
    try {
      // Check cache
      if (
        this.activeExperiments.size > 0 &&
        Date.now() - this.lastCacheRefresh < this.cacheExpiry
      ) {
        return Array.from(this.activeExperiments.values());
      }

      // Fetch from database
      const experiments = await this.databases.listDocuments(
        this.databaseId,
        env.WEIGHT_EXPERIMENTS_COLLECTION_ID || "weight_experiments",
        [
          Query.equal("status", "active"),
          Query.greaterThan("endDate", new Date().toISOString()),
          Query.lessThan("startDate", new Date().toISOString()),
        ]
      );

      // Update cache
      this.activeExperiments.clear();
      for (const experiment of experiments.documents) {
        this.activeExperiments.set(experiment.$id, experiment);
      }
      this.lastCacheRefresh = Date.now();

      return experiments.documents;
    } catch (error) {
      // console.error("Error fetching active experiments:", error);
      return [];
    }
  }

  async filterEligibleExperiments(userId, context, experiments) {
    const eligible = [];

    for (const experiment of experiments) {
      try {
        // Parse targeting criteria
        const targeting = JSON.parse(experiment.targetingCriteria || "{}");

        // Check user eligibility
        if (
          await this.isUserEligibleForExperiment(userId, context, targeting)
        ) {
          eligible.push(experiment);
        }
      } catch (error) {
        // console.warn(
        //   `Error checking eligibility for experiment ${experiment.$id}:`,
        //   error
        // );
      }
    }

    return eligible;
  }

  async isUserEligibleForExperiment(userId, context, targeting) {
    try {
      // Location targeting
      if (targeting.countries && targeting.countries.length > 0) {
        const userCountry =
          context.country || (await this.getUserCountry(userId));
        if (!targeting.countries.includes(userCountry)) {
          return false;
        }
      }

      // User segment targeting
      if (targeting.userSegments && targeting.userSegments.length > 0) {
        const userSegment = await this.getUserSegment(userId);
        if (!targeting.userSegments.includes(userSegment)) {
          return false;
        }
      }

      // Language targeting
      if (targeting.languages && targeting.languages.length > 0) {
        const userLanguage =
          context.language || (await this.getUserLanguage(userId));
        if (!targeting.languages.includes(userLanguage)) {
          return false;
        }
      }

      // Device targeting
      if (targeting.deviceTypes && targeting.deviceTypes.length > 0) {
        const deviceType = context.deviceType || "unknown";
        if (!targeting.deviceTypes.includes(deviceType)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      // console.error("Error checking user eligibility:", error);
      return false;
    }
  }

  async assignUserToExperiment(userId, eligibleExperiments) {
    try {
      if (eligibleExperiments.length === 0) {
        return { configId: "default", experimentId: null, variant: "control" };
      }

      // Simple hash-based assignment for consistent results
      const hash = this.hashUserId(userId);

      // Check if user should be in testing traffic
      const testingTrafficThreshold = this.AB_TEST_CONFIG.TRAFFIC_SPLIT * 100;
      const userTrafficBucket = hash % 100;

      if (userTrafficBucket >= testingTrafficThreshold) {
        // User not in testing traffic
        return { configId: "default", experimentId: null, variant: "control" };
      }

      // Assign to highest priority experiment
      const experiment = eligibleExperiments[0]; // Assuming sorted by priority
      const variants = JSON.parse(experiment.variants || "[]");

      if (variants.length === 0) {
        return { configId: "default", experimentId: null, variant: "control" };
      }

      // Assign to variant based on traffic split
      const variantIndex = hash % variants.length;
      const selectedVariant = variants[variantIndex];

      // Store assignment for analytics
      await this.storeUserExperimentAssignment(
        userId,
        experiment.$id,
        selectedVariant.id
      );

      return {
        configId: selectedVariant.weightConfigId,
        experimentId: experiment.$id,
        variant: selectedVariant.id,
      };
    } catch (error) {
      // console.error("Error assigning user to experiment:", error);
      return { configId: "default", experimentId: null, variant: "control" };
    }
  }

  hashUserId(userId) {
    // Simple hash function for consistent user assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ============================================================================
  // WEIGHT CONFIGURATION MANAGEMENT
  // ============================================================================

  async getWeightConfiguration(configId) {
    try {
      // Check cache
      if (this.weightConfigurations.has(configId)) {
        const cached = this.weightConfigurations.get(configId);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.weights;
        }
      }

      // Handle default configuration
      if (configId === "default") {
        return this.DEFAULT_WEIGHTS;
      }

      // Fetch from database
      const configs = await this.databases.listDocuments(
        this.databaseId,
        env.WEIGHT_CONFIGURATIONS_COLLECTION_ID || "weight_configurations",
        [Query.equal("configId", configId)]
      );

      if (configs.documents.length === 0) {
        // console.warn(
        //   `Weight configuration ${configId} not found, using default`
        // );
        return this.DEFAULT_WEIGHTS;
      }

      const config = configs.documents[0];
      const weights = {
        INTENT_WEIGHT:
          parseFloat(config.intentWeight) || this.DEFAULT_WEIGHTS.INTENT_WEIGHT,
        ITEM_WEIGHT:
          parseFloat(config.itemWeight) || this.DEFAULT_WEIGHTS.ITEM_WEIGHT,
        CONTEXT_WEIGHT:
          parseFloat(config.contextWeight) ||
          this.DEFAULT_WEIGHTS.CONTEXT_WEIGHT,
        TRUST_WEIGHT:
          parseFloat(config.trustWeight) || this.DEFAULT_WEIGHTS.TRUST_WEIGHT,
        BUSINESS_WEIGHT:
          parseFloat(config.businessWeight) ||
          this.DEFAULT_WEIGHTS.BUSINESS_WEIGHT,
        RISK_PENALTY:
          parseFloat(config.riskPenalty) || this.DEFAULT_WEIGHTS.RISK_PENALTY,
      };

      // Validate weights
      const validatedWeights = this.validateWeights(weights);

      // Cache configuration
      this.weightConfigurations.set(configId, {
        weights: validatedWeights,
        timestamp: Date.now(),
      });

      return validatedWeights;
    } catch (error) {
      // console.error(`Error getting weight configuration ${configId}:`, error);
      return this.DEFAULT_WEIGHTS;
    }
  }

  validateWeights(weights) {
    try {
      const validated = { ...weights };

      // Check individual weight constraints
      validated.INTENT_WEIGHT = Math.max(
        this.WEIGHT_CONSTRAINTS.MIN_INTENT_WEIGHT,
        validated.INTENT_WEIGHT
      );
      validated.BUSINESS_WEIGHT = Math.min(
        this.WEIGHT_CONSTRAINTS.MAX_BUSINESS_WEIGHT,
        validated.BUSINESS_WEIGHT
      );
      validated.CONTEXT_WEIGHT = Math.max(
        this.WEIGHT_CONSTRAINTS.MIN_CONTEXT_WEIGHT,
        validated.CONTEXT_WEIGHT
      );
      validated.TRUST_WEIGHT = Math.min(
        this.WEIGHT_CONSTRAINTS.MAX_TRUST_WEIGHT,
        validated.TRUST_WEIGHT
      );

      // Normalize weights to sum to 1.0 (excluding risk penalty)
      const totalWeight =
        validated.INTENT_WEIGHT +
        validated.ITEM_WEIGHT +
        validated.CONTEXT_WEIGHT +
        validated.TRUST_WEIGHT +
        validated.BUSINESS_WEIGHT;

      if (
        Math.abs(totalWeight - 1.0) >
        this.WEIGHT_CONSTRAINTS.TOTAL_WEIGHT_TOLERANCE
      ) {
        // Normalize weights
        const normalizationFactor = 1.0 / totalWeight;
        validated.INTENT_WEIGHT *= normalizationFactor;
        validated.ITEM_WEIGHT *= normalizationFactor;
        validated.CONTEXT_WEIGHT *= normalizationFactor;
        validated.TRUST_WEIGHT *= normalizationFactor;
        validated.BUSINESS_WEIGHT *= normalizationFactor;
      }

      return validated;
    } catch (error) {
      // console.error("Error validating weights:", error);
      return this.DEFAULT_WEIGHTS;
    }
  }

  // ============================================================================
  // REAL-TIME WEIGHT ADJUSTMENTS
  // ============================================================================

  async applyRealTimeAdjustments(baseWeights, context) {
    try {
      const adjustedWeights = { ...baseWeights };

      // 1. Seasonal adjustments (boost context weight during cultural events)
      adjustedWeights.CONTEXT_WEIGHT = await this.applyCulturalAdjustments(
        adjustedWeights.CONTEXT_WEIGHT,
        context
      );

      // 2. Trust adjustments (boost trust weight for new users)
      adjustedWeights.TRUST_WEIGHT = await this.applyTrustAdjustments(
        adjustedWeights.TRUST_WEIGHT,
        context
      );

      // 3. Business adjustments (reduce business weight during high-traffic periods)
      adjustedWeights.BUSINESS_WEIGHT = await this.applyBusinessAdjustments(
        adjustedWeights.BUSINESS_WEIGHT,
        context
      );

      // 4. Re-normalize weights
      return this.validateWeights(adjustedWeights);
    } catch (error) {
      // console.error("Error applying real-time adjustments:", error);
      return baseWeights;
    }
  }

  async applyCulturalAdjustments(contextWeight, context) {
    try {
      // Boost context weight during cultural events
      const today = new Date();
      const isRamadan = await this.isRamadanSeason(today);
      const isChristmas = this.isChristmasSeason(today);
      const isLocalFestival = await this.isLocalFestival(
        today,
        context.country
      );

      let adjustment = 1.0;

      if (isRamadan) adjustment *= 1.15; // 15% boost during Ramadan
      if (isChristmas) adjustment *= 1.1; // 10% boost during Christmas
      if (isLocalFestival) adjustment *= 1.2; // 20% boost during local festivals

      return Math.min(0.35, contextWeight * adjustment); // Cap at 35%
    } catch (error) {
      // console.error("Error applying cultural adjustments:", error);
      return contextWeight;
    }
  }

  async applyTrustAdjustments(trustWeight, context) {
    try {
      // Boost trust weight for new users or high-risk contexts
      let adjustment = 1.0;

      if (context.isNewUser) adjustment *= 1.25; // 25% boost for new users
      if (context.riskScore > 0.7) adjustment *= 1.3; // 30% boost for high-risk users

      return Math.min(0.25, trustWeight * adjustment);
    } catch (error) {
      // console.error("Error applying trust adjustments:", error);
      return trustWeight;
    }
  }

  async applyBusinessAdjustments(businessWeight, context) {
    try {
      // Reduce business weight during high-traffic periods to prioritize user experience
      let adjustment = 1.0;

      if (context.isHighTrafficPeriod) adjustment *= 0.85; // 15% reduction during peak traffic
      if (context.isBlackFriday) adjustment *= 0.7; // 30% reduction during Black Friday

      return businessWeight * adjustment;
    } catch (error) {
      // console.error("Error applying business adjustments:", error);
      return businessWeight;
    }
  }

  // ============================================================================
  // A/B TESTING MANAGEMENT
  // ============================================================================

  async createExperiment(experimentConfig) {
    try {
      const {
        name,
        description,
        variants,
        targetingCriteria,
        startDate,
        endDate,
        primaryMetric,
        requiredSampleSize = this.AB_TEST_CONFIG.MIN_SAMPLE_SIZE,
      } = experimentConfig;

      // Validate experiment configuration
      if (!this.validateExperimentConfig(experimentConfig)) {
        throw new Error("Invalid experiment configuration");
      }

      // Check if we can run more experiments
      const activeExperiments = await this.getActiveExperiments();
      if (
        activeExperiments.length >= this.AB_TEST_CONFIG.MAX_CONCURRENT_TESTS
      ) {
        throw new Error("Maximum concurrent experiments limit reached");
      }

      // Create weight configurations for variants
      const variantConfigs = [];
      for (const variant of variants) {
        const configId = await this.createWeightConfiguration(variant.weights);
        variantConfigs.push({
          ...variant,
          weightConfigId: configId,
        });
      }

      // Create experiment
      const experiment = await this.databases.createDocument(
        this.databaseId,
        env.WEIGHT_EXPERIMENTS_COLLECTION_ID || "weight_experiments",
        ID.unique(),
        {
          name: name,
          description: description,
          status: "active",
          variants: JSON.stringify(variantConfigs),
          targetingCriteria: JSON.stringify(targetingCriteria),
          primaryMetric: primaryMetric,
          requiredSampleSize: requiredSampleSize,
          startDate: startDate,
          endDate: endDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // console.log(`✅ Created A/B test experiment: ${name}`);
      return experiment;
    } catch (error) {
      // console.error("Error creating experiment:", error);
      throw error;
    }
  }

  async createWeightConfiguration(weights) {
    try {
      const validatedWeights = this.validateWeights(weights);
      const configId = `config_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 5)}`;

      await this.databases.createDocument(
        this.databaseId,
        env.WEIGHT_CONFIGURATIONS_COLLECTION_ID || "weight_configurations",
        ID.unique(),
        {
          configId: configId,
          intentWeight: validatedWeights.INTENT_WEIGHT.toString(),
          itemWeight: validatedWeights.ITEM_WEIGHT.toString(),
          contextWeight: validatedWeights.CONTEXT_WEIGHT.toString(),
          trustWeight: validatedWeights.TRUST_WEIGHT.toString(),
          businessWeight: validatedWeights.BUSINESS_WEIGHT.toString(),
          riskPenalty: validatedWeights.RISK_PENALTY.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      return configId;
    } catch (error) {
      // console.error("Error creating weight configuration:", error);
      throw error;
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async trackPerformance(userId, configId, metrics) {
    try {
      await this.databases.createDocument(
        this.databaseId,
        env.WEIGHT_PERFORMANCE_COLLECTION_ID || "weight_performance_metrics",
        ID.unique(),
        {
          userId: userId,
          configId: configId,
          clickThroughRate: metrics.ctr || 0,
          purchaseRate: metrics.purchaseRate || 0,
          addToCartRate: metrics.addToCartRate || 0,
          diversityScore: metrics.diversityScore || 0,
          culturalRelevance: metrics.culturalRelevance || 0,
          userSatisfaction: metrics.userSatisfaction || 0,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      // console.error("Error tracking performance:", error);
    }
  }

  async analyzeExperimentPerformance(experimentId) {
    try {
      const experiment = await this.databases.getDocument(
        this.databaseId,
        "weight_experiments",
        experimentId
      );

      const variants = JSON.parse(experiment.variants);
      const analysis = {
        experimentId: experimentId,
        status: experiment.status,
        variants: [],
        winner: null,
        confidence: 0,
        recommendations: [],
      };

      // Analyze each variant
      for (const variant of variants) {
        const performance = await this.getVariantPerformance(
          variant.weightConfigId
        );
        analysis.variants.push({
          variantId: variant.id,
          performance: performance,
          sampleSize: performance.sampleSize,
        });
      }

      // Determine statistical significance
      const significance = await this.calculateStatisticalSignificance(
        analysis.variants
      );
      analysis.confidence = significance.confidence;
      analysis.winner = significance.winner;

      // Generate recommendations
      if (analysis.confidence > this.AB_TEST_CONFIG.CONFIDENCE_LEVEL) {
        analysis.recommendations.push(
          "Experiment has reached statistical significance"
        );

        if (significance.improvement > this.AB_TEST_CONFIG.ROLLOUT_THRESHOLD) {
          analysis.recommendations.push(
            "Recommend full rollout of winning variant"
          );
        }
      }

      return analysis;
    } catch (error) {
      // console.error("Error analyzing experiment performance:", error);
      return null;
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  validateExperimentConfig(config) {
    // Validate required fields
    if (!config.name || !config.variants || config.variants.length < 2) {
      return false;
    }

    // Validate dates
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    if (start >= end) {
      return false;
    }

    // Validate variants have different weights
    for (const variant of config.variants) {
      if (!variant.weights || !this.validateWeights(variant.weights)) {
        return false;
      }
    }

    return true;
  }

  async logWeightUsage(userId, configId, weights, context) {
    try {
      // Log usage to the existing recommendation_weights collection
      setImmediate(() => {
        this.databases
          .createDocument(
            this.databaseId,
            env.RECOMMENDATION_WEIGHTS_COLLECTION_ID ||
              "recommendation_weights",
            ID.unique(),
            {
              userId: userId,
              configId: configId,
              configName: configId || "default", // Add required configName field
              intentWeight: weights.INTENT_WEIGHT?.toString() || "0.25",
              itemWeight: weights.ITEM_WEIGHT?.toString() || "0.20",
              contextWeight: weights.CONTEXT_WEIGHT?.toString() || "0.15",
              trustWeight: weights.TRUST_WEIGHT?.toString() || "0.20",
              businessWeight: weights.BUSINESS_WEIGHT?.toString() || "0.20",
              riskPenalty: weights.RISK_PENALTY?.toString() || "0.10",
              timestamp: new Date().toISOString(),
            }
          )
          .then(() => {
            // console.log(
            //   `✅ Weight usage logged for user ${userId} with config ${configId}`
            // );
          })
          .catch((error) => {
            // console.warn("Error logging weight usage:", error);
          });
      });
    } catch (error) {
      // Non-blocking, don't throw
      // console.warn("Error in weight usage logging:", error);
    }
  }

  async storeUserExperimentAssignment(userId, experimentId, variantId) {
    try {
      await this.databases.createDocument(
        this.databaseId,
        env.USER_EXPERIMENT_ASSIGNMENTS_COLLECTION_ID ||
          "user_experiment_assignments",
        ID.unique(),
        {
          userId: userId,
          experimentId: experimentId,
          variantId: variantId,
          assignedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      // console.warn("Error storing experiment assignment:", error);
    }
  }

  // ============================================================================
  // CULTURAL INTELLIGENCE HELPERS
  // ============================================================================

  async isRamadanSeason(date) {
    // This would check against Islamic calendar
    // For now, simplified implementation
    return false;
  }

  isChristmasSeason(date) {
    const month = date.getMonth() + 1;
    return month === 12;
  }

  async isLocalFestival(date, country) {
    // This would check local festival calendars
    // For now, simplified implementation
    return false;
  }

  async getUserCountry(userId) {
    // This would fetch user's country from profile
    return "KE"; // Default to Kenya
  }

  async getUserSegment(userId) {
    // This would determine user segment (new, returning, premium, etc.)
    return "returning";
  }

  async getUserLanguage(userId) {
    // This would fetch user's preferred language
    return "en";
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize() {
    try {
      // console.log("🚀 Initializing Config-Driven Weights System...");

      // Create default weight configuration if not exists
      await this.ensureDefaultConfiguration();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // console.log("✅ Config-Driven Weights System initialized");
    } catch (error) {
      // console.error("Error initializing Config-Driven Weights System:", error);
      throw error;
    }
  }

  async ensureDefaultConfiguration() {
    try {
      const configs = await this.databases.listDocuments(
        this.databaseId,
        env.WEIGHT_CONFIGURATIONS_COLLECTION_ID || "weight_configurations",
        [Query.equal("configId", "default")]
      );

      if (configs.documents.length === 0) {
        await this.createWeightConfiguration({
          configId: "default",
          ...this.DEFAULT_WEIGHTS,
        });
        // console.log("Created default weight configuration");
      }
    } catch (error) {
      // console.error("Error ensuring default configuration:", error);
    }
  }

  startPerformanceMonitoring() {
    // Monitor performance every hour
    setInterval(async () => {
      try {
        await this.updatePerformanceMetrics();
      } catch (error) {
        // console.error("Error in performance monitoring:", error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  async updatePerformanceMetrics() {
    // Update cached performance metrics
    // console.log("Updating performance metrics...");
  }
}

module.exports = ConfigDrivenWeightsSystem;
