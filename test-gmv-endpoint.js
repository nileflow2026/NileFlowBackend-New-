// test-gmv-endpoint.js
require("dotenv").config();

const axios = require("axios");

async function testGMVEndpoint() {
  console.log("🧪 Testing GMV Endpoint...\n");

  const baseURL = process.env.API_BASE_URL || "http://localhost:3000";
  const testURL = `${baseURL}/api/admin/commission/gmv?timeframe=last30`;

  console.log("📍 Testing URL:", testURL);
  console.log(
    "🔐 Note: This test requires admin authentication in a real environment\n",
  );

  try {
    // This test will show the structure even if it fails due to auth
    const response = await axios.get(testURL, {
      headers: {
        "Content-Type": "application/json",
      },
      // In a real test, you'd include authentication headers here
      timeout: 5000,
    });

    console.log("✅ GMV Endpoint Response:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("📊 Expected Response Structure (from error):");
      console.log("Status:", error.response.status);
      console.log("Response:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 403) {
        console.log(
          "✅ Endpoint exists but requires authentication (expected)",
        );
      } else if (error.response.status === 404) {
        console.log(
          "❌ Endpoint not found - route might not be registered properly",
        );
      }
    } else if (error.code === "ECONNREFUSED") {
      console.log("🔌 Server not running - start the backend to test");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test the expected response format
  console.log("\n📋 Expected Response Format:");
  console.log(`{
  "success": true,
  "data": {
    "totalGMV": 0,
    "orderCount": 0,
    "averageOrderValue": 0,
    "daily_gmv": [
      {
        "date": "2026-01-22",
        "gmv": 1500.50,
        "orders": 5,
        "day": "Wed",
        "fullDate": "Jan 22, 2026"
      }
    ],
    "period": {
      "startDate": "2025-12-23T...",
      "endDate": "2026-01-22T...",
      "days": 30
    }
  },
  "generatedAt": "2026-01-22T...",
  "period": {
    "startDate": "...",
    "endDate": "...",
    "days": 30,
    "timeframe": "last30"
  }
}`);

  console.log("\n🎯 Frontend Usage:");
  console.log(`
// In adminService.js
export const getGMVData = async (timeframe = 'last30') => {
  try {
    const response = await axiosClient.get(\`/api/admin/commission/gmv?timeframe=\${timeframe}\`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching GMV data:", error);
    throw new Error("Failed to fetch GMV data.");
  }
};

// In Commission.jsx
const gmvData = await getGMVData(timeframe);
// gmvData.daily_gmv will contain the chart data
// gmvData.totalGMV will contain the total GMV
  `);
}

if (require.main === module) {
  testGMVEndpoint();
}

module.exports = { testGMVEndpoint };
