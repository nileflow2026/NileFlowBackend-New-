// controllers/admin.js
const { Query, ID } = require("node-appwrite");
const { db, functions } = require("../../services/appwriteService");
const { logAuditFromRequest } = require("../../utils/auditLogger");
const { env } = require("../../src/env");
const {
  sendOrderStatusUpdateEmail,
} = require("../../services/send-confirmation");
const { Resend } = require("resend");
const resend = new Resend(env.RESEND_API_KEY);

const getCancelledOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const { userId, role } = req.user;

    console.log("Authenticated userId:", userId);
    console.log("User role:", role);

    if (!userId) {
      return res.status(404).json({ error: "User not found." });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID,
      [Query.orderDesc("$createdAt")],
    );

    res.status(200).json({ response: response.documents });
  } catch (error) {
    console.error("Fetching orders failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const { userId, role } = req.user;

    console.log("Authenticated userId:", userId);
    console.log("User role:", role);

    if (!userId) {
      return res.status(404).json({ error: "User not found." });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.orderDesc("$createdAt")],
    );

    res.status(200).json({ response: response.documents });
  } catch (error) {
    console.error("Fetching orders failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let filters = [];

    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }
    if (category && category !== "all") {
      filters.push(Query.equal("category", category));
    }
    // Corrected: Only use one Query.search filter.
    if (search) {
      filters.push(Query.search("productName", search));
    }
    // If you want to support searching by description or other fields, you can add more Query.search filters here.
    if (search) {
      filters.push(Query.search("description", search));
    }

    const allProducts = [];
    let cursor = null;

    while (true) {
      const queries = [
        Query.limit(100), // Appwrite's max batch size
        Query.orderDesc("$createdAt"), // ✅ Sort by latest
        ...(filters.length > 0 ? filters : []),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ];

      const batch = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        queries,
      );

      allProducts.push(...batch.documents);

      if (batch.documents.length < 100) {
        break; // no more documents
      }

      // advance cursor
      cursor = batch.documents[batch.documents.length - 1].$id;
    }

    res.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
    });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const getPendingProducts = async (req, res) => {
  try {
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("status", "pending"),
        Query.orderDesc("submittedAt"),
        Query.limit(100),
      ],
    );

    res.json({
      success: true,
      data: {
        products: products.documents,
        total: products.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getApprovedProducts = async (req, res) => {
  try {
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("status", "approved"),
        Query.orderDesc("approvedAt"),
        Query.limit(100),
      ],
    );

    res.json({
      success: true,
      data: {
        products: products.documents,
        total: products.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRejectedProducts = async (req, res) => {
  try {
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("status", "rejected"),
        Query.orderDesc("rejectedAt"),
        Query.limit(100),
      ],
    );

    res.json({
      success: true,
      data: {
        products: products.documents,
        total: products.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSingleProductDetails = async (req, res) => {
  try {
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      req.params.productId,
    );

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addProduct = async (req, res) => {
  const {
    productName,
    type,
    description,
    price,
    discountPrice,
    brand,
    details,
    currency,
    category,
    image,
    images,
    specifications,
    colors,
    sizes,
    sku,
    weight,
    dimensions,
    tags,
    metaDescription,
    warranty,
    careInstructions,
    stock,
    visibility = "visible", // default to visible
    subcategoryId,
  } = req.body;
  // ✅ Log the received data
  console.log("Received product data:", req.body);

  try {
    // ✅ Generate the unique ID beforehand
    const uniqueProductId = ID.unique();
    console.log("Attempting to create document with ID:", uniqueProductId);
    const doc = await db.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.PRODUCTS_COLLECTION_ID,
      uniqueProductId,
      {
        productName,
        type,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        brand,
        details,
        currency,
        isApproved: true, // Auto-approve for now; adjust as needed
        isActive: true, // New field to track if product is active or soft-deleted
        category: category,
        categoryId: Array.isArray(category) ? category : [category],
        subcategoryId,
        image,
        images: images || [],
        specifications: specifications || [],
        colors: colors ? JSON.stringify(colors) : "[]",
        sizes: sizes ? JSON.stringify(sizes) : "[]",
        sku,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions
          ? [dimensions.length, dimensions.width, dimensions.height]
          : [],
        tags: tags || [],
        metaDescription,
        warranty,
        careInstructions,
        stock: parseInt(stock),
        visibility,
      },
    );

    // 🟩 Audit log here
    await logAuditFromRequest(req, "Product added", "Product", doc.$id, {
      productName,
      price,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("[addProduct error]", e);
    // ✅ Log the error message to see the full Appwrite error
    console.error("Appwrite error details:", e.response?.data);
    res.status(500).json({ error: e.message });
  }
};

const addFeaturedProducts = async (req, res) => {
  try {
    const { productId, tag } = req.body; // productId from the frontend is the original product's $id

    // Check if the product is already featured
    const { total: existingFeatured } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FEATURED_COLLECTION_ID,
      [Query.equal("productId", productId)], // Use the new attribute name
    );

    if (existingFeatured > 0) {
      return res.status(409).json({ error: "Product is already featured." });
    }

    // Fetch the original product to get its name and images
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );

    const imagesToSave = product.images || [];

    // Create a new document in the featured collection
    // The new document's ID will be a different, unique value
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FEATURED_COLLECTION_ID,
      ID.unique(),
      {
        productId: productId,
        productName: product.productName,
        image: product.image,
        images: imagesToSave, // Pass the array directly to the URL array attribute
        tag: tag,
        isFeatured: true,
      }, // Save the product's $id here,
    );

    res
      .status(200)
      .json({ message: "Product marked as featured successfully!" });
  } catch (error) {
    console.error("Failed to mark product as featured:", error);
    res.status(500).json({ error: "Failed to mark product as featured." });
  }
};

const addProductsDeal = async (req, res) => {
  try {
    const { productId, discountPercentage, tag, durationHours = 24 } = req.body;

    // Check if the product already exists in the deals collection
    const { total: existingDeal } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID, // Use your new deals collection ID
      [Query.equal("productId", productId)], // Assumes your deals collection has a 'productDocId' attribute
    );

    if (existingDeal > 0) {
      return res.status(409).json({ error: "Product is already a deal." });
    }

    // Fetch the original product to get its price, name, and images

    // Fetch the original product to get its price
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID, // Get the document from your main products collection
      productId,
    );

    const originalPrice = product.price;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const imagesToSave = product.images || [];

    // Calculate deal end time
    const dealEndTime = new Date();
    dealEndTime.setHours(dealEndTime.getHours() + durationHours);

    // Create a new document in the deals collection with the necessary info
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID, // The new deals collection ID
      ID.unique(),
      {
        productId: productId, // Reference the original product's $id
        productName: product.productName,
        images: imagesToSave, // Pass the stringified array
        image: product.image,
        price: product.price,
        dealPrice: discountedPrice,
        discount: discountPercentage,
        tag: tag,
        isDeal: true,
        dealEndTime: dealEndTime.toISOString(),
        durationHours: durationHours,
        category: product.category || "general",
        stockQuantity: product.stockQuantity || 100,
      },
    );

    res.status(200).json({
      message: "Product added to deals successfully!",
      dealEndTime: dealEndTime.toISOString(),
      durationHours: durationHours,
    });
  } catch (error) {
    console.error("Failed to add product to deals:", error);
    res.status(500).json({ error: "Failed to add product to deals." });
  }
};

const addFlashSale = async (req, res) => {
  try {
    const { productId, discountPercentage, saleDurationHours } = req.body;

    // ✅ 1. Check if the product is already in a flash sale.
    // Assuming your flash sale collection has a 'productId' attribute
    const { total: existingSale } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FLASH_SALE_COLLECTION_ID,
      [Query.equal("productId", productId)],
    );

    if (existingSale > 0) {
      return res
        .status(409)
        .json({ error: "Product is already in a flash sale." });
    }

    // ✅ 2. Fetch the original product from the main products collection.
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID, // Use your main products collection ID
      productId,
    );
    const originalPrice = product.price;

    // ✅ 3. Calculate the discounted price.
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    // ✅ 4. Calculate the sale end time based on the duration.
    const now = new Date();
    const saleEndTime = new Date(
      now.getTime() + saleDurationHours * 60 * 60 * 1000,
    );

    // ✅ 5. Create the new document in the flash sales collection.
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FLASH_SALE_COLLECTION_ID, // The flash sale collection ID

      ID.unique(),
      {
        productId: productId,
        productName: product.productName,
        image: product.image,
        images: product.images,
        price: product.price,
        salePrice: discountedPrice,
        discountPercentage: discountPercentage,
        isFlashSale: true, // Use a boolean flag for easy querying
        saleEndTime: saleEndTime.toISOString(), // Save as an ISO string
      },
    );

    res
      .status(200)
      .json({ message: "Product added to flash sale successfully!" });
  } catch (error) {
    console.error("Failed to add product to flash sale:", error);
    res.status(500).json({ error: "Failed to add product to flash sale." });
  }
};

const updatePremiumDeal = async (req, res) => {
  try {
    const { productId, premiumDeal } = req.body;

    // Validate required fields
    if (!productId || typeof premiumDeal !== "boolean") {
      return res.status(400).json({
        error: "productId and premiumDeal (boolean) are required.",
      });
    }

    // Verify the product exists first
    try {
      const existingProduct = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
      );

      // Check if the product is already in the desired state
      if (existingProduct.premiumDeal === premiumDeal) {
        const status = premiumDeal
          ? "already marked as premium"
          : "already not premium";
        return res.status(409).json({
          error: `Product is ${status}.`,
        });
      }
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ error: "Product not found." });
      }
      throw error; // Re-throw if it's not a 404 error
    }

    // Update the product's premiumDeal attribute
    const updatedProduct = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        premiumDeal: premiumDeal,
      },
    );

    // Send appropriate success message
    const message = premiumDeal
      ? "Product successfully marked as premium deal!"
      : "Premium deal status removed successfully!";

    res.status(200).json({
      message: message,
      productId: productId,
      premiumDeal: premiumDeal,
    });
  } catch (error) {
    console.error("Failed to update premium deal status:", error);
    res.status(500).json({
      error: "Failed to update premium deal status.",
    });
  }
};

