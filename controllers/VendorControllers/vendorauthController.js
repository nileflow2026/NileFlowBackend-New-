// controllers/authController.js

/* const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/Vendor/helpers');
const { env } = require('../../src/env');
const { Query } = require('node-appwrite');
const { db } = require('../../services/appwriteService');
const { ID } = require('node-appwrite');

const vendorauthController = {
    // Vendor Registration
    async registerVendor(req, res) {
        try {
            const { name, storeName, email, password, confirmPassword } = req.body;

            // Check if vendor already exists
            const existingVendors = await db.listDocuments(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_COLLECTION_ID,
                [Query.equal('email', email)]
            );

            if (existingVendors.total > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Vendor with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            const storeStatsObject = {
                totalProducts: 0,
                totalSales: 0,
                rating: 0
            };

            // Create vendor document
            const vendor = await db.createDocument(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_COLLECTION_ID,
                ID.unique(),
                {
                    name,
                    storeName,
                    email,
                    password: hashedPassword,
                    confirmPassword: confirmPassword,
                    isActive: true,
                    storeDescription: '',
                    profileImage: '',
                    coverImage: '',
                    socialLinks: {},
                    storeStats: JSON.stringify(storeStatsObject),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );

            // Generate JWT token
            const token = generateToken(vendor.$id);
 
            // Create session record
            await db.createDocument(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_SESSIONS_COLLECTION_ID,
                ID.unique(),
                {
                    vendorId: vendor.$id,
                    token,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date().toISOString()
                }
            );

            // Remove password from response
            const { password: _, ...vendorWithoutPassword } = vendor;

            res.status(201).json({
                success: true,
                message: 'Vendor account created successfully',
                data: {
                    vendor: vendorWithoutPassword,
                    token
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create vendor account'
            });
        }
    },

    // Vendor Login
    async loginVendor(req, res) {
        try {
            const { email, password } = req.body;

            // Find vendor by email
            const vendors = await db.listDocuments(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_COLLECTION_ID,
                [Query.equal('email', email)]
            );

            if (vendors.total === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            const vendor = vendors.documents[0];

            // Check if vendor is active
            if (!vendor.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is deactivated'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, vendor.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Generate token
            const token = generateToken(vendor.$id);

            // Update session
            await db.createDocument(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_SESSIONS_COLLECTION_ID,
                ID.unique(),
                {
                    vendorId: vendor.$id,
                    token,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date().toISOString()
                }
            );

            // Remove password from response
            const { password: _, ...vendorWithoutPassword } = vendor;

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    vendor: vendorWithoutPassword,
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    },

    async getCurrentVendor(req, res) {
    try {
        console.log('DEBUG: vendorId received in controller:', req.vendorId);

        if (!req.vendorId) {
            return res.status(400).json({
                success: false,
                error: "vendorId missing"
            });
        }

        const vendor = await db.getDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_COLLECTION_ID,
            req.vendorId
        );

        // Remove password
        const { password: _, ...vendorWithoutPassword } = vendor;

        res.json({
            success: true,
            data: { vendor: vendorWithoutPassword }
        });

    } catch (error) {
        console.error('Get vendor error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor data'
        });
    }
    },


    // Logout Vendor
    async logoutVendor(req, res) {
            try {
                const token = req.header('Authorization')?.replace('Bearer ', '');

                if (!token) {
                    return res.status(400).json({
                        success: false,
                        error: 'No token provided'
                    });
                }

                // Find the session by token
                const sessions = await db.listDocuments(
                    env.VENDOR_DATABASE_ID,
                    env.VENDOR_SESSIONS_COLLECTION_ID,
                    [Query.equal("token", token)]
                );

                if (sessions.total === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                const sessionId = sessions.documents[0].$id;

                // Delete session
                await db.deleteDocument(
                    env.VENDOR_DATABASE_ID,
                    env.VENDOR_SESSIONS_COLLECTION_ID,
                    sessionId
                );

                res.json({
                    success: true,
                    message: 'Logout successful'
                });

            } catch (error) {
                console.error('Logout error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Logout failed'
                });
            }
    }

};

module.exports = vendorauthController; */

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

// Logger
const log = {
  info: (...args) => console.info("[vendor-auth]", ...args),
  warn: (...args) => console.warn("[vendor-auth]", ...args),
  error: (...args) => console.error("[vendor-auth]", ...args),
};

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
    Date.now() + timeframeToMs(env.JWT_REFRESH_EXPIRES_IN || "30d")
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
    }
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
    [Query.equal("refreshToken", tokenHash)]
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
      [Query.equal("vendorId", vendorId), Query.equal("deviceId", deviceId)]
    );
    return res?.documents || [];
  }
  if (userAgent) {
    const res = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_SESSIONS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId), Query.equal("userAgent", userAgent)]
    );
    return res?.documents || [];
  }
  const res = await db.listDocuments(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    [Query.equal("vendorId", vendorId)]
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
    { revoked: true, revokedAt: new Date().toISOString() }
  );
}

/**
 * Revoke all vendor refresh tokens
 */
async function revokeAllVendorRefreshTokens(vendorId) {
  const res = await db.listDocuments(
    env.VENDOR_DATABASE_ID,
    env.VENDOR_SESSIONS_COLLECTION_ID,
    [Query.equal("vendorId", vendorId)]
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
        }
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
    storeDescription: sanitized.storeDescription || "",
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
      const { name, storeName, email, password, confirmPassword, deviceId } =
        req.body;

      // Validation
      if (!name || !storeName || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "All fields are required",
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

      // Check if vendor exists
      const existingVendors = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        [Query.equal("email", email)]
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
          storeDescription: "",
          profileImage: "",
          coverImage: "",
          socialLinks: {},
          storeStats: JSON.stringify(storeStatsObject),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

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
        [Query.equal("email", email)]
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
        decoded.sub
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
          log.error("Error revoking all tokens:", e)
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

      const deviceTokens = await findTokensByVendorAndDevice(
        vendorId,
        requestDeviceId,
        requestUserAgent
      );

      if (!deviceTokens || deviceTokens.length === 0) {
        log.warn("No device-scoped tokens found for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
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
        log.warn("Refresh token reuse detected for vendor:", vendorId);
        await revokeAllVendorRefreshTokens(vendorId).catch((e) =>
          log.error("Error revoking all tokens:", e)
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
        vendorId
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
            env.VENDOR_DATABASE_ID,
            env.VENDOR_SESSIONS_COLLECTION_ID,
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
};

module.exports = vendorauthController;
