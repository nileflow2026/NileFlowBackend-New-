const { ID, Query } = require("node-appwrite");
const { env } = require("../../src/env");
const { db } = require("../../services/appwriteService");

exports.addNileMilesOnPurchase = async (userId, amountSSPP) => {
  const milesToAdd = Math.floor(amountSSPP / 10);

  const userRecord = await getUserMiles(userId);

  if (userRecord) {
    const history = JSON.parse(userRecord.earnedHistory || "[]");

    history.push({
      type: "purchase",
      amount: milesToAdd,
      date: new Date().toISOString(),
    });

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      userRecord.$id,
      {
        currentMiles: userRecord.currentMiles + milesToAdd,
        earnedHistory: JSON.stringify(history),
      }
    );
  } else {
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      ID.unique(),
      {
        userId,
        currentMiles: milesToAdd,
        earnedHistory: JSON.stringify([
          {
            type: "purchase",
            amount: milesToAdd,
            date: new Date().toISOString(),
          },
        ]),
        redeemed: JSON.stringify([]),
      }
    );
  }
};

exports.addNileMilesOnReferral = async (inviterId, bonusMiles = 50) => {
  console.log("DB:", DB_ID);
  console.log("COLLECTION:", COLLECTION_ID);

  const userRecord = await getUserMiles(inviterId);

  if (userRecord) {
    const history = JSON.parse(userRecord.earnedHistory || "[]");

    history.push({
      type: "referral",
      amount: bonusMiles,
      date: new Date().toISOString(),
    });

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      userRecord.$id,
      {
        currentMiles: userRecord.currentMiles + bonusMiles,
        earnedHistory: JSON.stringify(history),
      }
    );
  } else {
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      ID.unique(),
      {
        userId: inviterId,
        currentMiles: bonusMiles,
        earnedHistory: JSON.stringify([
          {
            type: "referral",
            amount: bonusMiles,
            date: new Date().toISOString(),
          },
        ]),
        redeemed: JSON.stringify([]),
      }
    );
  }
};

exports.handleReferralSignup = async (newUserId, referralCode) => {
  // 1. Find inviter by referralCode
  const inviter = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFERRALS_COLLECTION_ID,
    [Query.equal("code", [referralCode])]
  );

  if (inviter.total === 0) {
    console.log("Invalid referral code");
    return;
  }

  const inviterId = inviter.documents[0].userId;

  // 2. Add miles to inviter
  await addNileMilesOnReferral(inviterId, 50); // 👈 50 miles bonus per referral

  // 3. Optionally update referral stats (successful count, etc.)
  await db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFERRALS_COLLECTION_ID,
    inviter.documents[0].$id,
    {
      successful: inviter.documents[0].successful + 1,
    }
  );
};

exports.getReferralRewards = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Fetch Nile Miles record
    const milesRes = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NILE_MILES_COLLECTION,
      [Query.equal("userId", [userId])]
    );

    let purchaseMiles = 0;
    let referralMiles = 0;
    let totalMiles = 0;
    let history = [];

    if (milesRes.total > 0) {
      const userMiles = milesRes.documents[0];
      history = JSON.parse(userMiles.earnedHistory || "[]");

      history.forEach((entry) => {
        if (entry.type === "purchase") purchaseMiles += entry.amount;
        if (entry.type === "referral") referralMiles += entry.amount;
      });

      totalMiles = userMiles.currentMiles || 0;
    }

    // 2. Fetch referral code
    const referralRes = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFERRALS_COLLECTION_ID,
      [Query.equal("userId", [userId])]
    );

    let referralCode = null;
    if (referralRes.total > 0) {
      referralCode = referralRes.documents[0].code;
    }

    // 3. Respond
    res.json({
      referralCode,
      purchaseMiles,
      referralMiles,
      totalMiles,
      history: history.reverse(),
    });
  } catch (err) {
    console.error("Error fetching referral rewards:", err);
    res.status(500).json({ error: "Failed to fetch referral rewards" });
  }
};

const getUserMiles = async (userId) => {
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_NILE_MILES_COLLECTION,
    [Query.equal("userId", [userId])]
  );

  return res.total > 0 ? res.documents[0] : null;
};

const getUserReferralMiles = async (userId) => {
  const res = await db.listDocuments(DB_ID, REFERRAL_ID, [
    Query.equal("userId", [userId]),
  ]);

  return res.total > 0 ? res.documents[0] : null;
};
