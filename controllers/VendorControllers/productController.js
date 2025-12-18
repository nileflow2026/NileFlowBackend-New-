// controllers/productController.js
const { ID } = require("node-appwrite");
const { db, storage } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { Query } = require("node-appwrite");
const {
  CreateProductApprovalNotification,
} = require("../AdminControllers/notificationController");

const productController = {
  // Create Product
  async createProduct(req, res) {
    try {
      const vendorId = req.user.userId;

      const {
        name,
        description,
        price,
        categoryId, // Now using ID instead of name
        subcategoryId, // Add this for main products
        tags,
        inventory,
        attributes,
        image,
        images,
        // Add fields for main product
        type = "physical", // Default to physical
        brand = "",
        details = "",
        currency = "USD", // Default currency
        specifications = {}, // Default empty object
      } = req.body;

      // Generate SKU
      const generateSKU = () => {
        const prefix = "VEND";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
      };

      // Validation
      if (!name || !price || !categoryId) {
        return res.status(400).json({
          success: false,
          error: "Name, price, and category are required",
        });
      }

      // Parse attributes if they're sent as string
      let parsedAttributes = {};
      if (attributes) {
        if (typeof attributes === "string") {
          try {
            parsedAttributes = JSON.parse(attributes);
          } catch (error) {
            console.warn("Invalid attributes format, using empty object");
          }
        } else {
          parsedAttributes = attributes;
        }
      }

      // Get vendor details to include in main product
      let vendorDetails = null;
      try {
        const vendor = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          vendorId
        );
        vendorDetails = {
          id: vendor.$id,
          name: vendor.name,
          storeName: vendor.storeName,
          email: vendor.email,
          phone: vendor.phone,
          profilePicture: vendor.profilePicture || "",
          rating: vendor.rating || 0,
          totalSales: vendor.totalSales || 0,
          status: vendor.status || "active",
        };
      } catch (vendorError) {
        console.warn("Could not fetch vendor details:", vendorError.message);
        // Use minimal vendor info
        vendorDetails = {
          id: vendorId,
          storeName: "Vendor Store",
        };
      }

      // Generate unique ID for the product (use same ID for both collections)
      const productId = ID.unique();
      const sku = generateSKU(); // Generate SKU

      // 1. Create product in VENDOR'S collection (with vendor schema)
      const vendorProduct = await db.createDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          // Vendor product schema
          vendorId,
          name: name.trim(),
          description: description?.trim() || "",
          price: parseFloat(price),
          category: categoryId, // Store the ID
          tags: Array.isArray(tags)
            ? tags
            : tags
              ? tags.split(",").map((tag) => tag.trim())
              : [],
          inventory: parseInt(inventory) || 0,
          attributes: JSON.stringify(parsedAttributes),
          image: image || "",
          images: images || [],
          sku: sku, // Add SKU field
          isActive: true,
          isFeatured: false,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      const MAIN_VENDOR_COLLECTION_ID = env.MAIN_VENDORS_COLLECTION_ID; // Define this in your env or here

      try {
        // Check if vendor exists in main database
        await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          MAIN_VENDOR_COLLECTION_ID,
          vendorId
        );
        console.log(`✅ Vendor ${vendorId} already exists in main database`);
      } catch (error) {
        // Vendor doesn't exist, create it
        try {
          await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            MAIN_VENDOR_COLLECTION_ID,
            vendorId, // Use same ID for consistency
            {
              originalVendorId: vendorId,
              name: vendorDetails.name,
              storeName: vendorDetails.storeName,
              email: vendorDetails.email,
              phone: vendorDetails.phone,
              profilePicture: vendorDetails.profilePicture,
              rating: vendorDetails.rating,
              totalSales: vendorDetails.totalSales,
              status: vendorDetails.status,
              syncedAt: new Date().toISOString(),
              // Add any other fields from your main vendor schema
            }
          );
          console.log(
            `✅ Vendor synced to main database: ${vendorDetails.storeName}`
          );
        } catch (syncError) {
          console.error(
            "❌ Failed to sync vendor to main database:",
            syncError.message
          );
          // Continue anyway - you might want to handle this differently
        }
      }

      // 2. ALSO create product in MAIN WEBSITE collection (with different schema)
      let mainProduct = null;
      try {
        // Map vendor product fields to main product schema
        mainProduct = await db.createDocument(
          env.APPWRITE_DATABASE_ID, // Your main website database ID
          env.APPWRITE_PRODUCT_COLLECTION_ID, // Your main website collection ID
          productId, // Use same ID for consistency
          {
            // Map to main product schema
            productName: name.trim(),
            type: type || "physical",
            description: description?.trim() || "",
            price: parseFloat(price),
            brand: brand || vendorDetails.storeName, // Use vendor store name as brand if not provided
            details: details || description?.trim() || "", // Use description as details
            currency: currency || "USD",

            // Category mapping - CRITICAL: Use the same field names as your main product controller
            category: categoryId, // This should be a string ID
            categoryId: [categoryId], // Array of category IDs
            subcategoryId: subcategoryId || "", // Optional subcategory

            // Images
            image: image || "",
            images: images || [],

            // Specifications - map attributes to specifications
            specifications: parsedAttributes || {},

            // Stock
            stock: parseInt(inventory) || 0,
            vendorId: vendorId, // Simple string reference
            vendorName: vendorDetails.storeName,
            vendorEmail: vendorDetails.email,
            vendorPhone: vendorDetails.phone || "",
            vendorRating: vendorDetails.rating || 0,
            vendorProfilePicture: vendorDetails.profilePicture || "",
            // Product status flags
            isActive: false,
            isFeatured: false,
            isApproved: false, // Auto-approve or set to false for admin approval

            // Additional fields for main products
            sku: `VENDOR-${productId.slice(0, 8)}`, // Generate SKU
            slug: name
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w\-]+/g, ""),
            weight: 0,
            dimensions: [],

            // Ratings and reviews
            rating: 0,
            reviewCount: 0,
            reviews: [],

            // Sales data
            salesCount: 0,
            views: 0,

            // Metadata
            status: "pending",
            submittedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            source: "vendor", // To identify this came from vendor platform
            vendorProductId: productId, // Reference back to vendor's product
          }
        );
        console.log("✅ Product added to main collection (pending approval)");

        try {
          // Get all admin users (or specific admin IDs)
          const admins = await db.listDocuments(
            env.APPWRITE_DATABASE_ID, // Or your users database
            env.APPWRITE_ADMIN_COLLECTION_ID, // Your users collection
            [Query.equal("role", "admin"), Query.limit(10)]
          );

          // Create notification for each admin
          for (const admin of admins.documents) {
            await CreateProductApprovalNotification({
              message: `New product submission: "${name}" by ${vendorDetails.storeName}`,
              type: "product_submission",
              username: admin.name || "Admin",
              email: admin.email,
              userId: admin.$id,

              // Add product details to notification
              metadata: JSON.stringify({
                productId,
                productName: name,
                vendorId,
                vendorName: vendorDetails.storeName,
                vendorEmail: vendorDetails.email,
                price: parseFloat(price),
                category: categoryId,
                image: image || "",
                submittedAt: new Date().toISOString(),
                actionUrl: `/admin/products/pending/${productId}`, // Link to admin panel
              }),
            });
          }

          // Also create a notification for the vendor
          await CreateProductApprovalNotification({
            message: `Your product "${name}" has been submitted for admin approval`,
            type: "product_submitted",
            username: vendorDetails.name,
            email: vendorDetails.email,
            userId: vendorId,
            metadata: JSON.stringify({
              productId,
              productName: name,
              status: "pending",
              submittedAt: new Date().toISOString(),
            }),
          });

          console.log("📢 Notifications sent to admin and vendor");
        } catch (notificationError) {
          console.error(
            "Notification error (product still saved):",
            notificationError
          );
          // Don't fail the whole request if notification fails
        }
      } catch (mainProductError) {
        console.error(
          "❌ Failed to add product to main collection:",
          mainProductError
        );
        // Log the specific error
        if (mainProductError.response) {
          console.error(
            "Appwrite response status:",
            mainProductError.response.status
          );
          console.error(
            "Appwrite response data:",
            JSON.stringify(mainProductError.response.data, null, 2)
          );
        }
        // Don't fail the whole request, but log for manual fix
        // You might want to implement a retry queue here
      }

      res.status(201).json({
        success: true,
        message:
          "Product created successfully and submitted for admin approval",
        status: "pending_approval",
        data: {
          product: vendorProduct,
          addedToMainStore: !!mainProduct,
          mainProductId: mainProduct?.$id,
        },
      });
    } catch (error) {
      console.error("❌ CREATE PRODUCT ERROR:", error.message);
      console.error("Full error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create product: " + error.message,
      });
    }
  },

  async syncVendorToMainDatabase(vendorId) {
    try {
      // Get vendor from vendor database
      const vendor = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vendorId
      );

      // Update or create in main database
      try {
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.MAIN_VENDORS_COLLECTION_ID,
          vendorId,
          {
            name: vendor.name,
            storeName: vendor.storeName,
            email: vendor.email,
            phone: vendor.phone || "",
            profilePicture: vendor.profilePicture || "",
            rating: vendor.rating || 0,
            totalSales: vendor.totalSales || 0,
            status: vendor.status || "active",
            syncedAt: new Date().toISOString(),
          }
        );
        console.log(`✅ Vendor ${vendorId} updated in main database`);
      } catch (updateError) {
        // If update fails, try create
        if (updateError.code === 404) {
          await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            env.MAIN_VENDORS_COLLECTION_ID,
            vendorId,
            {
              originalVendorId: vendorId,
              name: vendor.name,
              storeName: vendor.storeName,
              email: vendor.email,
              phone: vendor.phone || "",
              profilePicture: vendor.profilePicture || "",
              rating: vendor.rating || 0,
              totalSales: vendor.totalSales || 0,
              status: vendor.status || "active",

              syncedAt: new Date().toISOString(),
            }
          );
          console.log(`✅ Vendor ${vendorId} created in main database`);
        } else {
          throw updateError;
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to sync vendor:", error.message);
      return false;
    }
  },

  // Get Vendor Products
  async getVendorProducts(req, res) {
    try {
      const vendorId = req.user.userId; // This should be set by your auth middleware
      /* console.log("🔥 getVendorProducts hit, vendorId:", req.vendorId); */

      if (!vendorId)
        return res
          .status(400)
          .json({ success: false, error: "Vendor not identified" });

      const { page = 1, limit = 10, category, search } = req.query;

      const queries = [Query.equal("vendorId", vendorId)];

      if (category) queries.push(Query.equal("category", category));
      if (search) queries.push(Query.search("name", search));

      const products = await db.listDocuments(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        [
          ...queries,
          Query.orderDesc("createdAt"),
          Query.limit(parseInt(limit)),
          Query.offset((parseInt(page) - 1) * parseInt(limit)),
        ]
      );

      /* console.log("✅ Vendor products fetched:", products.total); */

      res.json({
        success: true,
        data: {
          products: products.documents,
          total: products.total,
          page: parseInt(page),
          totalPages: Math.ceil(products.total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get vendor products error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch products" });
    }
  },

  // Get Single Product
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE

      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId
      );

      // Verify product belongs to vendor
      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      res.json({
        success: true,
        data: { product },
      });
    } catch (error) {
      console.error("Get product error:", error);
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to fetch product",
      });
    }
  },

  // Update Product
  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE
      const updates = req.body;

      // Verify product ownership
      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId
      );

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        data: { product: updatedProduct },
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update product",
      });
    }
  },

  // Delete Product
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      const vendorId = req.user.userId; // CHANGED HERE

      // Verify product ownership
      const product = await db.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId
      );

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      await db.deleteDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId
      );

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete product",
      });
    }
  },

  // productController.js - Add this new method
  async uploadDirect(req, res) {
    try {
      const vendorId = req.user.userId; // CHANGED HERE
      const productId = req.body.productId;

      console.log("📸 Direct upload request:", {
        vendorId,
        productId,
        file: req.file ? req.file.originalname : "No file",
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: "Product ID is required",
        });
      }

      // Verify product ownership
      let product;
      try {
        product = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_PRODUCTS_COLLECTION_ID,
          productId
        );
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      // Upload to Appwrite Storage
      console.log(
        "Uploading file to Appwrite:",
        req.file.originalname,
        req.file.size
      );

      const image = await storage.createFile(
        env.APPWRITE_STORAGE_ID || "product-images",
        ID.unique(),
        req.file.buffer
      );

      const imageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${image.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

      const uploadedImage = {
        id: image.$id,
        url: imageUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      };

      // Update product with new image
      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          images: [...(product.images || []), uploadedImage],
          updatedAt: new Date().toISOString(),
        }
      );

      console.log("✅ Image uploaded successfully:", imageUrl);

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          image: uploadedImage,
          product: updatedProduct,
        },
      });
    } catch (error) {
      console.error("Direct upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload image: " + error.message,
      });
    }
  },

  // Add this to your productController.js
  async uploadBatch(req, res) {
    try {
      const vendorId = req.user.userId; // CHANGED HERE
      const { productId, images } = req.body; // images: array of { imageData, filename }

      console.log("📸 Batch upload request:", {
        vendorId,
        productId,
        imageCount: images ? images.length : 0,
      });

      if (!productId || !images || !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          error: "Product ID and images array are required",
        });
      }

      // Verify product ownership
      let product;
      try {
        product = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_PRODUCTS_COLLECTION_ID,
          productId
        );
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      if (product.vendorId !== vendorId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this product",
        });
      }

      const uploadedImages = [];

      // Upload each image
      for (const img of images) {
        try {
          const buffer = Buffer.from(img.imageData.split(",")[1], "base64");

          const image = await storage.createFile(
            env.APPWRITE_STORAGE_ID || "product-images",
            ID.unique(),
            buffer
          );

          const imageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${image.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

          uploadedImages.push({
            id: image.$id,
            url: imageUrl,
            filename: img.filename || "image.jpg",
            size: buffer.length,
            mimetype: "image/jpeg",
          });
        } catch (uploadError) {
          console.error("Error uploading image in batch:", uploadError);
          // Continue with other images
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload any images",
        });
      }

      // Update product with all new images
      const updatedProduct = await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          images: [...(product.images || []), ...uploadedImages],
          updatedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages,
          product: updatedProduct,
        },
      });
    } catch (error) {
      console.error("Batch upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload images: " + error.message,
      });
    }
  },

  async uploadProductImage(req, res) {
    try {
      const { base64, fileName } = req.body;

      if (!base64 || !fileName) {
        return res.status(400).json({
          success: false,
          message: "base64 and fileName are required",
        });
      }

      // Validate base64
      const matches = base64.match(/^data:(.*);base64,(.*)$/);

      if (!matches) {
        return res.status(400).json({
          success: false,
          message: "Invalid base64 format",
        });
      }

      const mimeType = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");

      const file = await storage.createFile(
        env.APPWRITE_STORAGE_ID || "product-images",
        ID.unique(),
        {
          filename: fileName,
          type: mimeType,
          size: buffer.length,
          buffer,
        }
      );

      const imageUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID || "product-images"}/files/${file.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

      return res.status(201).json({
        success: true,
        fileId: file.$id,
        imageUrl,
      });
    } catch (error) {
      console.error("Image Upload Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
      });
    }
  },
};

module.exports = productController;
