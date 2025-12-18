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
      [Query.orderDesc("$createdAt")]
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
        queries
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
      ]
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
      ]
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
      ]
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
      req.params.productId
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
    brand,
    details,
    currency,
    category,
    image,
    images,
    specifications,
    stock,
    subcategoryId, // 👈 Add this line
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
        brand,
        details,
        currency,
        // ✅ The key change is here. Use the relationship attribute name.
        category: category,
        // New (Correct for Many-to-One)

        // ✅ New line to populate the 'categoryId' array of string IDs
        categoryId: [category],
        subcategoryId, // 👈 Store the subcategory ID as a string here
        image,
        images, // Make sure this is an array if defined as an array attribute
        specifications, // Also ensure correct structure (e.g., object or array)
        stock: parseInt(stock),
      }
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
      [Query.equal("productId", productId)] // Use the new attribute name
    );

    if (existingFeatured > 0) {
      return res.status(409).json({ error: "Product is already featured." });
    }

    // Fetch the original product to get its name and images
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
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
      } // Save the product's $id here,
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
    const { productId, discountPercentage, tag } = req.body;

    // Check if the product already exists in the deals collection
    const { total: existingDeal } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID, // Use your new deals collection ID
      [Query.equal("productId", productId)] // Assumes your deals collection has a 'productDocId' attribute
    );

    if (existingDeal > 0) {
      return res.status(409).json({ error: "Product is already a deal." });
    }

    // Fetch the original product to get its price, name, and images

    // Fetch the original product to get its price
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID, // Get the document from your main products collection
      productId
    );

    const originalPrice = product.price;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const imagesToSave = product.images || [];

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
      }
    );

    res.status(200).json({ message: "Product added to deals successfully!" });
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
      [Query.equal("productId", productId)]
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
      productId
    );
    const originalPrice = product.price;

    // ✅ 3. Calculate the discounted price.
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    // ✅ 4. Calculate the sale end time based on the duration.
    const now = new Date();
    const saleEndTime = new Date(
      now.getTime() + saleDurationHours * 60 * 60 * 1000
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
      }
    );

    res
      .status(200)
      .json({ message: "Product added to flash sale successfully!" });
  } catch (error) {
    console.error("Failed to add product to flash sale:", error);
    res.status(500).json({ error: "Failed to add product to flash sale." });
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
      ]
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
      [Query.equal("rewardKey", rewardKey)]
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
      }
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
      updates
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
      rewardId
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
      env.APPWRITE_REWARDS_COLLECTION_ID
    );

    res.status(200).json({ rewards: documents });
  } catch (error) {
    console.error("Failed to list rewards:", error);
    res.status(500).json({ error: "Failed to list rewards." });
  }
};
// Add this debug useEffect

