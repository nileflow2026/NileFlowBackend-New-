const { ID, Query } = require("node-appwrite");
const { users, db, account, avatars } = require("../../src/appwrite");
const {
  createNotificationInternal,
} = require("../../controllers/UserControllers/Clientnotification");

const { env } = require("../../src/env");
const {
  sendVerificationEmail,
  storeVerificationCode,
} = require("../../services/send-confirmation");
const {
  addNileMilesOnReferral,
} = require("../../controllers/AdminControllers/rewardController");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  hashToken,
  timeframeToMs,
} = require("../../utils/tokenManager");

// Ensure critical env values exist
if (
  !env.APPWRITE_DATABASE_ID ||
  !env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID ||
  !env.APPWRITE_USER_COLLECTION_ID
) {
  throw new Error(
    "Missing Appwrite collection env variables. Please set APPWRITE_DATABASE_ID, APPWRITE_REFRESH_TOKEN_COLLECTION_ID, APPWRITE_USER_COLLECTION_ID."
  );
}

// Lightweight structured logger
const log = {
  info: (...args) => console.info("[customer-auth]", ...args),
  warn: (...args) => console.warn("[customer-auth]", ...args),
  error: (...args) => console.error("[customer-auth]", ...args),
};

/**
 * Persist refresh token (store hashed token only) into Appwrite refresh_tokens collection.
 */
async function persistRefreshToken({
  userId,
  refreshToken,
  ip = null,
  userAgent = null,
  deviceId = null,
  rotatedFrom = null,
}) {
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + timeframeToMs(env.JWT_REFRESH_EXPIRES_IN || "30d")
  ).toISOString();
  const docId = ID.unique();

  return db.createDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    docId,
    {
      userId,
      refreshToken: hashedRefreshToken,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
      ip,
      userAgent,
      deviceId,
      rotatedFrom,
    }
  );
}

/**
 * Find persisted refresh token record by hash
 */
async function findRefreshTokenRecordByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const result = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("refreshToken", tokenHash)]
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

/**
 * Find tokens for a user + device
 */
async function findTokensByUserAndDevice(userId, deviceId, userAgent) {
  if (deviceId) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("deviceId", deviceId)]
    );
    return res?.documents || [];
  }
  if (userAgent) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("userAgent", userAgent)]
    );
    return res?.documents || [];
  }
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)]
  );
  return res?.documents || [];
}

/**
 * Revoke a refresh token by document id
 */
async function revokeRefreshTokenById(docId) {
  return db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    docId,
    { revoked: true, revokedAt: new Date().toISOString() }
  );
}

/**
 * Revoke all refresh tokens for a user
 */
async function revokeAllUserRefreshTokens(userId) {
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)]
  );

  if (!res || !res.documents) return 0;

  let count = 0;
  for (const doc of res.documents) {
    if (!doc.revoked) {
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        doc.$id,
        {
          revoked: true,
          revokedAt: new Date().toISOString(),
        }
      );
      count++;
    }
  }
  return count;
}

/**
 * Sanitize user object for client
 */
function sanitizeUser(userObj) {
  return {
    id: userObj.$id,
    email: userObj.email,
    username: userObj.name || userObj.prefs?.username || null,
    role: userObj.prefs?.role || "customer",
    avatar: userObj.prefs?.avatar || null,
    phone: userObj.prefs?.phone || userObj.phone || null,
  };
}

/* --------------------- Controllers --------------------- */

/**
 * Signup Customer
 */
