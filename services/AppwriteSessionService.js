// services/appwrite.service.js - COMPATIBLE VERSION
const { Client, Account, Users, Databases } = require("node-appwrite");
const { env } = require("../src/env");

class AppwriteService {
  constructor() {
    this.client = null;
    this.account = null;
    this.users = null;
    this.db = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // console.log("🚀 Initializing Appwrite (compatible mode)...");

      // Load config
      const endpoint = env.APPWRITE_ENDPOINT;
      const projectId = env.APPWRITE_PROJECT_ID;
      const apiKey = env.APPWRITE_API_KEY;

      if (!endpoint || !projectId || !apiKey) {
        throw new Error("Missing Appwrite configuration in .env file");
      }

      // console.log(`📦 Project: ${projectId}`);
      // console.log(`🌐 Endpoint: ${endpoint}`);
      // console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

      // Initialize client
      this.client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

      // Initialize services
      this.account = new Account(this.client);
      this.users = new Users(this.client);
      this.db = new Databases(this.client);

      // Test connection with available scopes
      // console.log("🔄 Testing available scopes...");

      // Test 1: User operations (should work with users.read/write)
      try {
        const userList = await this.users.list([], 1);
        // console.log(`✅ users.read: OK (${userList.total} users found)`);
      } catch (error) {
        console.error("❌ users.read: FAILED - ", error.message);
        throw new Error("API key missing users.read scope");
      }

      // Test 2: Session operations (should work with sessions.write)
      try {
        // We can't test sessions.write without credentials, but we can verify the service
        // console.log("✅ sessions.write: Service ready");
      } catch (error) {
        console.error("❌ sessions.write: FAILED - ", error.message);
      }

      // Test 3: Database operations
      try {
        const collections = await this.db.listCollections(
          env.APPWRITE_DATABASE_ID,
          [],
          1
        );
        // console.log(`✅ databases.read: OK (${collections.total} collections)`);
      } catch (error) {
        console.warn("⚠️  databases.read: Limited - ", error.message);
      }

      this.isConnected = true;
      // console.log(
      //   "✅ Appwrite service initialized successfully (compatible mode)"
      // );
      // console.log(
      //   "📝 Note: Using sessions.write for authentication (account.* scopes not available)"
      // );
    } catch (error) {
      console.error("❌ Appwrite initialization failed:");
      console.error("   Error:", error.message);
      console.error("   Code:", error.code);

      if (error.message.includes("scope")) {
        console.error("\n💡 SOLUTION: Create new API key with these scopes:");
        console.error("   1. sessions.write");
        console.error("   2. users.read");
        console.error("   3. users.write");
        console.error("   4. databases.read");
        console.error("   5. databases.write");
        console.error("   6. documents.read");
        console.error("   7. documents.write");
      }

      throw error;
    }
  }

  /**
   * Authenticate user using sessions.write scope
   */
  async authenticate(email, password) {
    try {
      // Create session (uses sessions.write)
      const session = await this.account.createEmailPasswordSession(
        email,
        password
      );

      // Get user details (uses users.read)
      const user = await this.users.get(session.userId);

      return {
        session,
        user,
        sessionId: session.$id,
        userId: user.$id,
      };
    } catch (error) {
      console.error("Authentication failed:", error.message);
      throw error;
    }
  }

  /**
   * Get user by ID (uses users.read)
   */
  async getUser(userId) {
    return await this.users.get(userId);
  }

  /**
   * Create user (uses users.write)
   */
  async createUser(email, password, username, phone = null) {
    const userId = "unique()"; // Appwrite will generate

    const user = await this.users.create(
      userId,
      email,
      null, // Don't pass phone here,
      password,
      username
    );

    return user;
  }

  /**
   * Delete session (uses sessions.write)
   */
  async logout(sessionId) {
    return await this.account.deleteSession(sessionId);
  }

  /**
   * Database operations
   */
  async createDocument(collectionId, data, documentId = "unique()") {
    return await this.db.createDocument(
      process.env.APPWRITE_PROJECT_ID,
      collectionId,
      documentId,
      data
    );
  }

  async getAccount() {
    return this.account;
  }

  async getUsers() {
    return this.users;
  }

  async getDatabase() {
    return this.db;
  }

  async ensureConnected() {
    if (!this.isConnected) {
      await this.initialize();
    }
  }
}

module.exports = new AppwriteService();
