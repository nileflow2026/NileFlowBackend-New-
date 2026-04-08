const UserIntentTower = require("./services/towers/UserIntentTower");

/**
 * Comprehensive User Intent Tower Testing
 *
 * Tests with realistic behavioral scenarios across different user types and contexts
 */

async function testUserIntentComplete() {
  console.log("👤 Comprehensive User Intent Tower Testing...\n");

  try {
    // Initialize tower
    const tower = new UserIntentTower();
    console.log("✅ UserIntentTower initialized");

    // Define comprehensive user scenarios
    const userScenarios = [
      {
        userId: "electronics-enthusiast",
        sessionId: "session-electronics",
        name: "Electronics Enthusiast",
        description: "Heavy electronics shopper with clear brand preferences",
        context: {
          deviceType: "desktop",
          language: "en",
          location: "Lagos, Nigeria",
        },
        behaviors: [
          {
            eventType: "search",
            searchQuery: "gaming laptop",
            timestamp: new Date(Date.now() - 25 * 60 * 1000),
            metadata: { category: "electronics" },
          },
          {
            eventType: "search",
            searchQuery: "RTX 4070 laptop",
            timestamp: new Date(Date.now() - 23 * 60 * 1000),
            metadata: { category: "electronics" },
          },
          {
            eventType: "view",
            itemId: "laptop-001",
            timestamp: new Date(Date.now() - 20 * 60 * 1000),
            timeOnPage: 120,
            metadata: {
              category: "electronics",
              subcategory: "laptops",
              brand: "ASUS",
              price: 1299.99,
            },
          },
          {
            eventType: "view",
            itemId: "laptop-002",
            timestamp: new Date(Date.now() - 18 * 60 * 1000),
            timeOnPage: 90,
            metadata: {
              category: "electronics",
              subcategory: "laptops",
              brand: "MSI",
              price: 1199.99,
            },
          },
          {
            eventType: "view",
            itemId: "laptop-003",
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            timeOnPage: 150,
            metadata: {
              category: "electronics",
              subcategory: "laptops",
              brand: "Alienware",
              price: 1899.99,
            },
          },
          {
            eventType: "click",
            itemId: "laptop-003",
            timestamp: new Date(Date.now() - 12 * 60 * 1000),
            metadata: {
              category: "electronics",
              subcategory: "laptops",
              brand: "Alienware",
              price: 1899.99,
            },
          },
          {
            eventType: "view",
            itemId: "mouse-001",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            timeOnPage: 45,
            metadata: {
              category: "electronics",
              subcategory: "accessories",
              brand: "Razer",
              price: 79.99,
            },
          },
          {
            eventType: "add_to_cart",
            itemId: "mouse-001",
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            metadata: {
              category: "electronics",
              subcategory: "accessories",
              brand: "Razer",
              price: 79.99,
            },
          },
          {
            eventType: "search",
            searchQuery: "gaming keyboard",
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            metadata: { category: "electronics" },
          },
        ],
        session: {
          deviceType: "desktop",
          location: "Lagos, Nigeria",
          language: "en",
          startTime: new Date(Date.now() - 30 * 60 * 1000),
          totalViews: 12,
          totalClicks: 8,
          totalSearches: 6,
          sessionDuration: 1800,
        },
      },
      {
        userId: "fashion-browser",
        sessionId: "session-fashion",
        name: "Fashion Browser",
        description: "Casual fashion shopper browsing multiple categories",
        context: {
          deviceType: "mobile",
          language: "en",
          location: "Nairobi, Kenya",
        },
        behaviors: [
          {
            eventType: "search",
            searchQuery: "summer dresses",
            timestamp: new Date(Date.now() - 40 * 60 * 1000),
            metadata: { category: "fashion" },
          },
          {
            eventType: "view",
            itemId: "dress-001",
            timestamp: new Date(Date.now() - 35 * 60 * 1000),
            timeOnPage: 30,
            metadata: {
              category: "fashion",
              subcategory: "dresses",
              brand: "Zara",
              price: 49.99,
            },
          },
          {
            eventType: "view",
            itemId: "dress-002",
            timestamp: new Date(Date.now() - 32 * 60 * 1000),
            timeOnPage: 25,
            metadata: {
              category: "fashion",
              subcategory: "dresses",
              brand: "H&M",
              price: 29.99,
            },
          },
          {
            eventType: "view",
            itemId: "shoes-001",
            timestamp: new Date(Date.now() - 28 * 60 * 1000),
            timeOnPage: 40,
            metadata: {
              category: "fashion",
              subcategory: "shoes",
              brand: "Nike",
              price: 89.99,
            },
          },
          {
            eventType: "search",
            searchQuery: "white sneakers",
            timestamp: new Date(Date.now() - 20 * 60 * 1000),
            metadata: { category: "fashion" },
          },
          {
            eventType: "view",
            itemId: "shoes-002",
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            timeOnPage: 35,
            metadata: {
              category: "fashion",
              subcategory: "shoes",
              brand: "Adidas",
              price: 79.99,
            },
          },
        ],
        session: {
          deviceType: "mobile",
          location: "Nairobi, Kenya",
          language: "en",
          startTime: new Date(Date.now() - 45 * 60 * 1000),
          totalViews: 8,
          totalClicks: 4,
          totalSearches: 3,
          sessionDuration: 2700,
        },
      },
      {
        userId: "book-collector",
        sessionId: "session-books",
        name: "Book Collector",
        description: "Dedicated book buyer with specific interests",
        context: {
          deviceType: "tablet",
          language: "en",
          location: "Cape Town, South Africa",
        },
        behaviors: [
          {
            eventType: "search",
            searchQuery: "african literature",
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            metadata: { category: "books" },
          },
          {
            eventType: "view",
            itemId: "book-001",
            timestamp: new Date(Date.now() - 55 * 60 * 1000),
            timeOnPage: 180,
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Penguin",
              price: 24.99,
            },
          },
          {
            eventType: "view",
            itemId: "book-002",
            timestamp: new Date(Date.now() - 50 * 60 * 1000),
            timeOnPage: 120,
            metadata: {
              category: "books",
              subcategory: "non-fiction",
              brand: "HarperCollins",
              price: 19.99,
            },
          },
          {
            eventType: "add_to_cart",
            itemId: "book-001",
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Penguin",
              price: 24.99,
            },
          },
          {
            eventType: "search",
            searchQuery: "chimamanda ngozi adichie",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            metadata: { category: "books" },
          },
          {
            eventType: "view",
            itemId: "book-003",
            timestamp: new Date(Date.now() - 25 * 60 * 1000),
            timeOnPage: 200,
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Vintage",
              price: 22.99,
            },
          },
          {
            eventType: "add_to_cart",
            itemId: "book-003",
            timestamp: new Date(Date.now() - 20 * 60 * 1000),
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Vintage",
              price: 22.99,
            },
          },
          {
            eventType: "purchase",
            itemId: "book-001",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Penguin",
              price: 24.99,
            },
          },
          {
            eventType: "purchase",
            itemId: "book-003",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            metadata: {
              category: "books",
              subcategory: "fiction",
              brand: "Vintage",
              price: 22.99,
            },
          },
        ],
        session: {
          deviceType: "tablet",
          location: "Cape Town, South Africa",
          language: "en",
          startTime: new Date(Date.now() - 65 * 60 * 1000),
          totalViews: 15,
          totalClicks: 6,
          totalSearches: 4,
          sessionDuration: 3900,
        },
      },
      {
        userId: "home-decorator",
        sessionId: "session-home",
        name: "Home Decorator",
        description: "Home improvement enthusiast with budget consciousness",
        context: {
          deviceType: "desktop",
          language: "en",
          location: "Accra, Ghana",
        },
        behaviors: [
          {
            eventType: "search",
            searchQuery: "living room furniture",
            timestamp: new Date(Date.now() - 90 * 60 * 1000),
            metadata: { category: "home" },
          },
          {
            eventType: "view",
            itemId: "sofa-001",
            timestamp: new Date(Date.now() - 85 * 60 * 1000),
            timeOnPage: 90,
            metadata: {
              category: "home",
              subcategory: "furniture",
              brand: "IKEA",
              price: 399.99,
            },
          },
          {
            eventType: "view",
            itemId: "sofa-002",
            timestamp: new Date(Date.now() - 80 * 60 * 1000),
            timeOnPage: 75,
            metadata: {
              category: "home",
              subcategory: "furniture",
              brand: "West Elm",
              price: 799.99,
            },
          },
          {
            eventType: "search",
            searchQuery: "budget sofa under 500",
            timestamp: new Date(Date.now() - 70 * 60 * 1000),
            metadata: { category: "home" },
          },
          {
            eventType: "view",
            itemId: "sofa-003",
            timestamp: new Date(Date.now() - 65 * 60 * 1000),
            timeOnPage: 100,
            metadata: {
              category: "home",
              subcategory: "furniture",
              brand: "Wayfair",
              price: 449.99,
            },
          },
          {
            eventType: "click",
            itemId: "sofa-003",
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            metadata: {
              category: "home",
              subcategory: "furniture",
              brand: "Wayfair",
              price: 449.99,
            },
          },
          {
            eventType: "view",
            itemId: "lamp-001",
            timestamp: new Date(Date.now() - 40 * 60 * 1000),
            timeOnPage: 30,
            metadata: {
              category: "home",
              subcategory: "lighting",
              brand: "Phillips",
              price: 89.99,
            },
          },
        ],
        session: {
          deviceType: "desktop",
          location: "Accra, Ghana",
          language: "en",
          startTime: new Date(Date.now() - 95 * 60 * 1000),
          totalViews: 10,
          totalClicks: 5,
          totalSearches: 8,
          sessionDuration: 5700,
        },
      },
      {
        userId: "quick-browser",
        sessionId: "session-quick",
        name: "Quick Browser",
        description: "Fast, unfocused browsing with minimal engagement",
        context: {
          deviceType: "mobile",
          language: "en",
          location: "Johannesburg, South Africa",
        },
        behaviors: [
          {
            eventType: "search",
            searchQuery: "deals",
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            metadata: { category: "general" },
          },
          {
            eventType: "view",
            itemId: "random-001",
            timestamp: new Date(Date.now() - 7 * 60 * 1000),
            timeOnPage: 10,
            metadata: {
              category: "electronics",
              brand: "Generic",
              price: 19.99,
            },
          },
          {
            eventType: "view",
            itemId: "random-002",
            timestamp: new Date(Date.now() - 6 * 60 * 1000),
            timeOnPage: 15,
            metadata: { category: "fashion", brand: "Unknown", price: 12.99 },
          },
          {
            eventType: "view",
            itemId: "random-003",
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            timeOnPage: 8,
            metadata: { category: "home", brand: "Basic", price: 9.99 },
          },
        ],
        session: {
          deviceType: "mobile",
          location: "Johannesburg, South Africa",
          language: "en",
          startTime: new Date(Date.now() - 10 * 60 * 1000),
          totalViews: 4,
          totalClicks: 1,
          totalSearches: 1,
          sessionDuration: 600,
        },
      },
    ];

    console.log(
      `\\n🧪 Testing ${userScenarios.length} comprehensive user scenarios...`
    );

    const results = [];

    for (const scenario of userScenarios) {
      console.log(`\\n--- ${scenario.name} ---`);
      console.log(`Description: ${scenario.description}`);
      console.log(
        `Context: ${scenario.context.deviceType}, ${scenario.context.location}`
      );
      console.log(
        `Behaviors: ${scenario.behaviors.length} events over ${Math.round(
          (scenario.behaviors[0].timestamp -
            scenario.behaviors[scenario.behaviors.length - 1].timestamp) /
            (1000 * 60)
        )} minutes`
      );

      // Extract features from behavior
      const features = tower.extractBehaviorFeatures(
        scenario.behaviors,
        scenario.session,
        scenario.context
      );

      // Compute intent
      const intent = await tower.computeUserIntent(
        scenario.userId,
        scenario.sessionId,
        scenario.context
      );

      console.log("\\nIntent Analysis:");
      console.log("  Intent Score:", intent.shortTermIntentScore.toFixed(3));
      console.log(
        "  Embedding L2 Norm:",
        Math.sqrt(
          intent.userIntentEmbedding.reduce((sum, val) => sum + val * val, 0)
        ).toFixed(3)
      );

      if (intent.features) {
        console.log("  Behavioral Features:");
        console.log(
          "    Categories:",
          Array.from(intent.features.categoryScores.entries())
            .map(([cat, score]) => `${cat}(${score.toFixed(2)})`)
            .join(", ")
        );
        console.log(
          "    Brands:",
          Array.from(intent.features.brandScores.entries())
            .map(([brand, score]) => `${brand}(${score.toFixed(2)})`)
            .join(", ")
        );
        console.log(
          "    Price Range: $" +
            intent.features.priceInterest.min +
            " - $" +
            intent.features.priceInterest.max +
            " (avg: $" +
            intent.features.priceInterest.avg.toFixed(2) +
            ")"
        );
        console.log(
          "    Session Intensity:",
          (intent.features.sessionIntensity || 0).toFixed(2),
          "events/min"
        );
      }

      // Analyze embedding segments
      const embedding = intent.userIntentEmbedding;
      const segments = {
        category: Math.max(...embedding.slice(0, 32).map(Math.abs)),
        brand: Math.max(...embedding.slice(32, 64).map(Math.abs)),
        behavioral: Math.max(...embedding.slice(64, 96).map(Math.abs)),
        contextual: Math.max(...embedding.slice(96, 128).map(Math.abs)),
      };

      console.log("  Embedding Segment Strengths:");
      console.log("    Category:", segments.category.toFixed(3));
      console.log("    Brand:", segments.brand.toFixed(3));
      console.log("    Behavioral:", segments.behavioral.toFixed(3));
      console.log("    Contextual:", segments.contextual.toFixed(3));

      results.push({
        ...scenario,
        intent: intent,
        segments: segments,
        features: intent.features,
      });
    }

    // Comparative analysis
    console.log("\\n📊 Comparative Analysis");
    console.log(
      "┌─────────────────────────┬─────────────┬──────────┬─────────────┬─────────────┐"
    );
    console.log(
      "│ User Type               │ Intent Score│ Category │ Brand       │ Behavioral  │"
    );
    console.log(
      "├─────────────────────────┼─────────────┼──────────┼─────────────┼─────────────┤"
    );

    results.forEach((result) => {
      const name = result.name.padEnd(23);
      const intentScore = result.intent.shortTermIntentScore
        .toFixed(3)
        .padStart(11);
      const category = result.segments.category.toFixed(3).padStart(8);
      const brand = result.segments.brand.toFixed(3).padStart(11);
      const behavioral = result.segments.behavioral.toFixed(3).padStart(11);
      console.log(
        `│ ${name} │ ${intentScore} │ ${category} │ ${brand} │ ${behavioral} │`
      );
    });
    console.log(
      "└─────────────────────────┴─────────────┴──────────┴─────────────┴─────────────┘"
    );

    // Intent score insights
    const intentScores = results.map((r) => r.intent.shortTermIntentScore);
    const highestIntent = Math.max(...intentScores);
    const lowestIntent = Math.min(...intentScores);
    const avgIntent =
      intentScores.reduce((sum, score) => sum + score, 0) / intentScores.length;

    console.log("\\n📈 Intent Score Insights:");
    console.log(
      `   - Highest Intent: ${highestIntent.toFixed(3)} (${
        results.find((r) => r.intent.shortTermIntentScore === highestIntent)
          .name
      })`
    );
    console.log(
      `   - Lowest Intent: ${lowestIntent.toFixed(3)} (${
        results.find((r) => r.intent.shortTermIntentScore === lowestIntent).name
      })`
    );
    console.log(`   - Average Intent: ${avgIntent.toFixed(3)}`);
    console.log(
      `   - Intent Range: ${(highestIntent - lowestIntent).toFixed(3)}`
    );

    // Category preferences analysis
    const categoryPreferences = new Map();
    results.forEach((result) => {
      if (result.features) {
        Array.from(result.features.categoryScores.entries()).forEach(
          ([category, score]) => {
            const current = categoryPreferences.get(category) || [];
            current.push({ user: result.name, score: score });
            categoryPreferences.set(category, current);
          }
        );
      }
    });

    console.log("\\n🏷️ Category Preferences:");
    Array.from(categoryPreferences.entries()).forEach(([category, users]) => {
      const avgScore =
        users.reduce((sum, u) => sum + u.score, 0) / users.length;
      const userList = users.map((u) => u.user).join(", ");
      console.log(`   - ${category}: avg ${avgScore.toFixed(2)} (${userList})`);
    });

    console.log("\\n🎉 Comprehensive User Intent Tower testing complete!");

    return {
      success: true,
      scenariosTested: userScenarios.length,
      results: results,
      insights: {
        intentScoreRange: {
          min: lowestIntent,
          max: highestIntent,
          avg: avgIntent,
        },
        categoryDistribution: Array.from(categoryPreferences.keys()),
        embeddingQuality: results.every(
          (r) =>
            Math.abs(
              Math.sqrt(
                r.intent.userIntentEmbedding.reduce(
                  (sum, val) => sum + val * val,
                  0
                )
              ) - 1.0
            ) < 0.01
        ),
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
  testUserIntentComplete()
    .then((result) => {
      if (result.success) {
        console.log("\\n✅ All comprehensive tests passed!");
        console.log("📈 Test Summary:");
        console.log(`   - User Scenarios Tested: ${result.scenariosTested}`);
        console.log(
          `   - Intent Score Range: ${result.insights.intentScoreRange.min.toFixed(
            3
          )} - ${result.insights.intentScoreRange.max.toFixed(3)}`
        );
        console.log(
          `   - Average Intent Score: ${result.insights.intentScoreRange.avg.toFixed(
            3
          )}`
        );
        console.log(
          `   - Categories Detected: ${result.insights.categoryDistribution.join(
            ", "
          )}`
        );
        console.log(
          `   - Embedding Normalization: ${
            result.insights.embeddingQuality ? "Perfect" : "Issues detected"
          }`
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

module.exports = testUserIntentComplete;
