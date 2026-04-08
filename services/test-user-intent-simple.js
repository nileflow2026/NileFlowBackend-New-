const UserIntentTower = require("./services/towers/UserIntentTower");

/**
 * Simple User Intent Tower Test
 *
 * Tests core intent computation and embedding generation without database dependencies
 */

async function testUserIntentTowerSimple() {
  console.log("👤 Testing User Intent Tower (Simple)...\n");

  try {
    // Initialize tower
    const tower = new UserIntentTower();
    console.log("✅ UserIntentTower initialized");

    // Test 1: Cold start intent (new user with no behavior)
    console.log("\\n🧪 Test 1: Cold Start Intent");
    const coldStartResult = await tower.computeUserIntent(
      "test-user-001",
      "session-001",
      {
        deviceType: "mobile",
        language: "en",
        location: "Lagos, Nigeria",
      }
    );

    console.log("Cold Start Results:");
    console.log(
      "  Embedding Dimension:",
      coldStartResult.userIntentEmbedding.length
    );
    console.log("  Intent Score:", coldStartResult.shortTermIntentScore);
    console.log("  Is Cold Start:", coldStartResult.coldStart || false);
    console.log(
      "  Mobile Device Signal:",
      coldStartResult.userIntentEmbedding[96]
    ); // Should be 1.0 for mobile
    console.log(
      "  English Language Signal:",
      coldStartResult.userIntentEmbedding[99]
    ); // Should be 1.0 for English

    // Test 2: Feature extraction with mock data
    console.log("\\n🧪 Test 2: Feature Extraction with Mock Data");

    // Create mock behavioral data
    const mockBehaviors = [
      {
        eventType: "search",
        searchQuery: "wireless headphones",
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        metadata: { category: "electronics" },
      },
      {
        eventType: "view",
        itemId: "item-001",
        timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        timeOnPage: 45,
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
      {
        eventType: "view",
        itemId: "item-002",
        timestamp: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
        timeOnPage: 30,
        metadata: { category: "electronics", brand: "JBL", price: 79.99 },
      },
      {
        eventType: "click",
        itemId: "item-001",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
      {
        eventType: "add_to_cart",
        itemId: "item-001",
        timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
    ];

    const mockSession = {
      sessionId: "mock-session",
      deviceType: "desktop",
      location: "Nairobi, Kenya",
      language: "en",
      startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      lastActivity: new Date(),
      totalViews: 5,
      totalClicks: 3,
      totalSearches: 2,
      sessionDuration: 900, // 15 minutes
      priceRangeInterest: null,
      categoryInterest: [],
      brandInterest: [],
    };

    // Test feature extraction directly
    const features = tower.extractBehaviorFeatures(mockBehaviors, mockSession, {
      deviceType: "desktop",
      language: "en",
      location: "Nairobi, Kenya",
    });

    console.log("Feature Extraction Results:");
    console.log("  Search Queries:", features.searchQueries.length);
    console.log("  Viewed Items:", features.viewedItems.size);
    console.log("  Clicked Items:", features.clickedItems.size);
    console.log("  Cart Items:", features.cartItems.size);
    console.log(
      "  Category Scores:",
      Array.from(features.categoryScores.entries())
    );
    console.log("  Brand Scores:", Array.from(features.brandScores.entries()));
    console.log("  Price Interest:", features.priceInterest);
    console.log("  Device Type:", features.deviceType);
    console.log("  Session Age (minutes):", features.sessionAge.toFixed(1));

    // Test 3: Embedding computation
    console.log("\\n🧪 Test 3: Embedding Computation");
    const embedding = tower.computeEmbedding(features);

    console.log("Embedding Analysis:");
    console.log("  Dimension:", embedding.length);

    // Analyze embedding segments
    const categorySegment = embedding.slice(0, 32);
    const brandSegment = embedding.slice(32, 64);
    const behavioralSegment = embedding.slice(64, 96);
    const contextualSegment = embedding.slice(96, 128);

    console.log(
      "  Category Segment (0-31) - Max:",
      Math.max(...categorySegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Brand Segment (32-63) - Max:",
      Math.max(...brandSegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Behavioral Segment (64-95) - Max:",
      Math.max(...behavioralSegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Contextual Segment (96-127) - Max:",
      Math.max(...contextualSegment.map(Math.abs)).toFixed(3)
    );

    // Check normalization
    const l2Norm = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    console.log("  L2 Norm:", l2Norm.toFixed(3), "(should be ~1.0)");

    // Test 4: Intent score computation
    console.log("\\n🧪 Test 4: Intent Score Computation");
    const intentScore = tower.computeIntentScore(features, embedding);
    const embeddingConfidence = tower.computeEmbeddingConfidence(embedding);

    console.log("Intent Scoring:");
    console.log("  Intent Score:", intentScore.toFixed(3));
    console.log("  Embedding Confidence:", embeddingConfidence.toFixed(3));

    // Test 5: Time decay functionality
    console.log("\\n🧪 Test 5: Time Decay Analysis");

    const now = new Date();
    const timePoints = [
      {
        label: "30 minutes ago",
        date: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        label: "2 hours ago",
        date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        label: "8 hours ago",
        date: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        label: "1 day ago",
        date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        label: "2 days ago",
        date: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
    ];

    console.log("Time Decay Weights:");
    for (const point of timePoints) {
      const weight = tower.getTimeWeight(point.date, now);
      console.log(`  ${point.label}: ${weight}`);
    }

    // Test 6: Different device/context scenarios
    console.log("\\n🧪 Test 6: Multi-Context Scenarios");

    const contexts = [
      { deviceType: "mobile", language: "en", location: "Lagos, Nigeria" },
      {
        deviceType: "desktop",
        language: "fr",
        location: "Casablanca, Morocco",
      },
      { deviceType: "tablet", language: "ar", location: "Cairo, Egypt" },
      { deviceType: "mobile", language: "en", location: "Nairobi, Kenya" },
    ];

    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      const intent = await tower.computeUserIntent(
        `user-${i + 1}`,
        `session-${i + 1}`,
        context
      );

      console.log(
        `Context ${i + 1} (${context.deviceType}, ${context.language}):`
      );
      console.log(`  Intent Score: ${intent.shortTermIntentScore.toFixed(3)}`);
      console.log(
        `  Device Signal: ${intent.userIntentEmbedding[96].toFixed(
          3
        )} (mobile), ${intent.userIntentEmbedding[97].toFixed(
          3
        )} (desktop), ${intent.userIntentEmbedding[98].toFixed(3)} (tablet)`
      );
      console.log(
        `  Language Signals: EN=${intent.userIntentEmbedding[99].toFixed(
          3
        )}, FR=${intent.userIntentEmbedding[100].toFixed(
          3
        )}, AR=${intent.userIntentEmbedding[101].toFixed(3)}`
      );
    }

    console.log(
      "\\n🎉 All UserIntentTower simple tests completed successfully!"
    );

    return {
      success: true,
      tests: 6,
      results: {
        coldStart: coldStartResult,
        features: features,
        embedding: {
          dimension: embedding.length,
          l2Norm: l2Norm,
          segments: {
            category: Math.max(...categorySegment.map(Math.abs)),
            brand: Math.max(...brandSegment.map(Math.abs)),
            behavioral: Math.max(...behavioralSegment.map(Math.abs)),
            contextual: Math.max(...contextualSegment.map(Math.abs)),
          },
        },
        intentScore: intentScore,
        embeddingConfidence: embeddingConfidence,
      },
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  testUserIntentTowerSimple()
    .then((result) => {
      if (result.success) {
        console.log("\\n✅ All tests passed!");
        console.log("📊 Test Summary:");
        console.log(`   - Tests Run: ${result.tests}`);
        console.log(
          `   - Embedding Dimension: ${result.results.embedding.dimension}`
        );
        console.log(
          `   - L2 Norm: ${result.results.embedding.l2Norm.toFixed(3)}`
        );
        console.log(
          `   - Intent Score: ${result.results.intentScore.toFixed(3)}`
        );
        console.log(
          `   - Embedding Confidence: ${result.results.embeddingConfidence.toFixed(
            3
          )}`
        );
        console.log(
          `   - Feature Categories: ${Array.from(
            result.results.features.categoryScores.keys()
          ).join(", ")}`
        );
        console.log(
          `   - Feature Brands: ${Array.from(
            result.results.features.brandScores.keys()
          ).join(", ")}`
        );
      } else {
        console.log("\\n❌ Tests failed:", result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = testUserIntentTowerSimple;
