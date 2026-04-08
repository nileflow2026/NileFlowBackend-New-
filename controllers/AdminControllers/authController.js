const { ID, Query } = require("node-appwrite");
const { users, db, account } = require("../../src/appwrite");
const { env } = require("../../src/env");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  timeframeToMs,
  verifyAccessToken,
} = require("../../utils/tokenManager");

// Ensure critical env values exist
if (
  !env.APPWRITE_DATABASE_ID ||
  !env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID ||
  !env.APPWRITE_ADMIN_COLLECTION_ID
) {
  throw new Error(
    "Missing Appwrite collection env variables. Please set APPWRITE_DATABASE_ID, APPWRITE_REFRESH_TOKEN_COLLECTION_ID, APPWRITE_ADMIN_COLLECTION_ID.",
  );
}

// Lightweight structured logger (swap for pino/winston in prod)
const log = {
  info: (...args) => console.info("[auth]", ...args),
  warn: (...args) => console.warn("[auth]", ...args),
  error: (...args) => console.error("[auth]", ...args),
};

/**
 * Get appropriate cookie domain based on request origin for admin
 */
function getCookieDomain(req) {
  const origin = req.get("origin") || req.get("referer");
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";

  console.log("[Admin Cookie Domain Debug]", {
    origin,
    host,
    protocol,
    isSecure: protocol === "https",
    requestHeaders: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
    },
  });

  // Check if backend and frontend are on different domains (cross-origin)
  const isCrossOrigin =
    origin &&
    host &&
    !origin.includes(host) &&
    !host.includes(origin.replace("https://", "").replace("http://", ""));

  console.log("[Admin Cookie] Cross-origin check:", {
    origin,
    host,
    isCrossOrigin,
  });

  if (isCrossOrigin) {
    console.log(
      "[Admin Cookie] Cross-origin detected - using secure cross-origin settings",
    );
    return {
      domain: undefined, // No domain restriction for cross-origin
      secure: true, // Always secure for cross-origin
      sameSite: "none", // Required for cross-origin cookies
    };
  }

  // Development - no domain restriction
  if (
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    (host && host.includes("localhost"))
  ) {
    console.log("[Admin Cookie] Using localhost - no domain restriction");
    return { domain: undefined, secure: false, sameSite: "lax" };
  }

  // Same-origin admin production domains
  if (
    (origin && origin.includes("admin.nileflowafrica.com")) ||
    (host && host.includes("admin.nileflowafrica.com"))
  ) {
    console.log(
      "[Admin Cookie] Using admin.nileflowafrica.com domain (same-origin)",
    );
    return {
      domain: ".admin.nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // Fallback for nileflowafrica.com
  if (
    (origin && origin.includes("nileflowafrica.com")) ||
    (host && host.includes("nileflowafrica.com"))
  ) {
    console.log("[Admin Cookie] Using nileflowafrica.com domain (same-origin)");
    return {
      domain: ".nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // Default - secure cross-origin settings for production
  console.log("[Admin Cookie] Using default secure cross-origin settings");
  return {
    domain: undefined,
    secure: true,
    sameSite: "none",
  };
}

/**
 * Persist refresh token (store hashed token only) into Appwrite refresh_tokens collection.
 * Returns created document metadata.
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
    Date.now() + timeframeToMs(env.JWT_REFRESH_EXPIRES_IN || "30d"),
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
      rotatedFrom, // optional reference to previous token doc id
    },
  );
}

/**
 * Find persisted refresh token record by token hash & userId.
 * Returns document or null.
 */
async function findRefreshTokenRecord({ userId, refreshToken }) {
  const hashedRefreshToken = hashToken(refreshToken);
  const result = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [
      Query.equal("userId", userId),
      Query.equal("refreshToken", hashedRefreshToken),
    ],
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

async function findRefreshTokenRecordByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const result = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("refreshToken", tokenHash)],
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

/**

/**
 * Find tokens for a user + device (deviceId preferred, otherwise fallback to userAgent).
 */
async function findTokensByUserAndDevice(userId, deviceId, userAgent) {
  // Try deviceId first if provided
  if (deviceId) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("deviceId", deviceId)],
    );
    return res?.documents || [];
  }
  // fallback to userAgent if deviceId not provided
  if (userAgent) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("userAgent", userAgent)],
    );
    return res?.documents || [];
  }
  // last resort: return all user tokens
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)],
  );
  return res?.documents || [];
}

/**
 * Revoke a refresh token record (by document id)
 */
async function revokeRefreshTokenById(docId) {
  return db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    docId,
    { revoked: true, revokedAt: new Date().toISOString() },
  );
}

/**
 * Revoke all refresh tokens for a user (useful for suspicious activity).
 */