/* const updateProduct = async (req, res) => {
  const { productId, categoryId } = req.body;

  console.log("=== UPDATE PRODUCT DEBUG ===");
  console.log("1. Request received for productId:", productId);
  console.log("2. Adding categoryId:", categoryId);
  console.log("3. Request body:", req.body);

  try {
    // Get the SPECIFIC product
    console.log("4. Fetching product with ID:", productId);
    const currentProduct = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId // Make sure this is correct!
    );

    console.log("5. Current product found:", {
      id: currentProduct.$id,
      name: currentProduct.productName,
      currentCategories: currentProduct.category,
    });

    // Normalize existing categories
    let existingCategories = [];

    if (currentProduct.category) {
      if (Array.isArray(currentProduct.category)) {
        // Handle both object format and ID format
        existingCategories = currentProduct.category.map((cat) => {
          if (typeof cat === "object" && cat.id) {
            return cat.id; // Extract ID from object
          }
          return cat; // Already an ID string
        });
      } else {
        existingCategories = [currentProduct.category];
      }
    }

    console.log("6. Normalized existing categories:", existingCategories);

    // Check for duplicates
    if (existingCategories.includes(categoryId)) {
      console.log("7. Category already exists, skipping");
      return res.status(400).json({
        error: "Product already belongs to this category",
        productId,
        categoryId,
      });
    }

    // Append new category
    const updatedCategories = [...existingCategories, categoryId];
    console.log("7. Updated categories array:", updatedCategories);

    // Update ONLY this specific product
    console.log("8. Updating document with ID:", productId);
    const updatedDoc = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId, // CRITICAL: Ensure this is the specific product ID
      {
        category: updatedCategories,
        $updatedAt: new Date().toISOString(),
      }
    );

    console.log("9. Update successful! New document:", {
      id: updatedDoc.$id,
      categories: updatedDoc.category,
      categoriesCount: updatedCategories.length,
    });

    // Verify the update
    console.log("10. Verifying update by fetching again...");
    const verifyProduct = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
    );

    console.log("11. Verified product categories:", verifyProduct.category);

    res.status(200).json({
      success: true,
      message: `Category added to ${currentProduct.productName}`,
      productId: updatedDoc.$id,
      categoriesCount: updatedCategories.length,
      categories: updatedDoc.category,
    });
  } catch (error) {
    console.error("=== UPDATE ERROR ===");
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });

    if (error.code === 404) {
      console.error("Product not found. Was productId correct?", productId);
      return res.status(404).json({
        error: `Product with ID ${productId} not found`,
      });
    }

    res.status(500).json({
      error: "Failed to update product",
      details: error.message,
    });
  }
}; */
// Updated updateProduct controller for Many-to-Many relationship
const updateProduct = async (req, res) => {
  const { productId, categoryId } = req.body;

  console.log("Many-to-Many Update:", { productId, categoryId });

  try {
    // Get the current product
    const currentProduct = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
    );

    console.log("Current product categories:", currentProduct.categories);

    // Get existing categories array
    let existingCategories = [];

    if (currentProduct.categories) {
      if (Array.isArray(currentProduct.categories)) {
        // Extract IDs from category objects
        existingCategories = currentProduct.categories.map((cat) => {
          if (typeof cat === "object" && cat.$id) {
            return cat.$id;
          }
          return cat;
        });
      } else {
        // Handle single category
        const cat = currentProduct.categories;
        existingCategories = [typeof cat === "object" ? cat.$id : cat];
      }
    }

    console.log("Existing category IDs:", existingCategories);

    // Check if category already exists
    if (existingCategories.includes(categoryId)) {
      return res.status(400).json({
        error: "Product already belongs to this category",
        productId,
        categoryId,
        currentCategories: existingCategories,
      });
    }

    // Add new category to array
    const updatedCategoryIds = [...existingCategories, categoryId];

    console.log("Updated category IDs:", updatedCategoryIds);

    // Update the product with the new categories array
    const updatedDoc = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        categories: updatedCategoryIds, // Just send IDs, Appwrite will handle the relationship
      }
    );

    console.log(
      "Update successful. Product now has categories:",
      updatedDoc.categories?.length || 0
    );

    // Optionally, verify the two-way relationship
    const categoryDoc = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      categoryId
    );

    console.log(
      "Category now has products:",
      categoryDoc.products?.length || 0,
      "products"
    );

    res.status(200).json({
      success: true,
      message: `Category added successfully to ${currentProduct.productName}`,
      product: updatedDoc,
      categoriesCount: updatedDoc.categories?.length || 0,
    });
  } catch (error) {
    console.error("Many-to-Many update error:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });

    // Specific error handling
    if (error.code === 404) {
      return res.status(404).json({
        error: "Product or Category not found",
        productId,
        categoryId,
      });
    }

    if (error.message.includes("relationship") || error.code === 400) {
      return res.status(400).json({
        error:
          "Relationship configuration error. Please check your Appwrite Many-to-Many setup.",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to update product categories",
      details: error.message,
    });
  }
};
// Example backend updateProduct controller
/* const updateProduct = async (req, res) => {
  const { productId, categoryId } = req.body;
  if (!productId || !categoryId) {
    return res.status(400).json({
      error: "Missing required fields: productId and categoryId are required",
    });
  }

  console.log("Updating product:", { productId, categoryId }); // Add logging
  try {
    const updatedDoc = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        category: [categoryId], // Appwrite two-way relationship requires an array
      }
    );
    res.status(200).json(updatedDoc);
  } catch (error) {
    console.error("Appwrite update error:", {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });

    // Provide more specific error messages
    if (error.code === 404) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (error.code === 401 || error.code === 403) {
      return res.status(403).json({ error: "Permission denied" });
    }

    res.status(500).json({
      error: "Failed to update product",
      details: error.message,
    });
  }
}; */

const getUsers = async (_req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID
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
      JSON.stringify({ orderId, orderStatus })
    );
    await logAuditFromRequest(req, "Order status updated", "Order", orderId, {
      newStatus: orderStatus,
    });

    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId
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
      [Query.orderDesc("$createdAt")] // Your messages collection ID
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
      { name, slug, image, description }
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
        id
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
      }
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
        id
      );
    } catch {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Query subcategories with relationship field "category"
    const subcategories = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SUBCATEGORY_COLLECTION_ID,
      [Query.equal("categoryId", [id])]
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
      [Query.equal("subcategoryId", id)] // <-- Fix this line
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
module.exports = {
  getOrders,
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