const getFlashSales = async (req, res) => {
  try {
    const now = new Date().toISOString();

    const flashSales = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_FLASH_SALE_COLLECTION_ID, // The flash sale collection ID
      [
        // Query for sales that are active and have not expired
        Query.equal("isFlashSale", true),
        Query.greaterThan("saleEndTime", now),
      ],
    );

    res.status(200).json(flashSales.documents);
  } catch (error) {
    console.error("Error fetching flash sales:", error);
    res.status(500).json({ error: "Failed to fetch flash sales." });
  }
};

const addReward = async (req, res) => {
  try {
    const { name, lore, image, requiredMiles, rewardKey, category } = req.body;

    // Check if rewardKey already exists
    const { total } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARDS_COLLECTION_ID,
      [Query.equal("rewardKey", rewardKey)],
    );

    if (total > 0) {
      return res
        .status(409)
        .json({ error: "Reward with this key already exists." });
    }

    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARDS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        lore,
        image,
        requiredMiles,
        rewardKey,
        category, // e.g. "Storytelling Journey", "Festive Rewards"
      },
    );

    res.status(200).json({ message: "Reward added successfully!" });
  } catch (error) {
    console.error("Failed to add reward:", error);
    res.status(500).json({ error: "Failed to add reward." });
  }
};

