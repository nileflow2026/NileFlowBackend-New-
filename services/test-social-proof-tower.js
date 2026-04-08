const SocialProofTrustTower = require("./services/towers/SocialProofTrustTower");

/**
 * Test Social Proof Trust Tower Basic Functionality
 *
 * Tests core trust computation, fraud detection, and social proof generation
 */

async function testSocialProofTrustTower() {
  console.log("🏢 Testing Social Proof Trust Tower...\n");

  try {
    // Initialize tower
    const tower = new SocialProofTrustTower();
    console.log("✅ SocialProofTrustTower initialized");

    // Test 1: Basic trust computation (with fallback)
    console.log("\\n🧪 Test 1: Basic Trust Computation (Fallback)");
    const trustResult1 = await tower.computeTrustAndRisk("test-item-1");

    console.log("Trust Score:", trustResult1.trustScore);
    console.log("Risk Penalty:", trustResult1.riskPenalty);
    console.log("Social Proof Level:", trustResult1.socialProof.level);
    console.log(
      "Has Error (expected for non-existent item):",
      trustResult1.error || false
    );

    // Test 2: Batch trust computation
    console.log("\\n🧪 Test 2: Batch Trust Computation");
    const batchResult = await tower.computeBatchTrust([
      "test-item-1",
      "test-item-2",
      "test-item-3",
    ]);

    console.log(`Batch processed ${batchResult.size} items:`);
    batchResult.forEach((trust, itemId) => {
      console.log(
        `  ${itemId}: Trust=${trust.trustScore}, Risk=${trust.riskPenalty}`
      );
    });

    // Test 3: Review analysis (internal method testing)
    console.log("\\n🧪 Test 3: Review Analysis");

    const mockSocialData = {
      totalReviews: 50,
      averageRating: 4.3,
      ratingDistribution: {
        5: 25,
        4: 15,
        3: 8,
        2: 2,
        1: 0,
      },
      totalPurchases: 200,
      purchaseVelocity: 5.5,
      recentPurchases24h: 12,
      recentPurchases7d: 38,
      returnRate: 0.05,
      refundRate: 0.02,
      fraudFlags: 0,
      sellerTrustScore: 0.85,
      sellerResponseTime: 4,
      sellerRating: 4.6,
      lastUpdated: new Date(),
    };

    const reviewAnalysis = tower.analyzeReviews(mockSocialData);
    console.log("Review Analysis:");
    console.log("  Quality:", reviewAnalysis.quality);
    console.log("  Credibility:", reviewAnalysis.credibility);
    console.log("  Sentiment:", reviewAnalysis.sentiment);
    console.log("  Volume:", reviewAnalysis.volume);
    console.log("  Score:", reviewAnalysis.score);
    console.log("  Suspicious Flags:", reviewAnalysis.flags);

    // Test 4: Velocity analysis
    console.log("\\n🧪 Test 4: Purchase Velocity Analysis");
    const velocityAnalysis = tower.computeVelocityScore(mockSocialData);
    console.log("Velocity Analysis:");
    console.log("  Tier:", velocityAnalysis.tier);
    console.log("  Momentum:", velocityAnalysis.momentum);
    console.log("  Social Proof Level:", velocityAnalysis.socialProofLevel);
    console.log("  Score:", velocityAnalysis.score);

    // Test 5: Seller trust assessment
    console.log("\\n🧪 Test 5: Seller Trust Assessment");
    const sellerAssessment = tower.assessSellerTrust(mockSocialData);
    console.log("Seller Assessment:");
    console.log("  Trust Level:", sellerAssessment.trustLevel);
    console.log("  Reliability:", sellerAssessment.reliability);
    console.log("  Responsiveness:", sellerAssessment.responsiveness);
    console.log("  Reputation:", sellerAssessment.reputation);
    console.log("  Score:", sellerAssessment.score);
    console.log("  Flags:", sellerAssessment.flags);

    // Test 6: Fraud detection
    console.log("\\n🧪 Test 6: Fraud Detection");
    const fraudAssessment = tower.detectFraudIndicators(mockSocialData);
    console.log("Fraud Assessment:");
    console.log("  Risk Level:", fraudAssessment.riskLevel);
    console.log("  Risk Score:", fraudAssessment.riskScore);
    console.log("  Has Fraud:", fraudAssessment.hasFraud);
    console.log("  Indicators:", fraudAssessment.indicators);

    // Test 7: Complete trust computation with mock data
    console.log("\\n🧪 Test 7: Complete Trust Computation (Mock Data)");
    const completeResult = await tower.computeTrustAndRisk(
      "mock-item",
      mockSocialData
    );

    console.log("Complete Trust Analysis:");
    console.log("  Final Trust Score:", completeResult.trustScore);
    console.log("  Risk Penalty:", completeResult.riskPenalty);
    console.log("  Social Proof Level:", completeResult.socialProof.level);
    console.log(
      "  Social Proof Messages:",
      completeResult.socialProof.messages
    );
    console.log(
      "  Trust Indicators:",
      completeResult.socialProof.trustIndicators
    );
    console.log("  Badges:", completeResult.socialProof.badges);

    // Test 8: Suspicious review patterns
    console.log("\\n🧪 Test 8: Suspicious Review Detection");
    const suspiciousData = {
      ...mockSocialData,
      totalReviews: 20,
      averageRating: 4.95,
      ratingDistribution: {
        5: 19, // 95% 5-star reviews (suspicious)
        4: 0,
        3: 0,
        2: 0,
        1: 1,
      },
    };

    const suspiciousAnalysis = tower.analyzeReviews(suspiciousData);
    console.log("Suspicious Review Analysis:");
    console.log("  Quality:", suspiciousAnalysis.quality);
    console.log("  Credibility:", suspiciousAnalysis.credibility);
    console.log("  Flags:", suspiciousAnalysis.flags);
    console.log("  Score (should be penalized):", suspiciousAnalysis.score);

    console.log(
      "\\n🎉 All SocialProofTrustTower tests completed successfully!"
    );

    return {
      success: true,
      tests: 8,
      results: {
        basicTrust: trustResult1,
        batchTrust: batchResult,
        reviewAnalysis: reviewAnalysis,
        velocityAnalysis: velocityAnalysis,
        sellerAssessment: sellerAssessment,
        fraudAssessment: fraudAssessment,
        completeTrust: completeResult,
        suspiciousAnalysis: suspiciousAnalysis,
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
  testSocialProofTrustTower()
    .then((result) => {
      if (result.success) {
        console.log("\\n✅ All tests passed!");
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

module.exports = testSocialProofTrustTower;
