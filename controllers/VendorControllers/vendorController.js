// controllers/vendorController.js
const { Query, Storage, ID } = require("node-appwrite");
const { db } = require("../../src/appwrite");
const { env } = require("../../src/env");

const vendorController = {
  // Update Vendor Profile
  async updateProfile(req, res) {
    try {
      const vendorId = req.user.userId; // CHANGED HERE
      const updates = req.body;

      const updatedVendor = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );

      const { password: _, ...vendorWithoutPassword } = updatedVendor;

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          vendor: vendorWithoutPassword,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }
  },

  // In your vendorController.js
  async updateProfilePicture(req, res) {
    try {
      const vendorId = req.vendorId;

      console.log("Profile picture update request received:", {
        vendorId,
        hasFile: !!req.file,
        fileInfo: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : "No file",
      });

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // Initialize Appwrite Storage
      const storage = new Storage()
        .setEndpoint(env.APPWRITE_ENDPOINT) // Your Appwrite endpoint
        .setProject(env.APPWRITE_PROJECT_ID) // Your project ID
        .setKey(env.APPWRITE_API_KEY); // Your API key

      // Generate unique file ID
      const fileId = ID.unique();
      const fileName = `vendor-avatar-${vendorId}-${Date.now()}${path.extname(req.file.originalname)}`;

      console.log("Uploading to Appwrite:", { fileId, fileName });

      // Upload file to Appwrite Storage
      const file = await storage.createFile(
        env.APPWRITE_STORAGE_ID, // Your bucket ID for profile pictures
        fileId,
        req.file.buffer, // File buffer from multer memory storage
        [
          `user:${vendorId}`, // Permission for the user
          "role:all", // Adjust permissions as needed
        ]
      );

      console.log("File uploaded to Appwrite:", file);

      // Get file preview URL (or you can use getFileView or getFileDownload)
      const fileUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${env.APPWRITE_PROJECT_ID}`;

      // Update vendor with new profile picture URL
      const updatedVendor = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
        {
          avatar: fileUrl,
          avatarFileId: fileId, // Store file ID for future deletion/updates
          updatedAt: new Date().toISOString(),
        }
      );

      const { password: _, ...vendorWithoutPassword } = updatedVendor;

      res.json({
        success: true,
        message: "Profile picture updated successfully",
        data: {
          vendor: vendorWithoutPassword,
          fileUrl: fileUrl,
        },
      });
    } catch (error) {
      console.error("Update profile picture error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to update profile picture: " + error.message,
      });
    }
  },

  // Controller to remove profile picture
  async removeProfilePicture(req, res) {
    try {
      const vendorId = req.vendorId;

      // Get current vendor data to find the file ID
      const currentVendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId
      );

      // If vendor has an avatar file ID, delete it from Appwrite
      if (currentVendor.avatarFileId) {
        const storage = new Storage()
          .setEndpoint(env.APPWRITE_ENDPOINT)
          .setProject(env.APPWRITE_PROJECT_ID)
          .setKey(env.APPWRITE_API_KEY);

        await storage.deleteFile(
          env.APPWRITE_BUCKET_ID,
          currentVendor.avatarFileId
        );
      }

      // Update vendor to remove avatar
      const updatedVendor = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId,
        {
          avatar: null,
          avatarFileId: null,
          updatedAt: new Date().toISOString(),
        }
      );

      const { password: _, ...vendorWithoutPassword } = updatedVendor;

      res.json({
        success: true,
        message: "Profile picture removed successfully",
        data: {
          vendor: vendorWithoutPassword,
        },
      });
    } catch (error) {
      console.error("Remove profile picture error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove profile picture",
      });
    }
  },
  // Get Vendor Dashboard Stats
  async getDashboardStats(req, res) {
    try {
      const vendorId = req.vendorId;

      // Get vendor's products count
      const products = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        "products",
        [Query.equal("vendorId", vendorId)]
      );

      // Get vendor's orders (you'd need an orders collection)
      const orders = await db.listDocuments(env.VENDOR_DATABASE_ID, "orders", [
        Query.equal("vendorId", vendorId),
      ]);

      const stats = {
        totalProducts: products.total,
        totalOrders: orders.total,
        totalRevenue: orders.documents.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        ),
        pendingOrders: orders.documents.filter(
          (order) => order.status === "pending"
        ).length,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dashboard stats",
      });
    }
  },
};

module.exports = vendorController;
