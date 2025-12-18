// services/user.service.js

const { ID, Query } = require("node-appwrite");
const logger = require("../utils/logger");
const { env } = require("../src/env");
const { db } = require("../src/appwrite");

class UserService {
  constructor() {
    this.collectionId = env.APPWRITE_USER_COLLECTION_ID;
  }

  async createProfile(data) {
    const { userId, email, username, phone, role, avatarUrl } = data;

    try {
      // Check if profile already exists
      const existing = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("userId", [userId])]
      );

      if (existing.total > 0) {
        throw new Error("Profile already exists");
      }

      const profile = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        userId, // Use same ID as user for 1:1 mapping
        {
          userId,
          email,
          username,
          phone: phone || "",
          role: role || "customer",
          avatar: avatarUrl,
          status: "active",
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            theme: "light",
          },
          metadata: {
            signupSource: "web",
            lastLogin: null,
            loginCount: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        }
      );

      logger.info("User profile created", { userId, email });
      return profile;
    } catch (error) {
      logger.error("Profile creation failed", { userId, error: error.message });
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const profiles = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("userId", [userId])]
      );

      if (profiles.total === 0) {
        return null;
      }

      return profiles.documents[0];
    } catch (error) {
      logger.error("Profile fetch failed", { userId, error: error.message });
      throw error;
    }
  }

  async updateProfile(userId, updates) {
    try {
      const profiles = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("userId", [userId])]
      );

      if (profiles.total === 0) {
        throw new Error("Profile not found");
      }

      const profile = profiles.documents[0];

      // Apply optimistic concurrency
      if (updates.version && updates.version !== profile.version) {
        throw new Error("Concurrent modification detected");
      }

      const updated = await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        profile.$id,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
          version: (profile.version || 1) + 1,
        }
      );

      logger.info("Profile updated", { userId, updates: Object.keys(updates) });
      return updated;
    } catch (error) {
      logger.error("Profile update failed", { userId, error: error.message });
      throw error;
    }
  }

  async deleteProfile(userId) {
    try {
      const profiles = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("userId", [userId])]
      );

      if (profiles.total === 0) {
        return; // Already deleted
      }

      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        profiles.documents[0].$id
      );

      logger.info("Profile deleted", { userId });
    } catch (error) {
      logger.error("Profile deletion failed", { userId, error: error.message });
      throw error;
    }
  }

  async searchUsers(query, options = {}) {
    try {
      const queries = [];

      if (query.email) {
        queries.push(Query.equal("email", [query.email]));
      }

      if (query.username) {
        queries.push(Query.search("username", query.username));
      }

      if (query.role) {
        queries.push(Query.equal("role", [query.role]));
      }

      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        queries,
        options.limit || 50,
        options.offset || 0,
        options.orderField || "createdAt",
        options.orderType || "DESC"
      );

      return {
        data: result.documents,
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      };
    } catch (error) {
      logger.error("User search failed", { query, error: error.message });
      throw error;
    }
  }

  async updateLastLogin(userId, ipAddress, userAgent) {
    try {
      await this.updateProfile(userId, {
        metadata: {
          lastLogin: new Date().toISOString(),
          lastLoginIp: ipAddress,
          lastUserAgent: userAgent,
        },
        $increment: {
          "metadata.loginCount": 1,
        },
      });
    } catch (error) {
      // Non-critical, just log
      logger.warn("Last login update failed", { userId, error: error.message });
    }
  }
}

module.exports = new UserService();