const signupcustomer = async (req, res) => {
  const { email, password, username, phone, deviceId } = req.body;

  // Basic validation
  if (!email || !password || !username) {
    return res.status(400).json({
      error: "Email, password, and username are required.",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters",
    });
  }

  const documentId = ID.unique();
  let createdUser = null;

  try {
    // 1) Create Appwrite user
    createdUser = await users.create(
      documentId,
      email,
      null,
      password,
      username
    );

    // 2) Get avatar initials
    const avatarUrl = avatars.getInitials(username);

    // 3) Update user prefs
    try {
      await users.updatePrefs(createdUser.$id, {
        theme: "light",
        role: "customer",
        avatar: avatarUrl,
        phone: phone || "",
      });
    } catch (prefErr) {
      log.warn("Non-fatal: failed to update user prefs:", prefErr?.message);
    }

    // 1. Generate a random 6-digit code for verification
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 2. Temporarily store the verification code with an expiration time
    // You should use a temporary cache like Redis or a database table with an expiry.
    // For this example, let's use a simple placeholder.
    // NOTE: DO NOT use a global variable or object in production.
    await storeVerificationCode(email, verificationCode); // A new function

    // 3. Send the verification email using Resend
    await sendVerificationEmail({
      customerEmail: email,
      customerName: username,
      verificationCode,
    });

    // 4) Create profile document
    const profile = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      documentId,
      {
        email: createdUser.email,
        username: createdUser.name,
        role: "customer",
        phone: phone || null,
        createdAt: new Date().toISOString(),
      }
    );

    // 5) Issue tokens
    const accessPayload = { sub: createdUser.$id, role: "customer" };
    const accessToken = signAccessToken(accessPayload);

    const refreshPayload = { sub: createdUser.$id };
    const refreshToken = signRefreshToken(refreshPayload);

    // 6) Persist refresh token
    try {
      await persistRefreshToken({
        userId: createdUser.$id,
        refreshToken,
        ip: req.ip || null,
        userAgent: req.headers?.["user-agent"] || null,
        deviceId: deviceId || null,
        rotatedFrom: null,
      });
    } catch (persistErr) {
      log.error("Failed to persist refresh token:", persistErr?.message);
    }

    // 7) Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // 8) Create notification (if you have this function)
    try {
      await createNotificationInternal({
        message: `🎉 ${username} just signed up!`,
        type: "user",
        username: createdUser.name,
        userId: createdUser.$id,
      });
    } catch (notifErr) {
      log.warn("Failed to create notification:", notifErr?.message);
    }

    return res.status(201).json({
      message: "Customer account created successfully.",
      user: {
        id: createdUser.$id,
        email: createdUser.email,
        username: createdUser.name,
        role: "customer",
        phone: phone || null,
        avatar: avatarUrl,
      },
      profile,
    });
  } catch (error) {
    log.error("Customer signup error:", error?.message || error);

    // Rollback: delete created user
    if (createdUser) {
      try {
        await users.delete(createdUser.$id);
        log.info("Rolled back Appwrite user after failed signup.");
      } catch (delErr) {
        log.error("Rollback failed:", delErr?.message);
      }
    }

    if (error.code === 409) {
      return res.status(409).json({
        error: "User with this email already exists.",
      });
    }

    return res.status(500).json({ error: "Signup failed." });
  }
};

/**
 * Signin Customer
 */
const signincustomer = async (req, res) => {
  log.info("👀 signincustomer controller triggered");
  const { email, password, deviceId } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  try {
    // Create Appwrite session
    const session = await account.createEmailPasswordSession(email, password);
    const user = await users.get(session.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const role = user.prefs?.role || "customer";

    // Issue tokens
    const accessPayload = { sub: user.$id, role };
    const accessToken = signAccessToken(accessPayload);

    const refreshPayload = { sub: user.$id };
    const refreshToken = signRefreshToken(refreshPayload);

    // Persist refresh token
    try {
      await persistRefreshToken({
        userId: user.$id,
        refreshToken,
        ip: req.ip || null,
        userAgent: req.headers?.["user-agent"] || null,
        deviceId: deviceId || null,
        rotatedFrom: null,
      });
    } catch (persistErr) {
      log.error("Failed to persist refresh token:", persistErr?.message);
    }

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    log.info("Customer signin successful:", user.email);

    return res.status(200).json({
      message: "Signin successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    log.error("Customer signin error:", error?.message || error);

    if (
      error.code === 401 ||
      /credentials|password|authentication/i.test(String(error.message || ""))
    ) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.status(500).json({
      error: "Signin failed. Please try again later.",
    });
  }
};

/**
 * Handle Refresh Token for Customer
 */
const handleRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { deviceId } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token." });
    }

    // 1) Verify signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (verifyErr) {
      log.warn("Refresh token verification failed:", verifyErr?.message);
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid refresh token payload." });
    }

    // 2) Find persisted token record
    const record = await findRefreshTokenRecordByHash(refreshToken);
    if (!record) {
      log.warn("Refresh token record not found for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e)
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // 3) Check if revoked or expired
    if (record.revoked) {
      log.warn("Revoked refresh token used for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e)
      );
      return res.status(401).json({ error: "Refresh token revoked." });
    }

    if (new Date(record.expiresAt) < new Date()) {
      await revokeRefreshTokenById(record.$id).catch((e) =>
        log.error("Error revoking expired token:", e)
      );
      return res.status(401).json({ error: "Refresh token expired." });
    }

    // 4) Device scoping
    const requestDeviceId = deviceId || req.body.deviceId || null;
    const requestUserAgent = req.headers?.["user-agent"] || null;

    // 5) Find tokens for this user+device
    const deviceTokens = await findTokensByUserAndDevice(
      userId,
      requestDeviceId,
      requestUserAgent
    );

    if (!deviceTokens || deviceTokens.length === 0) {
      log.warn("No device-scoped tokens found for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e)
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // 6) Check for token reuse with grace period
    const presentedCreatedAt = new Date(record.createdAt).getTime();
    const GRACE_PERIOD_MS = 5000; // 5 seconds
    let foundNewer = false;

    for (const t of deviceTokens) {
      const tCreated = new Date(t.createdAt).getTime();
      const timeDiff = tCreated - presentedCreatedAt;

      if (t.$id !== record.$id && !t.revoked && timeDiff > GRACE_PERIOD_MS) {
        foundNewer = true;
        break;
      }
    }

    if (foundNewer) {
      log.warn("Refresh token reuse detected for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e)
      );
      return res.status(401).json({
        error: "Refresh token reuse detected. All sessions revoked.",
      });
    }

    // 7) Load user
    const user = await users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 8) Issue new tokens
    const newAccessPayload = {
      sub: user.$id,
      role: user.prefs?.role || "customer",
    };
    const newAccessToken = signAccessToken(newAccessPayload);

    const newRefreshPayload = { sub: user.$id };
    const newRefreshToken = signRefreshToken(newRefreshPayload);

    // 9) Persist new refresh token
    let newDoc = null;
    try {
      newDoc = await persistRefreshToken({
        userId: user.$id,
        refreshToken: newRefreshToken,
        ip: req.ip || null,
        userAgent: requestUserAgent,
        deviceId: requestDeviceId,
        rotatedFrom: record.$id,
      });
    } catch (persistErr) {
      log.error(
        "Failed to persist rotated refresh token:",
        persistErr?.message
      );

      // Return access token only
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        domain: "localhost",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });
      return res.status(200).json({ message: "Token refreshed (partial)" });
    }

    // 10) Revoke old token
    try {
      await revokeRefreshTokenById(record.$id);
      await db
        .updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
          record.$id,
          {
            rotatedTo: newDoc.$id,
            rotatedAt: new Date().toISOString(),
          }
        )
        .catch(() => {}); // Non-fatal
    } catch (revErr) {
      log.error("Failed to revoke old refresh token:", revErr?.message);
    }

    // 11) Set new cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({ message: "Tokens refreshed" });
  } catch (error) {
    log.error("Customer token refresh failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid refresh token." });
  }
};

