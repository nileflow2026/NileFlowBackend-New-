const bcrypt = require("bcryptjs");
const { env } = require("../../src/env");
const { Query, ID } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  hashToken,
  timeframeToMs,
} = require("../../utils/tokenManager");
const {
  sendVendorOnboardingEmails,
} = require("../../services/vendorMailService");

// Logger
const log = {
  info: (...args) => console.info("[vendor-auth]", ...args),
  warn: (...args) => console.warn("[vendor-auth]", ...args),
  error: (...args) => console.error("[vendor-auth]", ...args),
};

/**
 * Get appropriate cookie domain based on request origin for vendor
 */
function getCookieDomain(req) {
  const origin = req.get("origin") || req.get("referer");
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";

  console.log("[Vendor Cookie Domain Debug]", {
    origin,
    host,
    protocol,
    isSecure: protocol === "https",
  });

  // Check if backend and frontend are on different domains (cross-origin)
  const isCrossOrigin =
    origin &&
    host &&
    !origin.includes(host) &&
    !host.includes(origin.replace("https://", "").replace("http://", ""));

  if (isCrossOrigin) {
    console.log(
      "[Vendor Cookie] Cross-origin detected - no domain restriction",
    );
    return {
      domain: undefined, // No domain restriction for cross-origin
      secure: protocol === "https",
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
    console.log("[Vendor Cookie] Using localhost - no domain restriction");
    return { domain: undefined, secure: false, sameSite: "lax" };
  }

  // Same-origin vendor production domains
  if (
    (origin && origin.includes("vendor.nileflowafrica.com")) ||
    (host && host.includes("vendor.nileflowafrica.com"))
  ) {
    console.log(
      "[Vendor Cookie] Using vendor.nileflowafrica.com domain (same-origin)",
    );
    return {
      domain: ".vendor.nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // Fallback for nileflowafrica.com
  if (
    (origin && origin.includes("nileflowafrica.com")) ||
    (host && host.includes("nileflowafrica.com"))
  ) {
    console.log(
      "[Vendor Cookie] Using nileflowafrica.com domain (same-origin)",
    );
    return {
      domain: ".nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // Default - no domain restriction
  console.log("[Vendor Cookie] Using default - no domain restriction");
  return {
    domain: undefined,
    secure: protocol === "https",
    sameSite: "lax",
  };
}

/**
 * Persist refresh token
 */
async function persistRefreshToken({
  vendorId,
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
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    docId,
    {
      vendorId,
      refreshToken: hashedRefreshToken,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
      ip,
      userAgent,
      deviceId,
      rotatedFrom,
    },
  );
}

/**
 * Find refresh token by hash
 */
async function findRefreshTokenRecordByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const result = await db.listDocuments(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    [Query.equal("refreshToken", tokenHash)],
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

/**
 * Find tokens for vendor + device
 */
async function findTokensByVendorAndDevice(vendorId, deviceId, userAgent) {
  if (deviceId) {
    const res = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_SESSIONS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId), Query.equal("deviceId", deviceId)],
    );
    return res?.documents || [];
  }
  if (userAgent) {
    const res = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_SESSIONS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId), Query.equal("userAgent", userAgent)],
    );
    return res?.documents || [];
  }
  const res = await db.listDocuments(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    [Query.equal("vendorId", vendorId)],
  );
  return res?.documents || [];
}

/**
 * Revoke refresh token by ID
 */
async function revokeRefreshTokenById(docId) {
  return db.updateDocument(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    docId,
    { revoked: true, revokedAt: new Date().toISOString() },
  );
}

/**
 * Revoke all vendor refresh tokens
 */