async function revokeAllUserRefreshTokens(userId) {
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)],
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
        },
      );
      count++;
    }
  }
  return count;
}

/**
 * Sanitize user object for client.
 */
function sanitizeUser(userObj) {
  return {
    id: userObj.$id,
    email: userObj.email,
    username: userObj.name || userObj.prefs?.username || null,
    role: userObj.prefs?.role || "user",
    avatar: userObj.prefs?.avatar || null,
  };
}

/* --------------------- Controllers --------------------- */

/**
 * Signup: create Appwrite user + profile, persist refresh token, return tokens.
 * Compensating rollback deletes created Appwrite user if profile creation fails.
 */
const signup = async (req, res) => {
  const { email, password, username, deviceName, deviceId } = req.body || {};

  // Basic validation
  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ error: "email, username and password are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }
  if (String(password).length < 8) {
    return res
      .status(400)
      .json({ error: "password must be at least 8 characters" });
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
      username,
    );

    // 2) Create profile document in admin/user collection
    const profile = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADMIN_COLLECTION_ID,
      documentId,
      {
        email,
        username,
        role: "admin",
        createdAt: new Date().toISOString(),
        avatarUrl: null,
        deviceName: deviceName || null,
      },
    );

    // 3) Safe attempt to update user prefs (non-fatal)
    const avatarUrl = profile.avatarUrl || null;
    try {
      await users.updatePrefs(createdUser.$id, {
        theme: "light",
        role: "admin",
        avatar: avatarUrl,
      });
    } catch (prefErr) {
      log.warn(
        "Non-fatal: failed to update user prefs:",
        prefErr?.message || prefErr,
      );
    }

    // 4) Issue tokens
    const accessPayload = { sub: createdUser.$id, role: "admin" };
    const accessToken = signAccessToken(accessPayload);

    // refresh token payload can be minimal
    const refreshPayload = { sub: createdUser.$id };
    const refreshToken = signRefreshToken(refreshPayload);

    // 5) Persist refresh token (store hashed)
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
      // Persistence failure is important; log and proceed (optionally fail).
      log.error(
        "Failed to persist refresh token:",
        persistErr?.message || persistErr,
      );
    }

    const cookieConfig = getCookieDomain(req);
    const cookieOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      cookieOptions.domain = cookieConfig.domain;
    }

    console.log("[Admin Signup] Cookie options:", cookieOptions);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Admin account created successfully.",
      user: {
        id: createdUser.$id,
        email,
        username,
        role: "admin",
        avatar: avatarUrl,
      },
      profile,
    });

    // Production level: send verification email here (if needed)
  } catch (error) {
    log.error("Signup error:", error?.message || error);

    // Compensating rollback: delete Appwrite user if created
    if (createdUser) {
      try {
        await users.delete(createdUser.$id);
        log.info(
          "Rolled back Appwrite user after failed signup profile creation.",
        );
      } catch (delErr) {
        log.error("Rollback failed (delete user):", delErr?.message || delErr);
      }
    }

    return res.status(500).json({ error: "Signup failed." });
  }
};

/**
 * Signin: create Appwrite session, issue tokens, persist refresh token.
 */

// signin controller
const signin = async (req, res) => {
  const { email, password, deviceId } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const session = await account.createEmailPasswordSession(email, password);
    const user = await users.get(session.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const role = user.prefs?.role || "user";
    const accessPayload = { sub: user.$id, role, email: user.email };
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

    const cookieConfig = getCookieDomain(req);
    const cookieOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      cookieOptions.domain = cookieConfig.domain;
    }

    console.log("[Admin Signin] Cookie options:", cookieOptions);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Signin successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    log.error("Signin error:", error?.message);
    if (
      /credentials|password|authentication/i.test(String(error.message || ""))
    ) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    return res.status(500).json({ error: "Signin failed." });
  }
};