/**
 * Logout Customer
 */
const logoutcustomer = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Try to decode to get userId
      let decoded = null;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (e) {
        // Invalid signature, continue anyway
      }

      const hashedRefreshToken = hashToken(refreshToken);

      const queries =
        decoded && decoded.sub
          ? [
              Query.equal("refreshToken", hashedRefreshToken),
              Query.equal("userId", decoded.sub),
            ]
          : [Query.equal("refreshToken", hashedRefreshToken)];

      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        queries
      );

      if (result && result.documents && result.documents.length > 0) {
        for (const doc of result.documents) {
          if (!doc.revoked) {
            await revokeRefreshTokenById(doc.$id).catch((e) =>
              log.error("Failed to revoke token in logout:", e)
            );
          }
        }
      }
    }

    // Clear cookies
    res.clearCookie("accessToken", { domain: "localhost", path: "/" });
    res.clearCookie("refreshToken", { domain: "localhost", path: "/" });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    log.error("Customer logout failed:", error?.message || error);
    return res.status(500).json({ error: "Logout failed." });
  }
};

/**
 * Get Current Customer User
 */
const getCurrentCustomer = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await users.get(decoded.sub);

    // ✅ Fetch user profile/document from database
    let profile = null;
    try {
      profile = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        decoded.sub
      );
    } catch (profileError) {
      log.warn("Profile not found for user:", decoded.sub);
      // Profile might not exist yet, that's okay
    }

    // ✅ Merge user data with profile data
    const userData = sanitizeUser(user);

    if (profile) {
      // Add profile fields to user data
      userData.avatarUrl = profile.avatarUrl || user.prefs?.avatar || null;
      userData.avatarFileId = profile.avatarFileId || null;
      userData.phone = profile.phone || user.prefs?.phone || null;
      // Add any other profile fields you need
    } else {
      // Fallback to user prefs
      userData.avatarUrl = user.prefs?.avatar || null;
      userData.phone = user.prefs?.phone || null;
    }

    return res.status(200).json({
      user: userData,
    });
  } catch (error) {
    log.error("Get current customer failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// controllers/customerAuthController.js

/**
 * Get customer preferences
 */
const getCustomerPreferences = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await users.get(decoded.sub);

    // Return user preferences
    return res.status(200).json({
      preferences: user.prefs || {},
      preferredPaymentMethod: user.prefs?.preferredPaymentMethod || null,
    });
  } catch (error) {
    log.error("Get customer preferences failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Update customer preferences
 */
const updateCustomerPreferences = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyAccessToken(accessToken);
    const { preferredPaymentMethod, ...otherPrefs } = req.body;

    // Get current prefs
    const user = await users.get(decoded.sub);
    const currentPrefs = user.prefs || {};

    // Update prefs
    const updatedPrefs = {
      ...currentPrefs,
      ...otherPrefs,
    };

    if (preferredPaymentMethod) {
      updatedPrefs.preferredPaymentMethod = preferredPaymentMethod;
    }

    await users.updatePrefs(decoded.sub, updatedPrefs);

    return res.status(200).json({
      message: "Preferences updated successfully",
      preferences: updatedPrefs,
    });
  } catch (error) {
    log.error("Update customer preferences failed:", error?.message || error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
};

module.exports = {
  signupcustomer,
  signincustomer,
  handleRefreshToken,
  logoutcustomer,
  getCurrentCustomer,
  getCustomerPreferences,
  updateCustomerPreferences,
  // Export helper functions for testing if needed
  _internal: {
    persistRefreshToken,
    findRefreshTokenRecordByHash,
    revokeRefreshTokenById,
    revokeAllUserRefreshTokens,
  },
};
