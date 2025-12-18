// controllers/auth.controller.js
const crypto = require("crypto");

const idempotencyService = require("../services/idempotency.service");
const userService = require("../services/user.service");
const logger = require("../utils/logger");
const sanitizer = require("../utils/sanitizer");
const CompensationTracker = require("../utils/compensation-tracker");
const { ID, Query } = require("node-appwrite");
const AppwriteSessionService = require("../services/AppwriteSessionService");
const { env } = require("../src/env");

const signupCustomer = async (req, res) => {
  const transactionId = req.headers["x-transaction-id"] || crypto.randomUUID();

  try {
    // 1. Ensure Appwrite is connected
    await AppwriteSessionService.ensureConnected();

    // 2. Sanitize input
    const rawData = req.body;
    const sanitizedData = sanitizer.sanitize(rawData);

    const { email, password, username, phone } = sanitizedData;

    // 3. Validate required fields
    if (!email || !password || !username) {
      return res.status(400).json({
        error: "Email, password, and username are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // 4. Validate email format
    const validatedEmail = sanitizer.validateEmail(email);
    const validatedPassword = sanitizer.validatePassword(password);
    const validatedUsername = sanitizer.validateUsername(username);
    const validatedPhone = phone ? sanitizer.validatePhone(phone) : null;

    // 5. Check if user already exists
    try {
      const users = await AppwriteSessionService.getUsers();
      const existingUser = await users.list([
        Query.equal("email", [validatedEmail]),
      ]);

      if (existingUser.total > 0) {
        return res.status(409).json({
          error: "User with this email already exists",
          code: "USER_EXISTS",
        });
      }
    } catch (error) {
      console.warn("User existence check warning:", error.message);
      // Continue if check fails
    }

    // 6. Create user
    let user;
    try {
      // Get users service
      const users = await AppwriteSessionService.getUsers();

      // Create Appwrite user
      user = await AppwriteSessionService.createUser(
        validatedEmail,
        validatedPassword,
        validatedUsername,
        validatedPhone
      );

      console.log("✅ User created:", user.$id);

      // Update user preferences
      await users.updatePrefs(user.$id, {
        theme: "light",
        role: "customer",
        phone: validatedPhone || "",
        emailVerified: false,
        signupIp: req.ip,
        signupUserAgent: req.get("User-Agent"),
      });

      console.log("✅ User prefs updated");
    } catch (creationError) {
      console.error("User creation failed:", creationError);

      // If user creation fails, return appropriate error
      if (creationError.code === 409) {
        return res.status(409).json({
          error: "User with this email already exists",
          code: "USER_EXISTS",
        });
      }

      throw creationError;
    }

    // 7. Create session
    let session;
    try {
      const account = await AppwriteSessionService.getAccount();
      session = await account.createEmailPasswordSession(
        validatedEmail,
        validatedPassword
      );

      console.log("✅ Session created:", session.$id);
    } catch (sessionError) {
      console.error("Session creation failed:", sessionError);

      // If session fails, try to delete the user (cleanup)
      try {
        const users = await AppwriteService.getUsers();
        await users.delete(user.$id);
        console.log("⚠️  Cleaned up user after session creation failure");
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }

      throw sessionError;
    }

    // 8. Create profile in database (optional)
    try {
      const db = await AppwriteSessionService.getDatabase();

      await db.createDocument(
        env.APPWRITE_DATABASE_ID || "nile_mart_db",
        env.APPWRITE_USER_COLLECTION_ID || "user_profiles",
        ID.unique(),
        {
          $id: user.$id,
          email: validatedEmail,
          username: validatedUsername,
          phone: validatedPhone,
          role: "customer",
          createdAt: new Date().toISOString(),
        }
      );

      console.log("✅ Profile created");
    } catch (profileError) {
      console.warn(
        "Profile creation failed (non-critical):",
        profileError.message
      );
      // Don't fail the whole signup if profile creation fails
    }

    // 9. Set session cookie
    res.cookie("session_id", session.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // 10. Success response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        userId: user.$id,
        email: user.email,
        username: user.name,
        sessionId: session.$id,
        expiresAt: session.expire,
      },
      meta: {
        transactionId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);

    // Error mapping
    const errorHandlers = {
      409: () =>
        res.status(409).json({
          error: "User already exists",
          code: "USER_EXISTS",
        }),
      400: () =>
        res.status(400).json({
          error: error.message || "Invalid input",
          code: "INVALID_INPUT",
        }),
      401: () =>
        res.status(401).json({
          error: "Authentication failed",
          code: "AUTH_FAILED",
        }),
      default: () =>
        res.status(500).json({
          error: "Registration failed",
          code: "REGISTRATION_FAILED",
          transactionId,
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        }),
    };

    const handler = errorHandlers[error.code] || errorHandlers.default;
    return handler();
  }
};

const signinCustomer = async (req, res) => {
  try {
    // 1. Ensure Appwrite is connected
    await AppwriteSessionService.ensureConnected();

    const { email, password } = req.body;

    // 2. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // 3. Sanitize inputs
    const validatedEmail = sanitizer.validateEmail(email);
    const validatedPassword = sanitizer.sanitize(password);

    // 4. Create session
    const account = await AppwriteSessionService.getAccount();
    const session = await account.createEmailPasswordSession(
      validatedEmail,
      validatedPassword
    );

    // 5. Get user details
    const users = await AppwriteSessionService.getUsers();
    const user = await users.get(session.userId);

    // 6. Update last login (optional)
    try {
      const currentPrefs = user.prefs || {};
      await users.updatePrefs(user.$id, {
        ...currentPrefs,
        lastLogin: new Date().toISOString(),
        lastLoginIp: req.ip,
      });
    } catch (prefError) {
      console.warn("Failed to update last login:", prefError.message);
    }

    // 7. Set session cookie
    res.cookie("session_id", session.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // 8. Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        userId: user.$id,
        email: user.email,
        username: user.name,
        role: user.prefs?.role || "customer",
        sessionId: session.$id,
        expiresAt: session.expire,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.code === 401) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    if (error.code === 404) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    return res.status(500).json({
      error: "Login failed",
      code: "LOGIN_FAILED",
    });
  }
};

const logoutCustomer = async (req, res) => {
  try {
    await AppwriteService.ensureConnected();

    const sessionId = req.cookies.session_id;

    if (sessionId) {
      const account = await AppwriteService.getAccount();
      await account.deleteSession(sessionId);
    }

    // Clear cookie
    res.clearCookie("session_id");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Still clear cookie even if logout fails
    res.clearCookie("session_id");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    await AppwriteService.ensureConnected();

    const sessionId = req.cookies.session_id;

    if (!sessionId) {
      return res.status(401).json({
        error: "No active session",
        code: "SESSION_REQUIRED",
      });
    }

    // Get account info (validates session)
    const account = await AppwriteService.getAccount();
    const user = await account.get();

    // Get full user details
    const users = await AppwriteService.getUsers();
    const fullUser = await users.get(user.$id);

    return res.status(200).json({
      success: true,
      data: {
        userId: fullUser.$id,
        email: fullUser.email,
        username: fullUser.name,
        role: fullUser.prefs?.role || "customer",
        phone: fullUser.prefs?.phone || null,
        avatar: fullUser.prefs?.avatar || null,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);

    // Clear invalid session cookie
    res.clearCookie("session_id");

    return res.status(401).json({
      error: "Session invalid or expired",
      code: "SESSION_INVALID",
    });
  }
};

// Add to your auth.controller.js
const refreshSession = async (req, res) => {
  try {
    await AppwriteService.ensureConnected();

    const sessionId = req.cookies.session_id;
    const account = await AppwriteSessionService.getAccount();

    if (!sessionId) {
      return res.status(400).json({
        error: "No session to refresh",
        code: "NO_SESSION",
      });
    }

    // Get current session details
    const currentSession = await account.getSession(sessionId);
    const users = await AppwriteSessionService.getUsers();
    const user = await users.get(currentSession.userId);

    // Create new session
    const newSession = await account.createEmailPasswordSession(
      user.email,
      req.body.password // Require password for security
    );

    // Delete old session
    await account.deleteSession(sessionId);

    // Set new session cookie
    res.cookie("session_id", newSession.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Session refreshed",
      data: {
        sessionId: newSession.$id,
        expiresAt: newSession.expire,
      },
    });
  } catch (error) {
    console.error("Session refresh failed:", error);

    if (error.code === 401) {
      // Clear invalid session
      res.clearCookie("session_id");
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    return res.status(500).json({
      error: "Failed to refresh session",
      code: "REFRESH_FAILED",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    await AppwriteSessionService.ensureConnected();

    const { currentPassword, newPassword } = req.body;
    const sessionId = req.cookies.session_id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current and new password required",
        code: "MISSING_PASSWORDS",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters",
        code: "WEAK_PASSWORD",
      });
    }

    // Verify current password by attempting to create new session
    const account = await AppwriteSessionService.getAccount();
    const currentUser = await account.get();

    try {
      await account.createEmailPasswordSession(
        currentUser.email,
        currentPassword
      );
    } catch (authError) {
      return res.status(401).json({
        error: "Current password is incorrect",
        code: "INVALID_PASSWORD",
      });
    }

    // Update password
    await account.updatePassword(newPassword);

    // Logout all other sessions for security
    const sessions = await account.listSessions();
    const deletePromises = sessions.sessions
      .filter((s) => s.$id !== sessionId)
      .map((s) => account.deleteSession(s.$id));

    await Promise.all(deletePromises);

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully. Other sessions have been logged out.",
    });
  } catch (error) {
    console.error("Password change failed:", error);
    return res.status(500).json({
      error: "Failed to change password",
      code: "PASSWORD_CHANGE_FAILED",
    });
  }
};

module.exports = {
  signupCustomer,
  signinCustomer,
  logoutCustomer,
  getCurrentUser,
  refreshSession,
  changePassword,
};
