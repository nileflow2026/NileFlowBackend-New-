// controllers/riderAuthController.js
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
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// Logger
const log = {
  info: (...args) => console.info("[rider-auth]", ...args),
  warn: (...args) => console.warn("[rider-auth]", ...args),
  error: (...args) => console.error("[rider-auth]", ...args),
};

// Ensure critical env values exist
if (
  !env.APPWRITE_DATABASE_ID ||
  !env.RIDER_COLLECTION_ID ||
  !env.RIDER_SESSIONS_COLLECTION_ID
) {
  throw new Error(
    "Missing Rider collection env variables. Please set APPWRITE_DATABASE_ID, RIDER_COLLECTION_ID, RIDER_SESSIONS_COLLECTION_ID."
  );
}

/**
 * Persist refresh token
 */
async function persistRefreshToken({
  riderId,
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
    env.RIDER_SESSIONS_COLLECTION_ID,
    docId,
    {
      riderId,
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
 * Find refresh token by hash
 */
async function findRefreshTokenRecordByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const result = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_SESSIONS_COLLECTION_ID,
    [Query.equal("refreshToken", tokenHash)]
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

/**
 * Find tokens for rider + device
 */
async function findTokensByRiderAndDevice(riderId, deviceId, userAgent) {
  if (deviceId) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_SESSIONS_COLLECTION_ID,
      [Query.equal("riderId", riderId), Query.equal("deviceId", deviceId)]
    );
    return res?.documents || [];
  }
  if (userAgent) {
    const res = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_SESSIONS_COLLECTION_ID,
      [Query.equal("riderId", riderId), Query.equal("userAgent", userAgent)]
    );
    return res?.documents || [];
  }
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_SESSIONS_COLLECTION_ID,
    [Query.equal("riderId", riderId)]
  );
  return res?.documents || [];
}

/**
 * Revoke refresh token by ID
 */
async function revokeRefreshTokenById(docId) {
  return db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_SESSIONS_COLLECTION_ID,
    docId,
    { revoked: true, revokedAt: new Date().toISOString() }
  );
}

/**
 * Revoke all rider refresh tokens
 */
