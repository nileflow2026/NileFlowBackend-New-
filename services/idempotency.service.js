// services/idempotency.service.js
const { db } = require("./appwriteService");
const { ID, Query } = require("node-appwrite");
const logger = require("../utils/logger");
const { env } = require("../src/env");

class IdempotencyService {
  constructor() {
    this.collectionId = env.APPWRITE_IDEMPOTENCY_COLLECTION;
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours
  }

  async check(key) {
    try {
      if (!key) return null;

      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("key", [key])]
      );

      if (result.total === 0) return null;

      const doc = result.documents[0];

      // Check if expired
      if (new Date(doc.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }

      return doc.result;
    } catch (error) {
      logger.error("Idempotency check failed", { key, error: error.message });
      return null;
    }
  }

  async store(key, result) {
    try {
      await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        ID.unique(),
        {
          key,
          result,
          expiresAt: new Date(Date.now() + this.ttl).toISOString(),
          createdAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      // Don't fail the request if idempotency storage fails
      logger.warn("Idempotency storage failed", { key, error: error.message });
    }
  }

  async delete(key) {
    try {
      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.equal("key", [key])]
      );

      if (result.total > 0) {
        await db.deleteDocument(
          env.APPWRITE_DATABASE_ID,
          this.collectionId,
          result.documents[0].$id
        );
      }
    } catch (error) {
      logger.error("Idempotency deletion failed", {
        key,
        error: error.message,
      });
    }
  }

  async cleanupExpired() {
    try {
      const expired = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        this.collectionId,
        [Query.lessThan("expiresAt", new Date().toISOString())]
      );

      const deletePromises = expired.documents.map((doc) =>
        db.deleteDocument(env.APPWRITE_DATABASE_ID, this.collectionId, doc.$id)
      );

      await Promise.all(deletePromises);

      logger.info(`Cleaned up ${expired.total} expired idempotency keys`);
    } catch (error) {
      logger.error("Idempotency cleanup failed", { error: error.message });
    }
  }
}

module.exports = new IdempotencyService();
