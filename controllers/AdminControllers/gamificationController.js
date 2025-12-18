// controllers/gamificationController.js

const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");

const DB_ID = process.env.APPWRITE_DB_ID;
const CHECKINS = "checkins";
const SPINS = "spins";
const REFERRALS = "referrals";
const REWARDS = "rewardsLedger";

// ✅ Daily Check-In
const dailyCheckIn = async (req, res) => {
  const { userId } = req.body;
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if user already checked in today
    const existing = await db.listDocuments(DB_ID, CHECKINS, [
      Query.equal("userId", userId),
      Query.equal("date", today),
    ]);

    if (existing.total > 0) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Add check-in
    await db.createDocument(DB_ID, CHECKINS, ID.unique(), {
      userId,
      date: today,
      streakCount: existing.total + 1,
      lastCheckIn: today,
    });

    // Add reward to ledger
    await db.createDocument(DB_ID, REWARDS, ID.unique(), {
      userId,
      rewardType: "checkin",
      value: 10, // Example: 10 Nile Miles
      description: "Daily check-in reward",
      date: today,
    });

    res.json({ message: "Check-in successful", reward: 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Spin the Wheel
const spinWheel = async (req, res) => {
  const { userId } = req.body;
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if already spun today
    const existing = await db.listDocuments(DB_ID, SPINS, [
      Query.equal("userId", userId),
      Query.equal("spinDate", today),
    ]);

    if (existing.total > 0) {
      return res.status(400).json({ message: "Already spun today" });
    }

    // Random prize logic (weighted)
    const prizes = [
      { prize: "5 Nile Miles", value: 5 },
      { prize: "10 Nile Miles", value: 10 },
      { prize: "Free Shipping", value: 0 },
      { prize: "15% Discount Coupon", value: 0 },
    ];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

    await db.createDocument(DB_ID, SPINS, ID.unique(), {
      userId,
      spinDate: today,
      prize: randomPrize.prize,
    });

    await db.createDocument(DB_ID, REWARDS, ID.unique(), {
      userId,
      rewardType: "spin",
      value: randomPrize.value,
      description: randomPrize.prize,
      date: today,
    });

    res.json({ message: "Spin successful", prize: randomPrize.prize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Referral Tracking
const trackReferral = async (req, res) => {
  const { referrerId, refereeId } = req.body;
  try {
    await db.createDocument(DB_ID, REFERRALS, ID.unique(), {
      referrerId,
      refereeId,
      rewardStatus: "pending",
    });

    res.json({ message: "Referral tracked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Claim Referral (called when referee makes first order)
const claimReferralReward = async (req, res) => {
  const { refereeId } = req.body;
  try {
    const referrals = await db.listDocuments(DB_ID, REFERRALS, [
      Query.equal("refereeId", refereeId),
      Query.equal("rewardStatus", "pending"),
    ]);

    if (referrals.total === 0) {
      return res.status(400).json({ message: "No referral to claim" });
    }

    const referral = referrals.documents[0];

    // Mark referral as claimed
    await db.updateDocument(DB_ID, REFERRALS, referral.$id, {
      rewardStatus: "claimed",
    });

    // Reward referrer
    await db.createDocument(DB_ID, REWARDS, ID.unique(), {
      userId: referral.referrerId,
      rewardType: "referral",
      value: 20, // Example: 20 Nile Miles
      description: "Referral bonus",
      date: new Date().toISOString(),
    });

    res.json({ message: "Referral reward claimed", reward: 20 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Rewards Ledger
const getRewards = async (req, res) => {
  const { userId } = req.params;
  try {
    const rewards = await db.listDocuments(DB_ID, REWARDS, [
      Query.equal("userId", userId),
    ]);

    res.json(rewards.documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  dailyCheckIn,
  spinWheel,
  trackReferral,
  claimReferralReward,
  getRewards,
};
