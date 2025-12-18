// controllers/cartController.js

const { Query, ID } = require("node-appwrite");
const { db } = require("../../services/appwriteService");

/**
 * Add item to cart
 */
const { env } = require("../../src/env");
const {
  checkStockAvailability,
} = require("../AdminControllers/stockController");

const validateCartStock = async (req, res) => {
  try {
    const { cart, userId } = req.body;

    if (!cart || !Array.isArray(cart) || !userId) {
      return res.status(400).json({
        isValid: false,
        error: "Invalid cart data",
      });
    }

    const stockCheck = checkStockAvailability(cart);

    res.json({
      isValid: stockCheck.isAvailable,
      ...stockCheck,
    });
  } catch (error) {
    console.error("Error validating cart stock:", error);
    res.status(500).json({
      isValid: false,
      error: error.message,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { userId, productId, productName, price, image, userName } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    // Check if item already exists
    const existing = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [(Query.equal("userId", userId), Query.equal("productId", productId))]
    );

    if (existing.documents.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Already in cart",
        item: existing.documents[0],
      });
    }

    const newItem = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        productId,
        userName,
        productName,
        productImage: image ? encodeURI(image.trim()) : null,
        price: Math.round(Number(price)),
        quantity: 1,
        createdAt: new Date().toISOString(),
      }
    );

    res.status(201).json({
      success: true,
      item: {
        $id: newItem.$id, // ✅ ensure frontend always gets document id
        ...newItem,
      },
    });
  } catch (err) {
    console.error("AddToCart Error:", err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

/**
 * Fetch cart items
 */
const fetchCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    res.status(200).json(response.documents);
  } catch (err) {
    console.error("FetchCart Error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

/**
 * Update item quantity
 */
const updateQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params; // <-- productId instead of $id
    const { quantity, userId } = req.body;

    if (!cartItemId || !quantity || !userId) {
      return res.status(400).json({ error: "Missing data" });
    }

    // 1. Find the cart document by productId + userId
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("productId", cartItemId), Query.equal("userId", userId)]
    );

    if (result.total === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const docId = result.documents[0].$id;
    const updated = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      docId,
      { quantity }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("UpdateQuantity Error:", err);
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    if (!cartItemId) {
      return res.status(400).json({ error: "Missing cartItemId" });
    }

    await db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      cartItemId
    );

    res.status(200).json({ message: "Item removed successfully" });
  } catch (err) {
    console.error("RemoveFromCart Error:", err);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
};

// controllers/cartController.js
const loadCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    // Map into frontend-ready format
    const cartItems = response.documents.map((doc) => ({
      id: doc.$id,
      userId: doc.userId,
      productId: String(doc.productId),
      productName: doc.productName,
      productImage: doc.productImage,
      date: new Date(doc.createdAt).toDateString(),
      quantity: doc.quantity,
      name: doc.name,
      price: doc.price ?? 0,
    }));

    res.status(200).json(cartItems);
  } catch (err) {
    console.error("LoadCart Error:", err);
    res.status(500).json({ error: "Failed to load cart" });
  }
};

// In your cartController.js
const clearCartAfterOrder = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get all cart items for this user
    const cartItems = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CART_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    // Delete all items
    const deletePromises = cartItems.documents.map((item) =>
      db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CART_COLLECTION_ID,
        item.$id
      )
    );

    await Promise.all(deletePromises);

    console.log(`✅ Cleared ${cartItems.total} items for user ${userId}`);

    res.json({
      success: true,
      message: `Cleared ${cartItems.total} items from cart`,
      itemsCleared: cartItems.total,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cart",
    });
  }
};

module.exports = {
  validateCartStock,
  addToCart,
  fetchCart,
  removeFromCart,
  updateQuantity,
  clearCartAfterOrder,
  loadCart,
};
