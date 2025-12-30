const SocialProofTrustTower = require("./services/towers/SocialProofTrustTower");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");

/**
 * Comprehensive Social Proof Trust Tower Testing
 *
 * Tests with real database integration and sample social signals data
 */

async function testSocialProofTrustComplete() {
  console.log("🏢 Comprehensive Social Proof Trust Tower Testing...\n");

  const DATABASE_ID = env.APPWRITE_DATABASE_ID;

  try {
    // Initialize tower
    const tower = new SocialProofTrustTower();
    console.log("✅ SocialProofTrustTower initialized");

    // Create sample social signals data
    const sampleItems = [
      {
        itemId: "spt-item-001",
        name: "Premium Wireless Headphones",
        scenario: "Excellent Product",
        data: {
          itemId: "spt-item-001",
          isActive: true,
          // Excellent reviews
          totalReviews: 127,
          averageRating: 4.6,
          rating5Star: 75,
          rating4Star: 35,
          rating3Star: 15,
          rating2Star: 2,
          rating1Star: 0,
          // Strong sales
          totalPurchases: 450,
          purchaseVelocity: 8.5, // Hot item
          recentPurchases24h: 18,
          recentPurchases7d: 62,
          // Low risk
          returnRate: 0.04,
          refundRate: 0.01,
          fraudFlags: 0,
          // Trusted seller
          sellerTrustScore: 0.92,
          sellerResponseTime: 2.5,
          sellerRating: 4.8,
          // Computed scores (to be updated)
          trustScore: 0.5,
          riskPenalty: 0,
          socialProofBoost: 1.0,
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        itemId: "spt-item-002",
        name: "Budget Phone Case",
        scenario: "Average Product with Mixed Reviews",
        data: {
          itemId: "spt-item-002",
          isActive: true,
          // Mixed reviews
          totalReviews: 34,
          averageRating: 3.8,
          rating5Star: 12,
          rating4Star: 10,
          rating3Star: 8,
          rating2Star: 3,
          rating1Star: 1,
          // Moderate sales
          totalPurchases: 85,
          purchaseVelocity: 2.1, // Steady
          recentPurchases24h: 3,
          recentPurchases7d: 15,
          // Moderate risk
          returnRate: 0.12,
          refundRate: 0.08,
          fraudFlags: 0,
          // Average seller
          sellerTrustScore: 0.63,
          sellerResponseTime: 12,
          sellerRating: 3.9,
          trustScore: 0.5,
          riskPenalty: 0,
          socialProofBoost: 1.0,
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        itemId: "spt-item-003",
        name: "Suspicious Gadget",
        scenario: "High Risk with Fake Reviews",
        data: {
          itemId: "spt-item-003",
          isActive: true,
          // Suspicious review pattern
          totalReviews: 15,
          averageRating: 4.9,
          rating5Star: 14, // 93% 5-star (suspicious)
          rating4Star: 0,
          rating3Star: 0,
          rating2Star: 0,
          rating1Star: 1,
          // Unusual velocity for low reviews
          totalPurchases: 200,
          purchaseVelocity: 45, // Viral but suspicious
          recentPurchases24h: 55,
          recentPurchases7d: 180,
          // High risk indicators
          returnRate: 0.35,
          refundRate: 0.28,
          fraudFlags: 3,
          // Untrusted seller
          sellerTrustScore: 0.25,
          sellerResponseTime: 72,
          sellerRating: 2.1,
          trustScore: 0.5,
          riskPenalty: 0,
          socialProofBoost: 1.0,
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        itemId: "spt-item-004",
        name: "New Product Launch",
        scenario: "New Item with No Social Proof",
        data: {
          itemId: "spt-item-004",
          isActive: true,
          // No reviews yet
          totalReviews: 0,
          averageRating: 0,
          rating5Star: 0,
          rating4Star: 0,
          rating3Star: 0,
          rating2Star: 0,
          rating1Star: 0,
          // Low sales
          totalPurchases: 2,
          purchaseVelocity: 0.3,
          recentPurchases24h: 1,
          recentPurchases7d: 2,
          // Unknown risk
          returnRate: 0,
          refundRate: 0,
          fraudFlags: 0,
          // New seller
          sellerTrustScore: 0.5,
          sellerResponseTime: 8,
          sellerRating: 0,
          trustScore: 0.5,
          riskPenalty: 0,
          socialProofBoost: 1.0,
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        itemId: "spt-item-005",
        name: "Viral Trending Item",
        scenario: "Viral Product with High Social Proof",
        data: {
          itemId: "spt-item-005",
          isActive: true,
          // Good reviews with high volume
          totalReviews: 89,
          averageRating: 4.4,
          rating5Star: 42,
          rating4Star: 28,
          rating3Star: 15,
          rating2Star: 3,
          rating1Star: 1,
          // Viral sales
          totalPurchases: 1200,
          purchaseVelocity: 150, // Viral
          recentPurchases24h: 180,
          recentPurchases7d: 780,
          // Acceptable risk
          returnRate: 0.06,
          refundRate: 0.03,
          fraudFlags: 0,
          // Good seller
          sellerTrustScore: 0.78,
          sellerResponseTime: 4,
          sellerRating: 4.2,
          trustScore: 0.5,
          riskPenalty: 0,
          socialProofBoost: 1.0,
          lastUpdated: new Date().toISOString(),
        },
      },
    ];

    // Insert sample data into database
    console.log("📊 Inserting sample social signals data...");

    const insertedIds = [];

    for (const item of sampleItems) {
      try {
        const doc = await db.createDocument(
          DATABASE_ID,
          "item_social_signals",
          "unique()",
          item.data
        );
        insertedIds.push(doc.$id);
        console.log(`✅ Inserted ${item.name} (${item.scenario})`);
      } catch (error) {
        console.error(`❌ Error inserting ${item.name}:`, error.message);
      }
    }

    console.log(
      `\\n🧪 Testing trust computation with ${sampleItems.length} items...`
    );

    // Test trust computation for each item
    for (const item of sampleItems) {
      console.log(`\\n--- ${item.name} (${item.scenario}) ---`);

      const trust = await tower.computeTrustAndRisk(item.itemId);

      console.log("Trust Analysis:");
      console.log("  Trust Score:", trust.trustScore.toFixed(3));
      console.log("  Risk Penalty:", trust.riskPenalty.toFixed(3));
      console.log("  Social Proof Level:", trust.socialProof.level);
      console.log("  Messages:", trust.socialProof.messages);
      console.log("  Trust Indicators:", trust.socialProof.trustIndicators);
      console.log("  Badges:", trust.socialProof.badges);
      console.log("  Urgency:", trust.socialProof.urgency);

      if (trust.analysis) {
        console.log("\\n  Review Quality:", trust.analysis.reviews.quality);
        console.log("  Velocity Tier:", trust.analysis.velocity.tier);
        console.log("  Seller Trust:", trust.analysis.seller.trustLevel);
        console.log("  Fraud Risk:", trust.analysis.fraud.riskLevel);

        if (trust.analysis.reviews.flags.length > 0) {
          console.log("  ⚠️  Review Flags:", trust.analysis.reviews.flags);
        }

        if (trust.analysis.fraud.indicators.length > 0) {
          console.log(
            "  🚨 Fraud Indicators:",
            trust.analysis.fraud.indicators
          );
        }
      }
    }

    // Test batch processing
    console.log("\\n🚀 Testing batch trust computation...");
    const itemIds = sampleItems.map((item) => item.itemId);
    const batchResults = await tower.computeBatchTrust(itemIds);

    console.log("Batch Results Summary:");
    batchResults.forEach((trust, itemId) => {
      const item = sampleItems.find((i) => i.itemId === itemId);
      console.log(
        `  ${itemId}: Trust=${trust.trustScore.toFixed(
          3
        )}, Risk=${trust.riskPenalty.toFixed(3)} (${
          item?.scenario || "Unknown"
        })`
      );
    });

    // Test real-time updates
    console.log("\\n📈 Testing real-time review update...");
    await tower.handleNewReview("spt-item-001", 5, {
      reviewText: "Amazing product, highly recommended!",
      verified: true,
    });

    // Recompute trust after new review
    const updatedTrust = await tower.computeTrustAndRisk("spt-item-001");
    console.log(
      "Updated trust after new 5-star review:",
      updatedTrust.trustScore.toFixed(3)
    );

    // Test purchase update
    console.log("\\n🛒 Testing real-time purchase update...");
    await tower.handleNewPurchase("spt-item-005", {
      purchaseAmount: 29.99,
      userId: "user-123",
    });

    const updatedViral = await tower.computeTrustAndRisk("spt-item-005");
    console.log(
      "Updated viral item social proof:",
      updatedViral.socialProof.messages
    );

    // Summary comparison
    console.log("\\n📊 Trust Score Summary:");
    console.log(
      "┌─────────────────────────────────────────────────────────────┐"
    );
    console.log(
      "│ Item                    │ Trust Score │ Risk │ Social Proof │"
    );
    console.log(
      "├─────────────────────────────────────────────────────────────┤"
    );

    for (const item of sampleItems) {
      const trust = batchResults.get(item.itemId);
      const name = item.name.padEnd(23);
      const score = trust.trustScore.toFixed(3).padStart(11);
      const risk = trust.riskPenalty.toFixed(3).padStart(4);
      const proof = trust.socialProof.level.padEnd(12);
      console.log(`│ ${name} │ ${score} │ ${risk} │ ${proof} │`);
    }
    console.log(
      "└─────────────────────────────────────────────────────────────┘"
    );

    console.log(
      "\\n🎉 Comprehensive Social Proof Trust Tower testing complete!"
    );

    // Cleanup: Remove test data
    console.log("\\n🧹 Cleaning up test data...");
    for (const docId of insertedIds) {
      try {
        await db.deleteDocument(DATABASE_ID, "item_social_signals", docId);
      } catch (error) {
        console.error(`Error deleting ${docId}:`, error.message);
      }
    }
    console.log("✅ Cleanup complete");

    return {
      success: true,
      testedItems: sampleItems.length,
      insights: {
        highestTrust: Math.max(
          ...Array.from(batchResults.values()).map((t) => t.trustScore)
        ),
        highestRisk: Math.max(
          ...Array.from(batchResults.values()).map((t) => t.riskPenalty)
        ),
        fraudDetected: Array.from(batchResults.values()).some(
          (t) => t.analysis?.fraud?.hasFraud
        ),
        viralItems: Array.from(batchResults.values()).filter(
          (t) => t.socialProof.level === "viral"
        ).length,
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
  testSocialProofTrustComplete()
    .then((result) => {
      if (result.success) {
        console.log("\\n✅ All comprehensive tests passed!");
        console.log("📈 Test Insights:");
        console.log(
          `   - Tested ${result.testedItems} different item scenarios`
        );
        console.log(
          `   - Highest trust score: ${result.insights.highestTrust.toFixed(3)}`
        );
        console.log(
          `   - Highest risk penalty: ${result.insights.highestRisk.toFixed(3)}`
        );
        console.log(
          `   - Fraud detected: ${result.insights.fraudDetected ? "Yes" : "No"}`
        );
        console.log(
          `   - Viral items identified: ${result.insights.viralItems}`
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

module.exports = testSocialProofTrustComplete;
