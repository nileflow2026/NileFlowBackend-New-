const { db } = require("../../services/appwriteService");
const { Query } = require("node-appwrite");
const { env } = require("../../src/env");
const e = require("express");

const REWARDS = [
  { key: "a_pen", name: "Free pen", miles: 50 },
  { key: "free_delivery", name: "Free Delivery", miles: 250 },
  { key: "5_percent_off", name: "5% Off", miles: 500 },
  { key: "premium_sale", name: "Premium Sale Access", miles: 1000 },
  { key: "hoodie", name: "Hoodie or Gift Card", miles: 2000 },
];

const getUserMiles = async (userId) => {
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_NILE_MILES_COLLECTION,
    [Query.equal("userId", [userId])] // ✅ CORRECT
  );
  return res.total > 0 ? res.documents[0] : null;
};

exports.redeemMile = async (req, res) => {
  try {
    const { userId, rewardKey } = req.body;

    if (!userId || !rewardKey) {
      return res.status(400).json({ error: "Missing userId or rewardKey" });
    }

    const reward = REWARDS[rewardKey];
    if (!reward) {
      return res.status(400).json({ error: "Invalid reward" });
    }

    const userRecord = await getUserMiles(userId);
    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userRecord.currentMiles < reward.miles) {
      return res.status(400).json({ error: "Not enough miles" });
    }

    const newMiles = userRecord.currentMiles - reward.miles;

    const updatedRedemptions = [
      ...(userRecord.redeemed || []),
      {
        rewardName: reward.name,
        milesUsed: reward.miles,
        date: new Date().toISOString(),
      },
    ];

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      userRecord.$id,
      {
        currentMiles: newMiles,
        redeemed: JSON.stringify(updatedRedemptions),
      }
    );

    return res.status(200).json({ success: true, reward: reward.name });
  } catch (err) {
    console.error("[redeemMiles error]", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.redeemMiles = async (req, res) => {
  try {
    const { userId, rewardKey } = req.body;

    if (!userId || !rewardKey) {
      return res.status(400).json({ error: "Missing userId or rewardKey" });
    }

    // 🔍 Fetch reward dynamically from DB
    const rewardQuery = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARD_COLLECTION_ID,
      [Query.equal("key", rewardKey), Query.equal("active", true)]
    );

    if (rewardQuery.documents.length === 0) {
      return res.status(400).json({ error: "Invalid or inactive reward" });
    }

    const reward = rewardQuery.documents[0];

    // 🔍 Fetch user
    const userRecord = await getUserMiles(userId);
    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userRecord.currentMiles < reward.miles) {
      return res.status(400).json({ error: "Not enough miles" });
    }

    // 💳 Deduct miles
    const newMiles = userRecord.currentMiles - reward.miles;

    // 📜 Track redemption (store as JSON string per schema)
    const existingRedemptions = Array.isArray(userRecord.redeemed)
      ? userRecord.redeemed
      : JSON.parse(userRecord.redeemed || "[]");

    const updatedRedemptions = [
      ...existingRedemptions,
      {
        rewardKey: reward.key,
        rewardName: reward.name,
        milesUsed: reward.miles,
        used: false,
        date: new Date().toISOString(),
      },
    ];

    // ✅ Update user
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      userRecord.$id,
      {
        currentMiles: newMiles,
        redeemed: JSON.stringify(updatedRedemptions),
      }
    );

    return res.status(200).json({
      success: true,
      reward: reward.name,
      remainingMiles: newMiles,
    });
  } catch (err) {
    console.error("[redeemMiles error]", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// In your backend nileMilesController.js
exports.markRewardAsUsed = async (req, res) => {
  try {
    const { userId, redeemedRewardName } = req.body;

    if (!userId || !redeemedRewardName) {
      return res
        .status(400)
        .json({ error: "Missing userId or redeemedRewardName" });
    }

    const userRecord = await getUserMiles(userId);
    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    const redeemedHistory = JSON.parse(userRecord.redeemed || "[]");
    const rewardIndex = redeemedHistory.findIndex(
      (item) => item.rewardName === redeemedRewardName && item.used === false
    );

    if (rewardIndex === -1) {
      return res.status(400).json({ error: "Invalid or already used reward." });
    }

    redeemedHistory[rewardIndex].used = true;

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      userRecord.$id,
      {
        redeemed: JSON.stringify(redeemedHistory),
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Reward marked as used." });
  } catch (err) {
    console.error("[markRewardAsUsed error]", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.listRewards = async (req, res) => {
  try {
    const rewards = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARD_COLLECTION_ID,
      [
        Query.equal("active", true), // only return active rewards
        Query.orderAsc("miles"), // optional: sort by miles
      ]
    );

    return res.status(200).json({
      success: true,
      rewards: rewards.documents.map((r) => ({
        key: r.key,
        name: r.name,
        miles: r.miles,
        image: r.image || null,
        category: r.category || "general",
        description: r.description || "",
      })),
    });
  } catch (err) {
    console.error("[listRewards error]", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.listRewardsGrouped = async (req, res) => {
  try {
    const rewards = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARD_COLLECTION_ID,
      [Query.equal("active", true), Query.orderAsc("miles")]
    );

    // Group rewards by category
    const grouped = {};
    rewards.documents.forEach((r) => {
      const category = r.category || "General";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        key: r.key,
        name: r.name,
        miles: r.miles,
        image: r.image || null,
        description: r.description || "",
      });
    });

    return res.status(200).json({
      success: true,
      categories: grouped, // object { "Storytelling Journey": [...], "Festive Rewards": [...] }
    });
  } catch (err) {
    console.error("[listRewardsGrouped error]", err);
    return res.status(500).json({ error: "Server error" });
  }
};