// Update a reward
const updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const updates = req.body; // can contain any subset of reward fields

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARDS_COLLECTION_ID,
      rewardId,
      updates,
    );

    res.status(200).json({ message: "Reward updated successfully!" });
  } catch (error) {
    console.error("Failed to update reward:", error);
    res.status(500).json({ error: "Failed to update reward." });
  }
};

// Delete a reward
const deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;

    await db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARDS_COLLECTION_ID,
      rewardId,
    );

    res.status(200).json({ message: "Reward deleted successfully!" });
  } catch (error) {
    console.error("Failed to delete reward:", error);
    res.status(500).json({ error: "Failed to delete reward." });
  }
};

// List rewards (grouped by category if needed)
const listRewards = async (req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REWARDS_COLLECTION_ID,
    );

    res.status(200).json({ rewards: documents });
  } catch (error) {
    console.error("Failed to list rewards:", error);
    res.status(500).json({ error: "Failed to list rewards." });
  }
};
// Add this debug useEffect

// Updated updateProduct controller for Many-to-Many relationship
const updateProduct = async (req, res) => {
  const { productId, categoryId, ...otherUpdates } = req.body;

  try {
    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }

    // if otherUpdates contains fields (like productName, price, colors etc.)
    if (Object.keys(otherUpdates).length > 0) {
      const updatedDoc = await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
        otherUpdates,
      );

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedDoc,
      });
    }

    // fallback to previous category-add logic when only categoryId is given
    if (categoryId) {
      console.log("Many-to-Many Update (category only):", {
        productId,
        categoryId,
      });

      const currentProduct = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
      );

      let existingCategories = [];
      if (currentProduct.categories) {
        if (Array.isArray(currentProduct.categories)) {
          existingCategories = currentProduct.categories.map((cat) => {
            if (typeof cat === "object" && cat.$id) {
              return cat.$id;
            }
            return cat;
          });
        } else {
          const cat = currentProduct.categories;
          existingCategories = [typeof cat === "object" ? cat.$id : cat];
        }
      }

      if (existingCategories.includes(categoryId)) {
        return res.status(400).json({
          error: "Product already belongs to this category",
          productId,
          categoryId,
          currentCategories: existingCategories,
        });
      }

      const updatedCategoryIds = [...existingCategories, categoryId];

      const updatedDoc = await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
        {
          categories: updatedCategoryIds,
        },
      );

      return res.status(200).json({
        success: true,
        message: `Category added successfully to ${currentProduct.productName}`,
        product: updatedDoc,
        categoriesCount: updatedDoc.categories?.length || 0,
      });
    }

    res.status(400).json({ error: "No updates provided" });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (_req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
    );
    res.json(documents);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const userId = req.user.userId; // Now safely extract
    console.log("userId:", userId);
    const exec = await functions.createExecution(
      "692d903e000d2d217887", // env.APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID,
      JSON.stringify({ orderId, orderStatus }),
    );
    await logAuditFromRequest(req, "Order status updated", "Order", orderId, {
      newStatus: orderStatus,
    });

    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
    );

    // 4. Call email function
    await sendOrderStatusUpdateEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName || order.username || "Customer",
      orderId: order.$id,
      newStatus: orderStatus,
    });

    res.json(exec);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const clientmesseags = async (req, res) => {
  try {
    // You should implement an authentication middleware here to protect this route
    // For a simple example, we'll assume the client is an authenticated admin.

    const { documents: messages } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID, // Your contact database ID
      env.APPWRITE_USER_MESSAGES_COLLECTION_ID,
      [Query.orderDesc("$createdAt")], // Your messages collection ID
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

const replyclientmessages = async (req, res) => {
  try {
    const { toEmail, subject, message } = req.body;

    if (!toEmail || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    await resend.emails.send({
      from: "Nile Flow Support <support@resend.dev>", // Your verified support email
      to: toEmail,
      subject: subject,
      html: `<p>Dear Customer,</p><p>${message}</p><p>Best regards,</p><p>The Nile Flow Team</p>`,
    });

    res.status(200).json({ message: "Reply sent successfully." });
  } catch (error) {
    console.error("Failed to send reply:", error);
    res
      .status(500)
      .json({ error: "Failed to send reply. Please try again later." });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, image, description } = req.body;

    const doc = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      ID.unique, // auto-ID
      { name, slug, image, description },
    );

    res.status(201).json(doc);
  } catch (error) {
    console.error("❌ Failed to create category:", error);
    res.status(500).json({ error: "Failed to create category." });
  }
};

// POST /categories/:id/subcategories
const createSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate parent category
    let category;
    try {
      category = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CATEGORIES_COLLECTION_ID,
        id,
      );
    } catch {
      return res.status(404).json({ message: "Category not found" });
    }

    // Create subcategory document
    const subcategory = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SUBCATEGORY_COLLECTION_ID,
      ID.unique(),
      {
        name,
        // ✅ Correct
        category: id, // wrap in array

        categoryId: id, // string field for queries
      },
    );

    res.status(201).json({ message: "Subcategory created", subcategory });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getSubcategoriesByCategoryId = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if category exists
    let category;
    try {
      category = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CATEGORIES_COLLECTION_ID,
        id,
      );
    } catch {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Query subcategories with relationship field "category"
    const subcategories = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SUBCATEGORY_COLLECTION_ID,
      [Query.equal("categoryId", [id])],
    );

    res.status(200).json({ category, subcategories: subcategories.documents });
  } catch (error) {
    console.error("Failed to fetch SubcategoriesByCategoryId:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch products by subcategory
const getProductsBySubcategoryId = async (req, res) => {
  try {
    const { id } = req.params; // subcategory ID

    // Query products where subcategory relationship matches this ID
    const products = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [Query.equal("subcategoryId", id)], // <-- Fix this line
    );

    if (!products.documents.length) {
      return res
        .status(404)
        .json({ message: "No products found in this subcategory" });
    }

    res.json(products.documents);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

const assignDeliveryToRider = async (req, res) => {
  try {
    const { deliveryId, riderId, pickupAddress } = req.body;
    if (!deliveryId || !riderId) {
      return res.status(400).json({
        success: false,
        error: "Delivery ID and Rider ID are required",
      });
    }
    // Validate input

    console.log("Attempting to assign delivery:", {
      deliveryId,
      riderId,
      pickupAddress: pickupAddress || "Not provided by admin",
    });
    console.log(
      "Using database:",
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
    );
    console.log(
      "Using collection:",
      env.DELIVERIES_COLLECTION_ID || "UNDEFINED",
    );

    // First, check if this is an order ID and we need to find or create a delivery record
    let delivery;

    try {
      // Try to find delivery in deliveries collection first
      console.log("Trying to find delivery in deliveries collection...");
      delivery = await db.getDocument(
        env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
        env.DELIVERIES_COLLECTION_ID,
        deliveryId,
      );
      console.log("Found existing delivery:", delivery.$id);
    } catch (deliveryError) {
      console.log(
        "Delivery not found in deliveries collection, checking orders...",
      );

      try {
        // Check if this is an order ID - try to find in orders collection
        const order = await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION || env.APPWRITE_ORDERS_COLLECTION_ID,
          deliveryId,
        );

        console.log("Found order:", order.$id);
        console.log("🔍 Order document contains:", {
          userId: order.userId,
          customerId: order.userId,
          customerName: order.username || order.customerName || order.name,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          userEmail: order.userEmail,
          userName: order.username,
          email: order.email,
          name: order.name,
          allOrderFields: Object.keys(order),
        });

        // Fetch customer details
        let customerInfo = {};
        let customerDeliveryAddress = null;
        try {
          const customerId = order.userId || order.userId || order.customerId;
          console.log("🔍 Customer ID extracted from order:", customerId);
          console.log("🔍 Order fields containing customer info:", {
            userId: order.userId,
            customerId: order.userId,
            orderUserId: order.orderUserId,
            user: order.user,
          });

          // Check if customerId exists and is valid
          if (!customerId) {
            throw new Error("No customer ID found in order");
          }

          console.log("🔍 Attempting to fetch customer from database...");
          console.log("🔍 Using database ID:", env.APPWRITE_DATABASE_ID);
          console.log(
            "🔍 Using users collection ID:",
            env.APPWRITE_USER_COLLECTION_ID,
          );

          const customer = await db.getDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_USER_COLLECTION_ID,
            customerId,
          );

          console.log("✅ Successfully fetched customer document");

          console.log("Customer document fields:", Object.keys(customer));
          console.log("Customer name fields:", {
            name: customer.name,
            username: customer.username,
            fullName: customer.fullName,
            firstName: customer.firstName,
            lastName: customer.lastName,
          });
          console.log("🔍 Customer email field:", {
            email: customer.email,
            emailType: typeof customer.email,
            emailLength: customer.email ? customer.email.length : "N/A",
            emailTrimmed: customer.email ? customer.email.trim() : "N/A",
          });

          // Build customer name with better field checking
          let customerName =
            customer.username ||
            customer.name ||
            customer.fullName ||
            `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
            "Customer";

          // Ensure customerName is within 25 character limit
          if (customerName.length > 25) {
            customerName = customerName.substring(0, 22) + "...";
          }

          // Get customer delivery address (where to deliver TO)
          try {
            const deliveryAddresses = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_ADDRESS_COLLECTION_ID,
              [Query.equal("user", customerId), Query.equal("type", "pickup")],
            );

            if (deliveryAddresses.documents.length > 0) {
              const deliveryAddr = deliveryAddresses.documents[0];
              customerDeliveryAddress = {
                address: deliveryAddr.address,
                phone: deliveryAddr.phone,
                city: deliveryAddr.city,
                state: deliveryAddr.state,
                postalCode: deliveryAddr.zipCode || "",
                fullAddress: `${deliveryAddr.address}, ${deliveryAddr.city}, ${
                  deliveryAddr.state
                }${deliveryAddr.zipCode ? " " + deliveryAddr.zipCode : ""}`,
              };
              console.log(
                "Found customer delivery address:",
                customerDeliveryAddress.fullAddress,
              );
            } else {
              console.log(
                "No delivery address found for customer, using order address",
              );
            }
          } catch (addressError) {
            console.log(
              "Error fetching customer delivery address:",
              addressError.message,
            );
          }

          customerInfo = {
            customerName: customerName,
            customerPhone: customer.phone || customer.phoneNumber || "",
            customerEmail:
              customer.email && customer.email.trim() !== ""
                ? customer.email
                : "unknown@nileflow.com",
          };
          console.log("✅ Customer info prepared:", {
            name: customerInfo.customerName,
            phone: customerInfo.customerPhone,
            email: customerInfo.customerEmail,
            usingFallbackEmail: !customer.email || customer.email.trim() === "",
          });
          console.log("Fetched customer info:", customerInfo.customerName);
        } catch (customerError) {
          console.log("❌ Could not fetch customer details:");
          console.log("Error type:", customerError.type);
          console.log("Error code:", customerError.code);
          console.log("Error message:", customerError.message);
          console.log(
            "🔍 Was looking for customer ID:",
            order.userId || order.customerId,
          );
          console.log("🔍 In database:", env.APPWRITE_DATABASE_ID);
          console.log("🔍 In collection:", env.APPWRITE_USER_COLLECTION_ID);

          // Try to use customer information from the order itself as fallback
          console.log(
            "🔄 Attempting to use order customer info as fallback...",
          );

          // Try to get phone from customer's address records as additional fallback
          let fallbackPhone = "";
          try {
            console.log("🔄 Trying to get phone from customer addresses...");
            const customerAddresses = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_ADDRESS_COLLECTION_ID,
              [Query.equal("user", order.userId || order.customerId)],
            );

            if (customerAddresses.documents.length > 0) {
              // Get phone from any address that has it
              const addressWithPhone = customerAddresses.documents.find(
                (addr) => addr.phone,
              );
              if (addressWithPhone) {
                fallbackPhone = addressWithPhone.phone;
                console.log(
                  "✅ Found phone in address records:",
                  fallbackPhone,
                );
              }
            }
          } catch (addressPhoneError) {
            console.log(
              "⚠️ Could not fetch phone from addresses:",
              addressPhoneError.message,
            );
          }

          customerInfo = {
            customerName:
              order.customerName ||
              order.username ||
              order.userName ||
              order.name ||
              "Unknown Customer",
            customerPhone: order.customerPhone || fallbackPhone || "",
            customerEmail:
              (
                order.customerEmail ||
                order.userEmail ||
                order.email ||
                ""
              ).trim() !== ""
                ? order.customerEmail || order.userEmail || order.email
                : "unknown@nileflow.com",
          };
          console.log("✅ Using order-based customer info:", customerInfo);
        }

        // Create a delivery record from the order
        delivery = await db.createDocument(
          env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          deliveryId, // Use the same ID as the order
          {
            orderId: order.$id,
            customerId: order.userId || order.customerId,
            ...customerInfo, // Include customer name, phone, email
            pickupAddress:
              pickupAddress ||
              order.pickupAddress ||
              "Business location - To be assigned by admin",
            deliveryAddress:
              customerDeliveryAddress?.fullAddress ||
              order.deliveryAddress ||
              order.address ||
              "Customer delivery address not provided",
            // Include detailed delivery address information for riders as JSON string
            pickupDetails: customerDeliveryAddress
              ? JSON.stringify({
                  address: customerDeliveryAddress.address,
                  phone: customerDeliveryAddress.phone,
                  city: customerDeliveryAddress.city,
                  state: customerDeliveryAddress.state,
                  postalCode: customerDeliveryAddress.postalCode,
                })
              : null,
            status: "pending",
            totalAmount: order.totalAmount || order.total || order.amount,
            deliveryFee: order.deliveryFee || 0,
            subTotal: order.subTotal || order.subtotal,
            tax: order.tax || 0,
            discount: order.discount || 0,
            items: order.items ? JSON.stringify(order.items) : "[]",
            orderNotes: order.notes || order.specialInstructions || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        );

        console.log("Created delivery record:", delivery.$id);
      } catch (orderError) {
        console.error("Order also not found:", orderError);
        return res.status(404).json({
          success: false,
          error: "Neither delivery nor order found with the provided ID",
          details: `Searched for ID: ${deliveryId} in both deliveries and orders collections`,
        });
      }
    }

    if (delivery.status !== "pending" && delivery.status !== "assigned") {
      return res.status(400).json({
        success: false,
        error:
          "Delivery cannot be reassigned - current status: " + delivery.status,
      });
    }

    // Check if rider exists and is available
    const rider = await db.getDocument(
      env.RIDER_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
    );

    if (!rider.isActive) {
      return res.status(400).json({
        success: false,
        error: "Rider is not active",
      });
    }

    if (rider.status === "offline") {
      return res.status(400).json({
        success: false,
        error: "Rider is currently offline",
      });
    }

    // Assign delivery to rider
    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      {
        riderId: riderId,
        status: "assigned",
        assignedAt: new Date().toISOString(),
        assignedBy: req.admin ? req.admin.adminId : req.user.userId,
        updatedAt: new Date().toISOString(),
      },
    );

    // Update rider status to busy if they were online
    if (rider.status === "online") {
      await db.updateDocument(
        env.RIDER_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        riderId,
        {
          status: "busy",
          updatedAt: new Date().toISOString(),
        },
      );
    }

    res.json({
      success: true,
      message: "Delivery assigned successfully",
      delivery: updatedDelivery,
      rider: {
        riderId: rider.$id,
        name: rider.name,
        phone: rider.phone,
        status: "busy",
      },
    });
  } catch (error) {
    console.error("Assign delivery error:", error);

    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        error: "Delivery or Rider not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to assign delivery",
      message: error.message,
    });
  }
};
module.exports = {
  assignDeliveryToRider,
  getOrders,
  getCancelledOrders,
  getProducts,
  getPendingProducts,
  getApprovedProducts,
  getRejectedProducts,
  getSingleProductDetails,
  updateOrderStatus,
  getUsers,
  addProduct,
  clientmesseags,
  replyclientmessages,
  addFeaturedProducts,
  addProductsDeal,
  addFlashSale,
  updatePremiumDeal,
  updateProduct,
  createSubcategory,
  getSubcategoriesByCategoryId,
  getProductsBySubcategoryId,
  createCategory,
  getFlashSales,
  addReward,
  updateReward,
  deleteReward,
  listRewards,
};
