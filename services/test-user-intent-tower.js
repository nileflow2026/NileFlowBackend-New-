const UserIntentTower = require("./services/towers/UserIntentTower");

/**
 * Test User Intent Tower Basic Functionality
 *
 * Tests core intent computation, embedding generation, and behavioral analysis
 */

async function testUserIntentTower() {
  console.log("👤 Testing User Intent Tower...\n");

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

    // Test 2: Session creation and tracking
    console.log("\\n🧪 Test 2: Session Creation and Behavior Tracking");

    await tower.createOrUpdateSession(
      "test-user-002",
      "session-002",
      "desktop",
      "Nairobi, Kenya",
      "en"
    );
    console.log("✅ Session created");

    // Track some behavior events
    const behaviorEvents = [
      {
        eventType: "search",
        searchQuery: "wireless headphones",
        metadata: { category: "electronics" },
      },
      {
        eventType: "view",
        itemId: "item-001",
        timeOnPage: 45,
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
      {
        eventType: "view",
        itemId: "item-002",
        timeOnPage: 30,
        metadata: { category: "electronics", brand: "JBL", price: 79.99 },
      },
      {
        eventType: "click",
        itemId: "item-001",
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
      {
        eventType: "add_to_cart",
        itemId: "item-001",
        metadata: { category: "electronics", brand: "Sony", price: 89.99 },
      },
      {
        eventType: "search",
        searchQuery: "bluetooth speakers",
        metadata: { category: "electronics" },
      },
    ];

    for (const event of behaviorEvents) {
      await tower.trackBehavior(
        "test-user-002",
        "session-002",
        event.eventType,
        event
      );
      console.log(
        `📝 Tracked: ${event.eventType} - ${
          event.searchQuery || event.itemId || "N/A"
        }`
      );

      // Small delay between events
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Test 3: Intent computation with behavior data
    console.log("\\n🧪 Test 3: Intent Computation with Behavioral Data");
    const intentResult = await tower.computeUserIntent(
      "test-user-002",
      "session-002",
      {
        deviceType: "desktop",
        language: "en",
        location: "Nairobi, Kenya",
      }
    );

    console.log("Intent Analysis Results:");
    console.log(
      "  Embedding Dimension:",
      intentResult.userIntentEmbedding.length
    );
    console.log(
      "  Intent Score:",
      intentResult.shortTermIntentScore.toFixed(3)
    );
    console.log("  Has Features:", !!intentResult.features);

    if (intentResult.features) {
      console.log("\\n  Feature Analysis:");
      console.log(
        "    Search Queries:",
        intentResult.features.searchQueries.length
      );
      console.log("    Viewed Items:", intentResult.features.viewedItems.size);
      console.log(
        "    Clicked Items:",
        intentResult.features.clickedItems.size
      );
      console.log("    Cart Items:", intentResult.features.cartItems.size);
      console.log(
        "    Category Scores:",
        Array.from(intentResult.features.categoryScores.entries())
      );
      console.log(
        "    Brand Scores:",
        Array.from(intentResult.features.brandScores.entries())
      );
      console.log("    Price Interest:", intentResult.features.priceInterest);
      console.log("    Device Type:", intentResult.features.deviceType);
      console.log(
        "    Session Age (minutes):",
        intentResult.features.sessionAge.toFixed(1)
      );
    }

    // Test 4: Embedding analysis
    console.log("\\n🧪 Test 4: Embedding Analysis");
    const embedding = intentResult.userIntentEmbedding;

    // Analyze embedding segments
    const categorySegment = embedding.slice(0, 32);
    const brandSegment = embedding.slice(32, 64);
    const behavioralSegment = embedding.slice(64, 96);
    const contextualSegment = embedding.slice(96, 128);

    console.log("Embedding Segments:");
    console.log(
      "  Category (0-31) - Max:",
      Math.max(...categorySegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Brand (32-63) - Max:",
      Math.max(...brandSegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Behavioral (64-95) - Max:",
      Math.max(...behavioralSegment.map(Math.abs)).toFixed(3)
    );
    console.log(
      "  Contextual (96-127) - Max:",
      Math.max(...contextualSegment.map(Math.abs)).toFixed(3)
    );

    // Check if embedding is normalized (L2 norm should be ~1.0)
    const l2Norm = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    console.log("  L2 Norm:", l2Norm.toFixed(3), "(should be ~1.0)");

    // Test 5: Time decay functionality
    console.log("\\n🧪 Test 5: Time Decay Testing");

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentWeight = tower.getTimeWeight(oneHourAgo, now);
    const mediumWeight = tower.getTimeWeight(sixHoursAgo, now);
    const oldWeight = tower.getTimeWeight(oneDayAgo, now);

    console.log("Time Decay Weights:");
    console.log("  1 hour ago:", recentWeight);
    console.log("  6 hours ago:", mediumWeight);
    console.log("  24 hours ago:", oldWeight);

    // Test 6: Multiple user comparison
    console.log("\\n🧪 Test 6: Multiple User Scenario");

    const userScenarios = [
      {
        userId: "mobile-shopper",
        sessionId: "mobile-session",
        context: {
          deviceType: "mobile",
          language: "en",
          location: "Lagos, Nigeria",
        },
        scenario: "Mobile electronics shopper",
      },
      {
        userId: "fashion-browser",
        sessionId: "fashion-session",
        context: {
          deviceType: "desktop",
          language: "fr",
          location: "Casablanca, Morocco",
        },
        scenario: "Desktop fashion browser",
      },
      {
        userId: "book-lover",
        sessionId: "book-session",
        context: {
          deviceType: "tablet",
          language: "en",
          location: "Cape Town, South Africa",
        },
        scenario: "Tablet book enthusiast",
      },
    ];

    for (const user of userScenarios) {
      const intent = await tower.computeUserIntent(
        user.userId,
        user.sessionId,
        user.context
      );
      console.log(`${user.scenario}:`);
      console.log(`  Intent Score: ${intent.shortTermIntentScore.toFixed(3)}`);
      console.log(
        `  Embedding L2 Norm: ${Math.sqrt(
          intent.userIntentEmbedding.reduce((sum, val) => sum + val * val, 0)
        ).toFixed(3)}`
      );
    }

    console.log("\\n🎉 All UserIntentTower tests completed successfully!");

    return {
      success: true,
      tests: 6,
      results: {
        coldStart: coldStartResult,
        withBehavior: intentResult,
        timeDecayWeights: { recentWeight, mediumWeight, oldWeight },
        embeddingAnalysis: {
          dimension: embedding.length,
          l2Norm: l2Norm,
          segments: {
            category: Math.max(...categorySegment.map(Math.abs)),
            brand: Math.max(...brandSegment.map(Math.abs)),
            behavioral: Math.max(...behavioralSegment.map(Math.abs)),
            contextual: Math.max(...contextualSegment.map(Math.abs)),
          },
        },
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
  testUserIntentTower()
    .then((result) => {
      if (result.success) {
        console.log("\\n✅ All tests passed!");
        console.log("📊 Test Summary:");
        console.log(
          `   - Embedding Dimension: ${result.results.embeddingAnalysis.dimension}`
        );
        console.log(
          `   - L2 Norm: ${result.results.embeddingAnalysis.l2Norm.toFixed(3)}`
        );
        console.log(
          `   - Intent Score Range: ${result.results.coldStart.shortTermIntentScore.toFixed(
            3
          )} - ${result.results.withBehavior.shortTermIntentScore.toFixed(3)}`
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

module.exports = testUserIntentTower;