async function revokeAllRiderRefreshTokens(riderId) {
  const res = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_SESSIONS_COLLECTION_ID,
    [Query.equal("riderId", riderId)]
  );

  if (!res || !res.documents) return 0;

  let count = 0;
  for (const doc of res.documents) {
    if (!doc.revoked) {
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.RIDER_SESSIONS_COLLECTION_ID,
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
 * Sanitize rider object
 */
function sanitizeRider(riderObj) {
  const { password, ...sanitized } = riderObj;
  return {
    id: sanitized.$id,
    name: sanitized.name,
    email: sanitized.email,
    phone: sanitized.phone || "",
    isActive: sanitized.isActive,
    vehicleType: sanitized.vehicleType || "",
    vehicleNumber: sanitized.vehicleNumber || "",
    licenseNumber: sanitized.licenseNumber || "",
    profileImage: sanitized.profileImage || "",
    status: sanitized.status || "offline",
    rating: sanitized.rating || 0,
    totalDeliveries: sanitized.totalDeliveries || 0,
  };
}

const riderAuthController = {
  /**
   * Rider Registration
   */
  async registerRider(req, res) {
    try {
      const {
        name,
        email,
        phone,
        password,
        confirmPassword,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        deviceId,
      } = req.body;

      // Validation
      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: "Name, email, phone, and password are required",
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

      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      // Check if rider exists
      const existingRiders = await db.listDocuments(
        env.RIDER_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        [Query.equal("email", email)]
      );

      if (existingRiders.total > 0) {
        return res.status(400).json({
          success: false,
          error: "Rider with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create rider
      const rider = await db.createDocument(
        env.RIDER_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        ID.unique(),
        {
          name,
          email,
          phone,
          password: hashedPassword,
          vehicleType: vehicleType || "",
          vehicleNumber: vehicleNumber || "",
          licenseNumber: licenseNumber || "",
          isActive: true,
          status: "offline",
          profileImage: "",
          rating: 0,
          totalDeliveries: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // Generate tokens
      const accessPayload = { sub: rider.$id, role: "rider" };
      const accessToken = signAccessToken(accessPayload);

      const refreshPayload = { sub: rider.$id };
      const refreshToken = signRefreshToken(refreshPayload);

      // Persist refresh token
      try {
        await persistRefreshToken({
          riderId: rider.$id,
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

      log.info("Rider registration successful:", rider.email);

      res.status(201).json({
        success: true,
        message: "Rider account created successfully",
        rider: sanitizeRider(rider),
      });
    } catch (error) {
      log.error("Registration error:", error?.message || error);
      res.status(500).json({
        success: false,
        error: "Failed to create rider account",
      });
    }
  },

  /**
   * Rider Login
   */
  async loginRider(req, res) {
    try {
      const { email, password, deviceId } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      // Find rider
      const riders = await db.listDocuments(
        env.RIDER_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        [Query.equal("email", email)]
      );

      if (riders.total === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const rider = riders.documents[0];

      // Check if active
      if (!rider.isActive) {
        return res.status(401).json({
          success: false,
          error: "Account is deactivated",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, rider.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      // Generate tokens
      const accessPayload = { sub: rider.$id, role: "rider" };
      const accessToken = signAccessToken(accessPayload);

      const refreshPayload = { sub: rider.$id };
      const refreshToken = signRefreshToken(refreshPayload);

      // Persist refresh token
      try {
        await persistRefreshToken({
          riderId: rider.$id,
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

      log.info("Rider login successful:", rider.email);

      res.json({
        success: true,
        message: "Login successful",
        rider: sanitizeRider(rider),
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
   * Get Current Rider
   */
  async getCurrentRider(req, res) {
    try {
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
      }

      const decoded = verifyAccessToken(accessToken);
      const rider = await db.getDocument(
        env.RIDER_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        decoded.sub
      );

      res.json({
        success: true,
        rider: sanitizeRider(rider),
      });
    } catch (error) {
      log.error("Get rider error:", error?.message || error);
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

      const riderId = decoded.sub;
      if (!riderId) {
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token payload",
        });
      }

      // Find persisted token
      const record = await findRefreshTokenRecordByHash(refreshToken);
      if (!record) {
        log.warn("Refresh token record not found for rider:", riderId);
        await revokeAllRiderRefreshTokens(riderId).catch((e) =>
          log.error("Error revoking all tokens:", e)
        );
        return res.status(401).json({
          success: false,
          error: "Invalid refresh token",
        });
      }

      // Check revoked/expired
      if (record.revoked) {
        log.warn("Revoked refresh token used for rider:", riderId);
        await revokeAllRiderRefreshTokens(riderId).catch((e) =>
          log.error("Error revoking all tokens:", e)
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token revoked",
        });
      }

      if (new Date(record.expiresAt) < new Date()) {
        await revokeRefreshTokenById(record.$id).catch((e) =>
          log.error("Error revoking expired token:", e)
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token expired",
        });
      }

      // Device scoping
      const requestDeviceId = deviceId || req.body.deviceId || null;
      const requestUserAgent = req.headers?.["user-agent"] || null;

      const deviceTokens = await findTokensByRiderAndDevice(
        riderId,
        requestDeviceId,
        requestUserAgent
      );

      if (!deviceTokens || deviceTokens.length === 0) {
        log.warn("No device-scoped tokens found for rider:", riderId);
        await revokeAllRiderRefreshTokens(riderId).catch((e) =>
          log.error("Error revoking all tokens:", e)
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
        log.warn("Refresh token reuse detected for rider:", riderId);
        await revokeAllRiderRefreshTokens(riderId).catch((e) =>
          log.error("Error revoking all tokens:", e)
        );
        return res.status(401).json({
          success: false,
          error: "Refresh token reuse detected. All sessions revoked.",
        });
      }

      // Load rider
      const rider = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        riderId
      );

      if (!rider) {
        return res.status(404).json({
          success: false,
          error: "Rider not found",
        });
      }

      // Issue new tokens
      const newAccessPayload = { sub: rider.$id, role: "rider" };
      const newAccessToken = signAccessToken(newAccessPayload);

      const newRefreshPayload = { sub: rider.$id };
      const newRefreshToken = signRefreshToken(newRefreshPayload);

      // Persist new token
      let newDoc = null;
      try {
        newDoc = await persistRefreshToken({
          riderId: rider.$id,
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
            env.APPWRITE_DATABASE_ID,
            env.RIDER_SESSIONS_COLLECTION_ID,
            record.$id,
            {
              rotatedTo: newDoc.$id,
              rotatedAt: new Date().toISOString(),
            }
          )
          .catch(() => {});
      } catch (revErr) {
        log.error("Failed to revoke old refresh token:", revErr?.message);
      }

      // Set new cookies
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
   * Logout Rider
   */
  async logoutRider(req, res) {
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
                Query.equal("riderId", decoded.sub),
              ]
            : [Query.equal("refreshToken", hashedRefreshToken)];

        const result = await db.listDocuments(
          env.RIDER_DATABASE_ID,
          env.RIDER_SESSIONS_COLLECTION_ID,
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

  async sendVerificationEmail(rider) {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(verificationToken);

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      rider.$id,
      {
        verificationToken: hashedToken,
        verificationTokenExpiry: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      }
    );

    // Send email with verification link
    const verificationLink = `${env.FRONTEND_URL}/rider/verify-email/${verificationToken}`;
    // Use your email service (SendGrid, Nodemailer, etc.)
  },

  async verifyEmail(req, res) {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    const riders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      [Query.equal("verificationToken", hashedToken)]
    );

    if (riders.total === 0) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    const rider = riders.documents[0];

    if (new Date(rider.verificationTokenExpiry) < new Date()) {
      return res.status(400).json({ error: "Verification token expired" });
    }

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      rider.$id,
      {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      }
    );

    res.json({ success: true, message: "Email verified successfully" });
  },

  async sendOTP(phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = hashToken(otp);

    // Store OTP in database with expiry
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.OTP_COLLECTION_ID,
      ID.unique(),
      {
        phone,
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false,
      }
    );

    // Send SMS via Twilio, Africa's Talking, etc.
    return otp; // In production, don't return this
  },

  async verifyOTP(req, res) {
    const { phone, otp } = req.body;
    const hashedOTP = hashToken(otp);

    const otpRecords = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.OTP_COLLECTION_ID,
      [
        Query.equal("phone", phone),
        Query.equal("otp", hashedOTP),
        Query.equal("verified", false),
      ]
    );

    if (otpRecords.total === 0) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const record = otpRecords.documents[0];

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.OTP_COLLECTION_ID,
      record.$id,
      { verified: true }
    );

    res.json({ success: true, message: "Phone verified successfully" });
  },

  async enableTwoFactor(req, res) {
    const riderId = req.rider.riderId;

    const secret = speakeasy.generateSecret({
      name: `NileMart Rider (${req.rider.email})`,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
      {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Will be true after verification
      }
    );

    res.json({
      success: true,
      secret: secret.base32,
      qrCode,
    });
  },

  async verifyTwoFactor(req, res) {
    const { token } = req.body;
    const riderId = req.rider.riderId;

    const rider = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId
    );

    const verified = speakeasy.totp.verify({
      secret: rider.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid 2FA token" });
    }

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
      { twoFactorEnabled: true }
    );

    res.json({ success: true, message: "2FA enabled successfully" });
  },
};

module.exports = riderAuthController;
