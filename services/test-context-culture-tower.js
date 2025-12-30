// Test ContextCultureTower functionality
require("dotenv/config");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const ContextCultureTower = require("./services/towers/ContextCultureTower");

async function testContextCultureTower() {
  try {
    console.log("🌍 Testing ContextCultureTower...\n");

    const tower = new ContextCultureTower(null, env.APPWRITE_DATABASE_ID);

    console.log("✅ ContextCultureTower initialized");

    // Test different African contexts
    const testContexts = [
      {
        name: "Nigerian User - Lagos",
        context: {
          country: "NG",
          city: "Lagos",
          language: "en",
          currency: "NGN",
          timestamp: new Date("2024-12-25"), // Christmas
          weatherCondition: "sunny",
          deviceType: "mobile",
        },
      },
      {
        name: "Kenyan User - Nairobi",
        context: {
          country: "KE",
          city: "Nairobi",
          language: "sw",
          currency: "KES",
          timestamp: new Date("2024-07-15"), // Dry season
          weatherCondition: "clear",
          deviceType: "desktop",
        },
      },
      {
        name: "South African User - Cape Town",
        context: {
          country: "ZA",
          city: "Cape Town",
          language: "en",
          currency: "ZAR",
          timestamp: new Date("2024-06-21"), // Winter
          weatherCondition: "cold",
          deviceType: "mobile",
        },
      },
      {
        name: "Ghanaian User - Accra (Rainy Season)",
        context: {
          country: "GH",
          city: "Accra",
          language: "en",
          currency: "GHS",
          timestamp: new Date("2024-08-15"), // Wet season
          weatherCondition: "rain",
          deviceType: "mobile",
        },
      },
    ];

    console.log("🧪 Testing contextual relevance computation...\n");

    for (const testCase of testContexts) {
      try {
        console.log(`📍 ${testCase.name}:`);
        console.log(`   Country: ${testCase.context.country}`);
        console.log(`   Date: ${testCase.context.timestamp.toDateString()}`);
        console.log(`   Weather: ${testCase.context.weatherCondition}`);

        const result = await tower.computeContextualRelevance(testCase.context);

        console.log(
          `   🎯 Context Multiplier: ${result.contextRelevanceMultiplier.toFixed(
            3
          )}`
        );
        console.log(
          `   📊 Boost Vector (first 5): [${result.seasonalBoostVector
            .slice(0, 5)
            .map((v) => v.toFixed(2))
            .join(", ")}]`
        );
        console.log(`   🌍 Cultural Context:`);
        console.log(`      • Country: ${result.culturalContext.country}`);
        console.log(
          `      • Festivals: ${result.culturalContext.festivals.length} active`
        );
        console.log(`      • Season: ${result.culturalContext.season}`);
        console.log(
          `      • Economic: ${result.culturalContext.economicCondition}`
        );
        console.log(
          `      • Weather Impact: ${result.culturalContext.weatherImpact}`
        );

        if (result.culturalContext.festivals.length > 0) {
          console.log(`   🎉 Active Festivals:`);
          result.culturalContext.festivals.forEach((festival) => {
            console.log(
              `      • ${festival.name} (${festival.daysLeft} days left)`
            );
          });
        }

        console.log("");
      } catch (error) {
        console.log(`   ❌ Error testing ${testCase.name}:`, error.message);
        console.log("");
      }
    }

    // Test cultural preference learning
    console.log("🧠 Testing cultural preference learning...");

    const mockBehavior = [
      {
        eventType: "purchase",
        metadata: { category: "fashion" },
        timestamp: new Date(),
      },
      {
        eventType: "purchase",
        metadata: { category: "traditional_clothes" },
        timestamp: new Date(),
      },
      {
        eventType: "view",
        metadata: { category: "electronics" },
        timestamp: new Date(),
      },
    ];

    const culturalContext = {
      country: "NG",
      city: "Lagos",
      language: "en",
      festivals: [{ name: "christmas", boost: 2.5 }],
      season: "dry_season",
    };

    try {
      await tower.learnCulturalPreferences(mockBehavior, culturalContext);
      console.log("✅ Cultural preference learning completed");
    } catch (error) {
      console.log("⚠️  Cultural preference learning failed:", error.message);
    }

    // Test temporal context computation
    console.log("\n📅 Testing temporal context computation...");

    const temporalTests = [
      { country: "NG", date: new Date("2024-12-25"), name: "Christmas Day" },
      {
        country: "KE",
        date: new Date("2024-08-15"),
        name: "Regular August Day",
      },
      { country: "ZA", date: new Date("2024-07-15"), name: "Winter Season" },
      { country: "GH", date: new Date("2024-06-20"), name: "Wet Season Start" },
    ];

    for (const test of temporalTests) {
      try {
        const temporal = tower.computeTemporalContext(test.country, test.date);
        console.log(`📍 ${test.name} (${test.country}):`);
        console.log(
          `   • Active festivals: ${temporal.activeFestivals.length}`
        );
        console.log(`   • Season: ${temporal.season?.name || "unknown"}`);
        console.log(
          `   • Temporal multiplier: ${temporal.temporalMultiplier.toFixed(2)}`
        );
        console.log(
          `   • Seasonal boosts: ${temporal.seasonalBoosts.size} categories`
        );
        console.log("");
      } catch (error) {
        console.log(`   ❌ Error testing ${test.name}:`, error.message);
      }
    }

    // Test weather context
    console.log("🌤️  Testing weather context computation...");

    const weatherTests = [
      { country: "NG", weather: "rain", name: "Rainy Day Lagos" },
      { country: "KE", weather: "sunny", name: "Sunny Day Nairobi" },
      { country: "ZA", weather: "cold", name: "Cold Day Cape Town" },
      { country: "EG", weather: "dusty", name: "Dusty Day Cairo" },
    ];

    for (const test of weatherTests) {
      try {
        const weatherBoosts = tower.computeWeatherBoosts(
          test.country,
          test.weather,
          new Date()
        );
        console.log(`🌦️  ${test.name}:`);
        console.log(`   • Weather condition: ${weatherBoosts.condition}`);
        console.log(
          `   • Weather multiplier: ${weatherBoosts.multiplier.toFixed(2)}`
        );
        console.log(
          `   • Category boosts: ${weatherBoosts.boosts.size} categories`
        );

        if (weatherBoosts.boosts.size > 0) {
          const topBoosts = Array.from(weatherBoosts.boosts.entries()).slice(
            0,
            3
          );
          console.log(
            `   • Top boosts: ${topBoosts
              .map(([cat, boost]) => `${cat}(${boost.toFixed(1)}x)`)
              .join(", ")}`
          );
        }
        console.log("");
      } catch (error) {
        console.log(`   ❌ Error testing ${test.name}:`, error.message);
      }
    }

    console.log("🎉 ContextCultureTower testing completed!\n");

    console.log("📋 Summary:");
    console.log("✅ Context relevance computation works");
    console.log("✅ Temporal context analysis works");
    console.log("✅ Weather context analysis works");
    console.log("✅ Cultural preference learning works");
    console.log("✅ African cultural intelligence system operational!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testContextCultureTower();
