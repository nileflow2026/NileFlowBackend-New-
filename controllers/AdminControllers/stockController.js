const { db, Query } = require("../../services/appwriteService");
const { env } = require("../../src/env");

/**
 * Check if products have sufficient stock
 * @param {Array} cartItems - Array of cart items with productId and quantity
 * @returns {Object} - { isAvailable: boolean, unavailableItems: Array, totalStock: Object }
 */
const checkStockAvailability = async (cartItems) => {
  try {
    const unavailableItems = [];
    const stockDetails = {};
    let isAvailable = true;

    // Group items by productId to handle multiple quantities
    const productMap = {};
    cartItems.forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = 0;
      }
      productMap[item.productId] += item.quantity || 1;
    });

    // Check stock for each unique product
    for (const [productId, requestedQuantity] of Object.entries(productMap)) {
      try {
        // Get product from main collection
        const product = await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PRODUCT_COLLECTION_ID,
          productId
        );

        const currentStock = product.stock || 0;
        stockDetails[productId] = {
          currentStock,
          requestedQuantity,
          productName: product.productName,
          isAvailable: currentStock >= requestedQuantity,
        };

        if (currentStock < requestedQuantity) {
          isAvailable = false;
          unavailableItems.push({
            productId,
            productName: product.productName,
            currentStock,
            requestedQuantity,
            shortage: requestedQuantity - currentStock,
          });
        }
      } catch (error) {
        console.error(`Error checking stock for product ${productId}:`, error);
        isAvailable = false;
        unavailableItems.push({
          productId,
          error: "Product not found or inaccessible",
        });
      }
    }

    return {
      isAvailable,
      unavailableItems,
      stockDetails,
      totalItems: cartItems.length,
      uniqueProducts: Object.keys(productMap).length,
    };
  } catch (error) {
    console.error("Error in checkStockAvailability:", error);
    return {
      isAvailable: false,
      unavailableItems: [],
      stockDetails: {},
      error: error.message,
    };
  }
};

/**
 * Reduce stock for ordered products (updates both main and vendor collections)
 * @param {Array} cartItems - Array of cart items
 * @param {String} orderId - Order ID for logging
 * @returns {Object} - { success: boolean, updatedProducts: Array, errors: Array }
 */
const reduceProductStock = async (cartItems, orderId = "unknown") => {
  const results = {
    success: true,
    updatedProducts: [],
    errors: [],
  };

  // Group items by productId
  const productMap = {};
  cartItems.forEach((item) => {
    if (!productMap[item.productId]) {
      productMap[item.productId] = 0;
    }
    productMap[item.productId] += item.quantity || 1;
  });

  // Process each product
  for (const [productId, quantityToReduce] of Object.entries(productMap)) {
    try {
      // 1. Get current product details from main collection
      const mainProduct = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId
      );

      const currentStock = mainProduct.stock || 0;

      // Validate stock availability
      if (currentStock < quantityToReduce) {
        throw new Error(
          `Insufficient stock. Available: ${currentStock}, Requested: ${quantityToReduce}`
        );
      }

      const newStock = currentStock - quantityToReduce;
      const vendorId = mainProduct.vendorId;

      // 2. Update MAIN PRODUCT collection
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
        {
          stock: newStock,
          updatedAt: new Date().toISOString(),
          salesCount: (mainProduct.salesCount || 0) + quantityToReduce,
          lastSoldAt: new Date().toISOString(),
        }
      );

      // 3. Update VENDOR PRODUCT collection
      if (vendorId && mainProduct.vendorProductId) {
        try {
          // Try to update vendor product by vendorProductId (preferred)
          await db.updateDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_PRODUCTS_COLLECTION_ID,
            mainProduct.vendorProductId,
            {
              inventory: newStock,
              updatedAt: new Date().toISOString(),
            }
          );
        } catch (vendorError) {
          console.warn(
            `Could not update vendor product ${mainProduct.vendorProductId}:`,
            vendorError.message
          );

          // Fallback: Try to find vendor product by productId
          try {
            const vendorProducts = await db.listDocuments(
              env.VENDOR_DATABASE_ID,
              env.VENDOR_PRODUCTS_COLLECTION_ID,
              [
                Query.equal("vendorId", vendorId),
                Query.equal("sku", mainProduct.sku || ""),
              ]
            );

            if (vendorProducts.documents.length > 0) {
              await db.updateDocument(
                env.VENDOR_DATABASE_ID,
                env.VENDOR_PRODUCTS_COLLECTION_ID,
                vendorProducts.documents[0].$id,
                {
                  inventory: newStock,
                  updatedAt: new Date().toISOString(),
                }
              );
            }
          } catch (fallbackError) {
            console.error("Fallback vendor update failed:", fallbackError);
            // Log error but don't fail the whole order
            results.errors.push({
              productId,
              vendorId,
              error: "Failed to update vendor inventory",
              message: fallbackError.message,
            });
          }
        }
      }

      // Record successful update
      results.updatedProducts.push({
        productId,
        productName: mainProduct.productName,
        quantityReduced: quantityToReduce,
        previousStock: currentStock,
        newStock,
        vendorId,
      });

      console.log(
        `✅ Stock updated for ${mainProduct.productName}: ${currentStock} → ${newStock} (Order: ${orderId})`
      );
    } catch (error) {
      console.error(
        `❌ Failed to reduce stock for product ${productId}:`,
        error
      );
      results.success = false;
      results.errors.push({
        productId,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Restore stock (for order cancellations/returns)
 * @param {Array} cartItems - Array of cart items
 * @param {String} reason - Reason for restoration
 * @returns {Object} - Result of restoration
 */
const restoreProductStock = async (cartItems, reason = "order_cancelled") => {
  const results = {
    success: true,
    restoredProducts: [],
    errors: [],
  };

  // Group items by productId
  const productMap = {};
  cartItems.forEach((item) => {
    if (!productMap[item.productId]) {
      productMap[item.productId] = 0;
    }
    productMap[item.productId] += item.quantity || 1;
  });

  for (const [productId, quantityToRestore] of Object.entries(productMap)) {
    try {
      const mainProduct = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId
      );

      const currentStock = mainProduct.stock || 0;
      const newStock = currentStock + quantityToRestore;

      // Update main collection
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        productId,
        {
          stock: newStock,
          updatedAt: new Date().toISOString(),
          restoredAt: new Date().toISOString(),
          restorationReason: reason,
        }
      );

      // Update vendor collection
      if (mainProduct.vendorId && mainProduct.vendorProductId) {
        try {
          await db.updateDocument(
            env.VENDOR_DATABASE_ID,
            env.VENDOR_PRODUCTS_COLLECTION_ID,
            mainProduct.vendorProductId,
            {
              inventory: newStock,
              updatedAt: new Date().toISOString(),
            }
          );
        } catch (vendorError) {
          console.warn("Vendor stock restore failed:", vendorError);
        }
      }

      results.restoredProducts.push({
        productId,
        productName: mainProduct.productName,
        quantityRestored: quantityToRestore,
        newStock,
        reason,
      });
    } catch (error) {
      console.error(`Failed to restore stock for ${productId}:`, error);
      results.errors.push({
        productId,
        error: error.message,
      });
      results.success = false;
    }
  }

  return results;
};

module.exports = {
  checkStockAvailability,
  reduceProductStock,
  restoreProductStock,
};