// Do the same for signup controller - add cookie setting after token generation
/**
 * handleRefreshToken: verifies refresh token signature + persisted record,
 * rotates refresh token (issue new + revoke old), returns new access token and new refresh token.
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
      log.warn(
        "Refresh token verification failed:",
        verifyErr?.message || verifyErr,
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid refresh token payload." });
    }

    // 2) Find persisted token record by hash
    const record = await findRefreshTokenRecordByHash(refreshToken);
    if (!record) {
      log.warn("Refresh token record not found for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // 3) Basic checks (revoked/expired)
    if (record.revoked) {
      log.warn(
        "Revoked refresh token used (possible theft) for user:",
        userId,
        "doc:",
        record.$id,
      );
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Refresh token revoked." });
    }
    if (new Date(record.expiresAt) < new Date()) {
      await revokeRefreshTokenById(record.$id).catch((e) =>
        log.error("Error revoking expired token:", e),
      );
      return res.status(401).json({ error: "Refresh token expired." });
    }

    // 4) Device scoping
    const requestDeviceId = deviceId || req.body.deviceId || null;
    const requestUserAgent = req.headers?.["user-agent"] || null;

    // 5) IMPROVED: Find tokens for this user+device
    const deviceTokens = await findTokensByUserAndDevice(
      userId,
      requestDeviceId,
      requestUserAgent,
    );

    if (!deviceTokens || deviceTokens.length === 0) {
      log.warn(
        "No device-scoped tokens found for user:",
        userId,
        "deviceId:",
        requestDeviceId,
      );
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // CRITICAL FIX: Check for token reuse with grace period
    // Allow a 5-second grace period to account for race conditions during simultaneous requests
    const presentedCreatedAt = new Date(record.createdAt).getTime();
    const GRACE_PERIOD_MS = 5000; // 5 seconds
    let foundNewer = false;

    for (const t of deviceTokens) {
      const tCreated = new Date(t.createdAt).getTime();
      const timeDiff = tCreated - presentedCreatedAt;

      // Only flag as reuse if:
      // 1. It's a different token
      // 2. It's not revoked
      // 3. It's newer by more than the grace period
      if (t.$id !== record.$id && !t.revoked && timeDiff > GRACE_PERIOD_MS) {
        foundNewer = true;
        break;
      }
    }

    if (foundNewer) {
      log.warn(
        "Refresh token reuse detected for user:",
        userId,
        "presentedDoc:",
        record.$id,
      );
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res
        .status(401)
        .json({ error: "Refresh token reuse detected. All sessions revoked." });
    }

    // 6) Load user
    const user = await users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 7) Issue new access token
    const newAccessPayload = {
      sub: user.$id,
      role: user.prefs?.role || "user",
    };
    const newAccessToken = signAccessToken(newAccessPayload);

    // 8) Rotate refresh token
    const newRefreshPayload = { sub: user.$id };
    const newRefreshToken = signRefreshToken(newRefreshPayload);

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
        persistErr?.message || persistErr,
      );
      // Return access token only without rotation
      const cookieConfig = getCookieDomain(req);
      const cookieOptions = {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: 15 * 60 * 1000,
        path: "/",
      };

      if (cookieConfig.domain) {
        cookieOptions.domain = cookieConfig.domain;
      }

      console.log("[Admin Refresh Fallback] Cookie options:", cookieOptions);
      res.cookie("accessToken", newAccessToken, cookieOptions);
      return res.status(200).json({ message: "Token refreshed (partial)" });
    }

    // Revoke old token
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
          },
        )
        .catch(() => {}); // Non-fatal
    } catch (revErr) {
      log.error(
        "Failed to revoke old refresh token after rotation:",
        revErr?.message || revErr,
      );
    }

    const cookieConfig = getCookieDomain(req);
    const cookieOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      cookieOptions.domain = cookieConfig.domain;
    }

    console.log("[Admin Refresh] Cookie options:", cookieOptions);

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Tokens refreshed" });
  } catch (error) {
    log.error("Token refresh failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid refresh token." });
  }
};

/**
 * Logout: Revoke the refresh token presented by user.
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
      return res.status(400).json({ error: "Missing refresh token." });

    // Try to decode to get userId (signature may be invalid)
    let decoded = null;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      // signature invalid -> still attempt to find a record by hash (no userId)
    }

    const hashedRefreshToken = hashToken(refreshToken);

    // Find by tokenHash (and userId if available)
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
      queries,
    );

    if (!result || !result.documents || result.documents.length === 0) {
      return res.status(200).json({ message: "Logged out." }); // idempotent
    }

    for (const doc of result.documents) {
      if (!doc.revoked) {
        await revokeRefreshTokenById(doc.$id).catch((e) =>
          log.error("Failed to revoke token in logout:", e),
        );
      }
    }

    const cookieConfig = getCookieDomain(req);
    const clearOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      clearOptions.domain = cookieConfig.domain;
    }

    console.log("[Admin Logout] Clear cookie options:", clearOptions);
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);

    return res.status(200).json({ message: "Logged out." });
  } catch (error) {
    log.error("Logout failed:", error?.message || error);
    return res.status(500).json({ error: "Logout failed." });
  }
};

// Add new endpoint to get current user:
const getCurrentUser = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await users.get(decoded.sub);

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    log.error("Get current user failed:", error?.message || error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = {
  signup,
  signin,
  handleRefreshToken,
  logout,
  findTokensByUserAndDevice,
  getCurrentUser,
  // Export helper fns for testing if needed
  _internal: {
    persistRefreshToken,
    findRefreshTokenRecord,
    revokeRefreshTokenById,
    revokeAllUserRefreshTokens,
  },
};
