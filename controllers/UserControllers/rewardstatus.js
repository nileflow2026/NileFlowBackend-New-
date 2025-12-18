const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

exports.getNileMilesStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      [Query.equal("userId", [userId])]
    );

    if (result.total === 0) {
      return res.status(200).json({
        currentMiles: 0,
        earnedHistory: [],
        redeemed: [],
      });
    }

    const userDoc = result.documents[0];
    const earnedHistory = JSON.parse(userDoc.earnedHistory || "[]");
    const redeemed = JSON.parse(userDoc.redeemed || "[]");

    res.json({
      currentMiles: userDoc.currentMiles,
      earnedHistory,
      redeemed,
    });
  } catch (err) {
    console.error("[NileMiles Status] error:", err);
    res.status(500).json({ error: "Failed to fetch Nile Miles status" });
  }
};