async function revokeAllVendorRefreshTokens(vendorId) {
  const res = await db.listDocuments(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    [Query.equal("vendorId", vendorId)],
  );

  if (!res || !res.documents) return 0;

  let count = 0;
  for (const doc of res.documents) {
    if (!doc.revoked) {
      await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_SESSIONS_COLLECTION_ID,
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
 * Sanitize vendor object
 */
function sanitizeVendor(vendorObj) {
  const { password, confirmPassword, ...sanitized } = vendorObj;
  return {
    id: sanitized.$id,
    name: sanitized.name,
    storeName: sanitized.storeName,
    email: sanitized.email,
    isActive: sanitized.isActive,
    category: sanitized.category || "",
    storeDescription: sanitized.storeDescription || "",
    location: sanitized.location || "",
    profileImage: sanitized.profileImage || "",
    coverImage: sanitized.coverImage || "",
    socialLinks: sanitized.socialLinks || {},
    storeStats: sanitized.storeStats || {},
  };
}

const vendorauthController = {
  /**
   * Vendor Registration
   */
  async registerVendor(req, res) {
    try {
      const {
        name,
        storeName,
        email,
        password,
        confirmPassword,
        category,
        storeDescription,
        location,
        deviceId,
      } = req.body;

      // Validation
      if (
        !name ||
        !storeName ||
        !email ||
        !password ||
        !category ||
        !storeDescription
      ) {
        return res.status(400).json({
          success: false,
          error: "All required fields must be provided",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Passwords do not match",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 8 characters",
        });
      }

      if (storeDescription.length < 20) {
        return res.status(400).json({
          success: false,
          error: "Store description must be at least 20 characters",
        });
      }

      // Check if vendor exists
      const existingVendors = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        [Query.equal("email", email)],
      );

      if (existingVendors.total > 0) {
        return res.status(400).json({
          success: false,
          error: "Vendor with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      const storeStatsObject = {
        totalProducts: 0,
        totalSales: 0,
        rating: 0,
      };

      // Create vendor
      // Create vendor
      const vendor = await db.createDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        ID.unique(),
        {
          name,
          storeName,
          email,
          password: hashedPassword,
          isActive: true,
          category,
          storeDescription,
          location: location || "",
          profileImage: "",
          coverImage: "",
          socialLinks: {},
          storeStats: JSON.stringify(storeStatsObject),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      );

      // Send onboarding emails to vendor (fire and forget - don't block signup)
      sendVendorOnboardingEmails({
        vendorName: name,
        vendorEmail: email,
      }).catch((err) => {
        log.error("Failed to send vendor onboarding emails:", err?.message);
        // Don't throw - continue with signup even if emails fail
      });

      // Generate tokens
      const accessPayload = { sub: vendor.$id, role: "vendor" };
      const accessToken = signAccessToken(accessPayload);

      const refreshPayload = { sub: vendor.$id };
      const refreshToken = signRefreshToken(refreshPayload);

      // Persist refresh token
      try {
        await persistRefreshToken({
          vendorId: vendor.$id,
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

      console.log("[Vendor Signup] Cookie options:", cookieOptions);

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "Vendor account created successfully",
        vendor: sanitizeVendor(vendor),
      });
    } catch (error) {
      log.error("Registration error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to create vendor account",
      });
    }
  },

  /**
   * Vendor Login
   */
  async loginVendor(req, res) {
    try {
      const { email, password, deviceId } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      // Find vendor
      const vendors = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        [Query.equal("email", email)],
      );

      if (vendors.total === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const vendor = vendors.documents[0];

      // Check if active
      if (!vendor.isActive) {
        return res.status(401).json({
          success: false,
          error: "Account is deactivated",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, vendor.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      // Generate tokens
      const accessPayload = { sub: vendor.$id, role: "vendor" };
      const accessToken = signAccessToken(accessPayload);

      const refreshPayload = { sub: vendor.$id };
      const refreshToken = signRefreshToken(refreshPayload);

      // Persist refresh token
      try {
        await persistRefreshToken({
          vendorId: vendor.$id,
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

      console.log("[Vendor Signin] Cookie options:", cookieOptions);

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      log.info("Vendor login successful:", vendor.email);

      res.json({
        success: true,
        message: "Login successful",
        vendor: sanitizeVendor(vendor),
      });
    } catch (error) {
      log.error("Login error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Login failed",
      });
    }
  },

  /**
   * Get Current Vendor
   */
  async getCurrentVendor(req, res) {
    try {
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
      }

      const decoded = verifyAccessToken(accessToken);
      const vendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        decoded.sub,
      );

      res.json({
        success: true,
        vendor: sanitizeVendor(vendor),
      });
    } catch (error) {
      log.error("Get vendor error:", error?.message || error);
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  },

  /**
   * Handle Refresh Token
   */
  async handleRefreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const { deviceId } = req.body || {};

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: "Missing refresh token",
        });
      }

      // Verify signature
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (verifyErr) {
        log.warn("Refresh token verification failed:", verifyErr?.message);
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token",
        });
      }

      const vendorId = decoded.sub;
      if (!vendorId) {
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token payload",
        });
      }

      // Find persisted token
      const record = await findRefreshTokenRecordByHash(refreshToken);
      if (!record) {
        log.warn("Refresh token record not found for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
          log.error("Error revoking all tokens:", e),
        );
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token",
        });
      }

      // Check revoked/expired
      if (record.revoked) {
        log.warn("Revoked refresh token used for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
          log.error("Error revoking all tokens:", e),
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token revoked",
        });
      }

      if (new Date(record.expiresAt) < new Date()) {
        await revokeRefreshTokenById(record.$id).catch((e) =>
          log.error("Error revoking expired token:", e),
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token expired",
        });
      }

      // Device scoping
      const requestDeviceId = deviceId || req.body.deviceId || null;
      const requestUserAgent = req.headers?.["user-agent"] || null;

      const deviceTokens = await findTokensByVendorAndDevice(
        vendorId,
        requestDeviceId,
        requestUserAgent,
      );

      if (!deviceTokens || deviceTokens.length === 0) {
        log.warn("No device-scoped tokens found for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
          log.error("Error revoking all tokens:", e),
        );
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token",
        });
      }

      // Check for token reuse
      const presentedCreatedAt = new Date(record.createdAt).getTime();
      const GRACE_PERIOD_MS = 5000;
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
        log.warn("Refresh token reuse detected for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
          log.error("Error revoking all tokens:", e),
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token reuse detected. All sessions revoked.",
        });
      }

      // Load vendor
      const vendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      // Issue new tokens
      const newAccessPayload = { sub: vendor.$id, role: "vendor" };
      const newAccessToken = signAccessToken(newAccessPayload);

      const newRefreshPayload = { sub: vendor.$id };
      const newRefreshToken = signRefreshToken(newRefreshPayload);

      // Persist new token
      let newDoc = null;
      try {
        newDoc = await persistRefreshToken({
          vendorId: vendor.$id,
          refreshToken: newRefreshToken,
          ip: req.ip || null,
          userAgent: requestUserAgent,
          deviceId: requestDeviceId,
          rotatedFrom: record.$id,
        });
      } catch (persistErr) {
        log.error(
          "Failed to persist rotated refresh token:",
          persistErr?.message,
        );
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          domain: "localhost",
          maxAge: 15 * 60 * 1000,
          path: "/",
        });
        return res.status(200).json({
          success: true,
          message: "Token refreshed (partial)",
        });
      }

      // Revoke old token
      try {
        await revokeRefreshTokenById(record.$id);
        await db
          .updateDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_SESSIONS_COLLECTION_ID,
            record.$id,
            {
              rotatedTo: newDoc.$id,
              rotatedAt: new Date().toISOString(),
            },
          )
          .catch(() => {});
      } catch (revErr) {
        log.error("Failed to revoke old refresh token:", revErr?.message);
      }

      // Set new cookies
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

      console.log("[Vendor Refresh] Cookie options:", cookieOptions);

      res.cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Tokens refreshed",
      });
    } catch (error) {
      log.error("Token refresh failed:", error?.message || error);
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }
  },

  /**
   * Logout Vendor
   */
  async logoutVendor(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
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
                Query.equal("vendorId", decoded.sub),
              ]
            : [Query.equal("refreshToken", hashedRefreshToken)];

        const result = await db.listDocuments(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_SESSIONS_COLLECTION_ID,
          queries,
        );

        if (result && result.documents && result.documents.length > 0) {
          for (const doc of result.documents) {
            if (!doc.revoked) {
              await revokeRefreshTokenById(doc.$id).catch((e) =>
                log.error("Failed to revoke token in logout:", e),
              );
            }
          }
        }
      }

      // Clear cookies
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

      console.log("[Vendor Logout] Cookie options:", cookieOptions);

      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      log.error("Logout error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
      });
    }
  },
};

module.exports = vendorauthController;
