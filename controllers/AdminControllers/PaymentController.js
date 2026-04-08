const { db, functions } = require("../../services/appwriteService");
const { client } = require("../../services/paypal");
const { env } = require("../../src/env");
const Stripe = require("stripe");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const crypto = require("crypto");
const {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
} = require("../../services/send-confirmation");
const { createNotification } = require("../UserControllers/Clientnotification");
const { ID, Query } = require("node-appwrite");
const { addNileMilesOnPurchase } = require("./rewardController");
// Import the stock helper functions
const {
  checkStockAvailability,
  reduceProductStock,
} = require("./stockController");
// Import premium tracking functions
const {
  checkUserPremiumStatus,
  calculatePremiumSavings,
  awardMilesToUser,
  updateOrderWithPremiumData,
} = require("../../services/premiumOrderTrackingService");
const { commissionService } = require("../../services/commissionService");

// Global cache for processed callbacks (in production, use Redis)
const processedCallbacks = new Map();
const FRONTEND_URL = env.FRONTEND_URL_PROD || "http://localhost:5173";

// Clean up old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    for (const [key, timestamp] of processedCallbacks.entries()) {
      if (now - timestamp > tenMinutes) {
        processedCallbacks.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);

/**
 * Process successful M-Pesa payment atomically
 */
async function processSuccessfulMpesaPayment(order, orderId, paymentDetails) {
  const { mpesaReceiptNumber, amount, phoneNumber } = paymentDetails;

  try {
    console.log(`💰 Processing successful M-Pesa payment for order ${orderId}`);
    // 1. Parse cart for stock reduction
    const cart = JSON.parse(order.items || "[]");
    let stockUpdateResult = { success: true, updatedProducts: [] };

    // 2. Reduce stock atomically
    if (cart.length > 0) {
      stockUpdateResult = await reduceProductStock(cart, orderId);
      if (!stockUpdateResult.success) {
        console.error("Stock update failed:", stockUpdateResult.errors);
        // Continue processing - stock failure shouldn't fail payment
      }
    }

    // 3. Update order status atomically
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
      {
        orderStatus: "Ordered",
        paymentStatus: "succeeded",
        status: "Pending",
        mpesaReceiptNumber,
        mpesaPhone: phoneNumber,
        mpesaTransactionDate: new Date().toISOString(),
        stockUpdated: stockUpdateResult.success,
        stockUpdateDetails: JSON.stringify(
          stockUpdateResult.updatedProducts || [],
        ),
        updatedAt: new Date().toISOString(),
      },
    );

    // 3.1 CALCULATE COMMISSION FOR COMPLETED ORDER
    console.log("💰 Calculating commission for completed order...");
    try {
      const commissionResult = await commissionService.calculateOrderCommission(
        orderId,
        order,
      );

      if (commissionResult.success) {
        console.log(
          `✅ Commission calculated: ${commissionResult.commission_earned} at ${commissionResult.commission_percent}%`,
        );
      } else {
        console.warn(
          `⚠️ Commission calculation skipped: ${commissionResult.message}`,
        );
      }
    } catch (commissionError) {
      console.error("❌ Commission calculation failed:", commissionError);
      // Don't fail the payment for commission calculation errors
    }

    // 4. Process premium benefits (non-blocking)
    try {
      const userId = order.userId || order.users;
      if (userId) {
        await processPremiumBenefits(order, orderId, cart);
      }
    } catch (premiumError) {
      console.error("Premium benefits processing failed:", premiumError);
      // Don't fail payment for premium processing errors
    }

    // 5. Send notifications (non-blocking)
    try {
      await createNotification({
        userId: order.userId || order.users,
        type: "payment_success",
        title: "Payment Successful",
        message: `Your M-Pesa payment of KES ${amount} has been confirmed.`,
        orderId,
        email: order.customerEmail,
      });
    } catch (notificationError) {
      console.warn("Notification error:", notificationError.message);
    }

    console.log(`✅ M-Pesa payment processing completed for order ${orderId}`);
  } catch (error) {
    console.error(
      `❌ Failed to process M-Pesa payment for order ${orderId}:`,
      error,
    );
    throw error; // Re-throw to trigger callback retry
  }
}

/**
 * Process premium benefits for M-Pesa orders
 */
async function processPremiumBenefits(order, orderId, cart) {
  const userId = order.userId || order.users;

  // Check premium status
  const premiumStatus = await checkUserPremiumStatus(userId);

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => {
    return sum + parseFloat(item.price || 0) * parseInt(item.quantity || 1);
  }, 0);

  // Calculate premium savings
  const premiumSavings = calculatePremiumSavings(
    subtotal,
    0, // M-Pesa typically has no shipping
    premiumStatus.isPremium,
  );

  // Update order with premium data
  if (premiumSavings.milesTotal > 0) {
    await updateOrderWithPremiumData(orderId, premiumSavings, userId);
    await awardMilesToUser(userId, premiumSavings.milesTotal, orderId);
    console.log(
      `✅ Awarded ${premiumSavings.milesTotal} Nile Miles to user ${userId}`,
    );
  }
}

/**
 * Helper function to archive cancelled/failed order to separate collection
 */
async function archiveCancelledOrder(order, reason, failureType) {
  // Only archive if collection is configured
  if (!env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID) {
    console.warn(
      "Cancelled orders collection not configured, skipping archive",
    );
    return null;
  }

  try {
    const archivedOrder = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID,
      ID.unique(),
      {
        originalOrderId: order.$id,
        userId: order.userId || order.users,
        customerEmail: order.customerEmail,
        username: order.username,
        items: order.items,
        amount: order.amount,
        currency: order.currency || "KES",
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        cancellationReason: reason,
        failureType: failureType, // 'user_cancelled', 'payment_failed', 'timeout'
        mpesaReceiptNumber: order.mpesaReceiptNumber || null,
        mpesaPhone: order.mpesaPhone || null,
        originalCreatedAt: order.createdAt,
        cancelledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    );

    console.log(
      `✅ Order archived to cancelled collection: ${archivedOrder.$id}`,
    );
    return archivedOrder;
  } catch (error) {
    console.error("❌ Failed to archive cancelled order:", error.message);
    return null;
  }
}

const cashonDelivery = async (req, res) => {
  let orderId; // Declare orderId at function scope

  try {
    console.log("=== CASH ON DELIVERY REQUEST ===");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const { cart, userId, customerEmail, username, totalAmount, currency } =
      req.body;

    // Ensure userId is a string, not an array
    const userIdValue = Array.isArray(userId) ? userId[0] : userId;

    // VALIDATION - Only do this once
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        message: "Cart is required and must contain items",
      });
    }

    if (!userIdValue)
      return res.status(400).json({ message: "User ID is required" });
    if (!customerEmail)
      return res.status(400).json({ message: "Customer email is required" });
    if (!username)
      return res.status(400).json({ message: "Username is required" });
    if (!totalAmount)
      return res.status(400).json({ message: "Total amount is required" });
    if (!currency)
      return res.status(400).json({ message: "Currency is required" });

    console.log("=== VALIDATION PASSED ===");
    console.log(`Processing order for ${username}, ${cart.length} items`);

    // 1. CHECK STOCK AVAILABILITY BEFORE CREATING ORDER
    console.log("Checking stock availability...");
    const stockCheck = await checkStockAvailability(cart); // ADD AWAIT HERE

    if (!stockCheck.isAvailable) {
      console.log("Stock check failed:", stockCheck.unavailableItems);
      return res.status(400).json({
        success: false,
        message: "Some items are out of stock or insufficient quantity",
        unavailableItems: stockCheck.unavailableItems,
        stockDetails: stockCheck.stockDetails,
      });
    }

    console.log("✅ Stock check passed");

    // 2. CREATE ORDER DOCUMENT
    const orderDocument = {
      userId: userIdValue, // Changed from 'users' to 'userId' for clarity
      customerEmail: Array.isArray(customerEmail)
        ? customerEmail[0]
        : customerEmail,
      username: Array.isArray(username) ? username[0] : username,
      items: JSON.stringify(cart),
      amount: Math.round(parseFloat(totalAmount)), // Convert string to number
      currency: Array.isArray(currency) ? currency[0] : currency,
      paymentMethod: "Cash on Delivery",
      status: "Pending",
      orderStatus: "Ordered",
      paymentStatus: "succeeded",
      stockChecked: true,
      stockUpdated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. SAVE ORDER TO DATABASE
    console.log("Creating order in database...");
    const result = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      ID.unique(),
      orderDocument,
    );

    orderId = result.$id;
    console.log(`✅ Order created: ${orderId}`);

    // 4. REDUCE STOCK FOR ORDERED PRODUCTS
    console.log("Reducing stock for ordered products...");
    const stockUpdateResult = await reduceProductStock(cart, orderId); // ADD AWAIT HERE

    if (!stockUpdateResult.success) {
      console.error("❌ Stock update failed:", stockUpdateResult.errors);

      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: "Stock update failed",
          stockUpdated: false,
          stockUpdateErrors: JSON.stringify(stockUpdateResult.errors),
          updatedAt: new Date().toISOString(),
        },
      );

      return res.status(500).json({
        success: false,
        message:
          "Order created but stock update failed. Order has been marked as failed.",
        orderId,
        stockUpdateErrors: stockUpdateResult.errors,
      });
    }

    console.log(
      `✅ Stock updated for ${stockUpdateResult.updatedProducts.length} products`,
    );

    // 5. UPDATE ORDER WITH STOCK UPDATE SUCCESS
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
      {
        stockUpdated: true,
        stockUpdateDetails: JSON.stringify(stockUpdateResult.updatedProducts),
        updatedAt: new Date().toISOString(),
      },
    );

    // 6. PREMIUM TRACKING AND MILES CALCULATION
    console.log("Processing premium benefits and miles...");

    // Get user ID from authentication token
    const authenticatedUserId = req.user?.userId || req.user?.$id;
    const finalUserId = Array.isArray(authenticatedUserId)
      ? authenticatedUserId[0]
      : authenticatedUserId || userIdValue;

    // Check if user has premium subscription
    const premiumStatus = await checkUserPremiumStatus(finalUserId);

    // Parse cart to calculate subtotal (excluding shipping)
    const subtotal = cart.reduce((sum, item) => {
      return sum + parseFloat(item.price) * parseInt(item.quantity);
    }, 0);

    // Assume shipping fee is 0 for premium orders, or standard rate
    const shippingFee = premiumStatus.isPremium && subtotal >= 500 ? 0 : 200;

    // Calculate premium savings
    const premiumSavings = calculatePremiumSavings(
      subtotal,
      shippingFee,
      premiumStatus.isPremium,
    );

    console.log("Premium analysis:", {
      isPremium: premiumStatus.isPremium,
      subtotal,
      shippingFee,
      savings: premiumSavings,
    });

    // Update order with premium tracking data
    if (orderId) {
      await updateOrderWithPremiumData(orderId, premiumSavings, finalUserId);

      // Award correct miles amount (premium service handles 2x multiplier)
      if (premiumSavings.milesTotal > 0) {
        await awardMilesToUser(finalUserId, premiumSavings.milesTotal, orderId);
      }
    }

    // Send email confirmation
    try {
      await Emailconfirmation({
        cart,
        customerEmail,
        customerName: username,
        orderId,
        orderTotal: parseFloat(totalAmount),
        paymentMethod: "Cash on Delivery",
        status: "Pending",
      });
      console.log("✅ Email confirmation sent");
    } catch (emailError) {
      console.warn("Email confirmation failed:", emailError.message);
    }

    // 7. RETURN SUCCESS RESPONSE WITH PREMIUM BENEFITS INFO
    const responseData = {
      success: true,
      message:
        "Cash on Delivery order created successfully. Stock has been updated.",
      orderId: orderId,
      createdAt: orderDocument.createdAt,
      stockUpdate: {
        success: true,
        productsUpdated: stockUpdateResult.updatedProducts.length,
        details: stockUpdateResult.updatedProducts,
      },
    };

    // Add premium benefits info if user is premium
    if (premiumStatus.isPremium) {
      responseData.premiumBenefits = {
        discountSaved: premiumSavings.discountAmount,
        deliverySaved: premiumSavings.deliverySavings,
        milesEarned: premiumSavings.milesTotal,
        milesBonus: premiumSavings.milesBonus,
        totalSavings:
          premiumSavings.discountAmount +
          premiumSavings.deliverySavings +
          premiumSavings.milesBonus * 0.1,
      };
    }

    res.status(201).json(responseData);

    console.log(`🎉 Order ${orderId} completed successfully`);
  } catch (error) {
    console.error("❌ Error creating COD order:", error);

    // If order was created but error occurred later, try to mark it as failed
    if (orderId) {
      try {
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          orderId,
          {
            orderStatus: "Failed",
            paymentStatus: "failed",
            failureReason: error.message.substring(0, 200),
            updatedAt: new Date().toISOString(),
          },
        );
        console.log(`Order ${orderId} marked as failed due to error`);
      } catch (updateError) {
        console.error("Failed to update order status:", updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create order.",
      error: error.message,
    });
  }
};

const stripewebpayment = async (req, res) => {
  let orderId; // Declare at function scope for error handling

  try {
    const { cart, userId, customerEmail, username } = req.body;

    // Ensure userId is a string, not an array
    const userIdValue = Array.isArray(userId) ? userId[0] : userId;
    console.log("User ID processed:", userIdValue, "Original:", userId);

    if (!cart || !cart.length || !userIdValue || !customerEmail) {
      return res.status(400).json({ message: "Missing cart or user details" });
    }

    if (!userIdValue)
      return res.status(400).json({ message: "User ID is required" });
    if (!customerEmail)
      return res.status(400).json({ message: "Customer email is required" });
    if (!username)
      return res.status(400).json({ message: "Username is required" });

    console.log("=== STRIPE WEB PAYMENT REQUEST ===");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log(
      `Processing Stripe order for ${username}, ${cart.length} items`,
    );

    // 1. CHECK STOCK AVAILABILITY BEFORE CREATING ORDER
    console.log("Checking stock availability...");
    const stockCheck = await checkStockAvailability(cart);

    if (!stockCheck.isAvailable) {
      console.log("Stock check failed:", stockCheck.unavailableItems);
      return res.status(400).json({
        success: false,
        message: "Some items are out of stock or insufficient quantity",
        unavailableItems: stockCheck.unavailableItems,
        stockDetails: stockCheck.stockDetails,
      });
    }

    console.log("✅ Stock check passed");

    // 2. CREATE ORDER ID AND ORDER DOCUMENT
    orderId = `ORD-${Date.now()}`;

    // Calculate total for order record
    const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);

    // Create order document for database (before stripe session)
    const orderDocument = {
      orderId,
      userId: userIdValue,
      customerEmail,
      username,
      items: JSON.stringify(cart),
      amount: totalAmount, // ⭐⭐⭐ CHANGE THIS: Store in dollars ⭐⭐⭐
      currency: "usd",
      paymentMethod: "Card",
      status: "pending",
      orderStatus: "Ordered",
      paymentStatus: "initiated",
      stockChecked: true,
      stockUpdated: false, // Will update after payment success
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. REDUCE STOCK TEMPORARILY (We'll restore if payment fails)
    console.log("Reducing stock for order...");
    const stockUpdateResult = await reduceProductStock(cart, orderId);

    if (!stockUpdateResult.success) {
      console.error("❌ Stock reduction failed:", stockUpdateResult.errors);
      return res.status(500).json({
        success: false,
        message: "Failed to reserve stock for your order",
        errors: stockUpdateResult.errors,
      });
    }

    console.log(
      `✅ Stock reduced for ${stockUpdateResult.updatedProducts.length} products`,
    );

    // 4. CREATE STRIPE CHECKOUT SESSION
    const lineItems = cart.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName || item.name,
          images: [item.productImage],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      metadata: {
        userId: userIdValue,
        username,
        orderId,
        stockReduced: "true", // Flag to indicate stock was reduced
        stockUpdateId: orderId, // Use orderId as reference
      },
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${FRONTEND_URL}/payment-cancelled?orderId=${orderId}`, // Important for stock restoration
    });

    // 5. SAVE ORDER TO DATABASE WITH STOCK INFO
    orderDocument.sessionId = session.id;
    orderDocument.stockUpdateDetails = JSON.stringify(
      stockUpdateResult.updatedProducts,
    );
    orderDocument.stockUpdated = true; // Mark as updated (temporarily)

    try {
      await functions.createExecution(
        env.ORDER_FUNCTION_WEB_ID,
        JSON.stringify({
          ...orderDocument,
          paymentStatus: "initiated",
          stockUpdate: stockUpdateResult,
        }),
        true, // Synchronous
      );
    } catch (orderError) {
      console.error("Order creation failed:", orderError);

      // CRITICAL: If order creation fails, restore stock
      console.log("🔄 Restoring stock due to order creation failure...");
      await restoreProductStock(cart, "order_creation_failed");

      return res.status(500).json({
        success: false,
        message: "Order creation failed. Stock has been restored.",
        error: orderError.message,
      });
    }

    // 6. RESPOND TO FRONTEND
    res.json({
      success: true,
      sessionId: session.id,
      orderId,
      orderStatus: "Ordered",
      stockReserved: true,
      message: "Stock reserved for your order. Complete payment to confirm.",
    });

    // 7. ASYNC NOTIFICATIONS (after response)
    (async () => {
      try {
        // Create notification
        const notificationResult = await createNotification({
          message: `💳 Stripe order #${orderId} initiated by ${customerEmail}. Stock temporarily reserved.`,
          type: "stripe_order_initiated",
          username: username || customerEmail,
          userId,
          email: customerEmail,
          metadata: JSON.stringify({
            orderId,
            sessionId: session.id,
            productsCount: cart.length,
            stockReserved: true,
          }),
        });

        console.log(`✅ Notification created:`, notificationResult);

        // Send email confirmation
        await Emailconfirmation({
          cart,
          customerEmail,
          customerName: username || customerEmail,
          orderId,
          orderTotal: totalAmount,
          paymentMethod: "Credit Card",
          status: "Pending Payment",
        });

        console.log(`✅ Email sent to ${customerEmail}`);

        // Add Nile Miles (only after payment success, not here)
        await addNileMilesOnPurchase(userId, totalAmount);
      } catch (err) {
        console.error("❌ Async operations error:", err.message);
      }
    })();

    // After creating order, clear user's cart
    try {
      // Clear cart from backend
      const cartItems = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CART_COLLECTION_ID,
        [Query.equal("userId", userId)],
      );

      // Delete all cart items
      for (const item of cartItems.documents) {
        await db.deleteDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CART_COLLECTION_ID,
          item.$id,
        );
      }

      console.log(`✅ Cleared ${cartItems.total} items from user's cart`);
    } catch (cartError) {
      console.error("Cart clearing error:", cartError);
      // Don't fail the payment if cart clearing fails
    }
  } catch (error) {
    console.error("❌ Stripe checkout error:", error);

    // Restore stock if error occurred after stock was reduced
    if (orderId && cart) {
      try {
        console.log("🔄 Restoring stock due to error...");
        await restoreProductStock(cart, "checkout_error");
      } catch (restoreError) {
        console.error("Failed to restore stock:", restoreError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Checkout failed. Please try again.",
      error: error.message,
    });
  }
};

// NEW: Stripe mobile payment using PaymentSheets with enhanced error handling
const stripeMobilePaymentSheet = async (req, res) => {
  try {
    console.log("=== STRIPE MOBILE PAYMENT SHEET REQUEST ===");
    const { cart, userId, customerEmail, username } = req.body;

    console.log("Request data:", { cart, userId, customerEmail, username });

    if (!cart || !cart.length || !userId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing cart or user details",
      });
    }

    // 1. CHECK STOCK AVAILABILITY
    const stockCheck = await checkStockAvailability(cart);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Some items are out of stock or insufficient quantity",
        unavailableItems: stockCheck.unavailableItems,
      });
    }

    const createdAt = new Date().toISOString();

    // Calculate amount in KES
    const totalAmountKES = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    console.log(`Total amount calculated: ${totalAmountKES} KES`);

    if (!totalAmountKES || isNaN(totalAmountKES) || totalAmountKES <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount calculated from cart.",
      });
    }

    // For small amounts, suggest alternative payment methods
    const MINIMUM_RECOMMENDED_AMOUNT = 50; // Soft minimum
    const ABSOLUTE_MINIMUM_AMOUNT = 30; // Hard minimum

    if (totalAmountKES < ABSOLUTE_MINIMUM_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Cart amount is too small. Minimum cart value is KES ${ABSOLUTE_MINIMUM_AMOUNT}. Please add more items.`,
        minimumAmount: ABSOLUTE_MINIMUM_AMOUNT,
        currentAmount: totalAmountKES,
        error: "amount_too_small",
      });
    }

    // For amounts below recommended minimum, suggest M-Pesa but allow card payment
    let warningMessage = null;
    if (totalAmountKES < MINIMUM_RECOMMENDED_AMOUNT) {
      warningMessage = `For small amounts like KES ${totalAmountKES}, we recommend using M-Pesa for faster processing.`;
    }

    const currency = "kes";
    const orderId = `ORD-${Date.now()}`;

    console.log(`Creating order ${orderId} for ${totalAmountKES} KES`);

    // 2. CREATE ORDER
    const orderData = {
      orderId,
      products: cart,
      customerEmail,
      username,
      userId: userId,
      paymentStatus: "initiated",
      timestamp: createdAt,
      stockChecked: true,
      stockCheckedAt: new Date().toISOString(),
      amountKES: totalAmountKES,
      currency: currency,
    };

    try {
      await functions.createExecution(
        env.ORDER_FUNCTION_MOBILE_ID,
        JSON.stringify(orderData),
      );
      console.log(`✅ Order ${orderId} created successfully`);
    } catch (orderError) {
      console.error("Order creation failed:", orderError);
      return res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: orderError.message,
      });
    }

    // 3. CREATE PAYMENT INTENT
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmountKES * 100), // Convert to cents
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          customerEmail,
          userId: userId,
          orderId,
          stockReserved: "true",
          productsCount: cart.length,
          amountKES: totalAmountKES.toString(),
        },
        description: `NileMart Order ${orderId} - ${cart.length} items (KES ${totalAmountKES})`,
      });

      console.log(`✅ Payment intent created: ${paymentIntent.id}`);

      // Send email confirmation
      try {
        await Emailconfirmation({
          cart,
          customerEmail,
          customerName: username,
          orderId,
          orderTotal: totalAmountKES,
          paymentMethod: "Card Payment",
          status: "Payment Initiated",
        });
        console.log("✅ Email confirmation sent");
      } catch (emailError) {
        console.warn("Email confirmation failed:", emailError.message);
      }

      const response = {
        success: true,
        client_secret: paymentIntent.client_secret,
        orderId,
        orderStatus: "Ordered",
        createdAt,
        stockChecked: true,
        amountKES: totalAmountKES,
        currency: currency,
        paymentIntentId: paymentIntent.id,
      };

      if (warningMessage) {
        response.warning = warningMessage;
        response.suggestedPaymentMethod = "M-Pesa";
      }

      return res.json(response);
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);

      // Handle specific Stripe errors
      if (stripeError.code === "amount_too_small") {
        return res.status(400).json({
          success: false,
          message:
            "Amount too small for card payments. Please add more items to your cart or use M-Pesa payment.",
          error: "amount_too_small",
          suggestedPaymentMethod: "M-Pesa",
          minimumAmount: 50,
          currentAmount: totalAmountKES,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Payment processing failed",
        error: stripeError.message,
      });
    }
  } catch (error) {
    console.error("❌ Mobile payment sheet error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
};

// Add to your payments controller
const stripePaymentCancelled = async (req, res) => {
  try {
    const { orderId, sessionId } = req.body;

    console.log("=== STRIPE PAYMENT CANCELLED ===");
    console.log("Order ID:", orderId);
    console.log("Session ID:", sessionId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // 1. Get order details
    let order;
    try {
      order = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
      );
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2. Restore stock if payment was cancelled
    if (
      order.paymentStatus === "initiated" ||
      order.paymentStatus === "pending"
    ) {
      const cart = JSON.parse(order.items || "[]");

      if (cart.length > 0) {
        const restoreResult = await restoreProductStock(
          cart,
          "payment_cancelled",
        );

        console.log("🔄 Stock restored:", restoreResult.restoredProducts);

        // Update order status
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          orderId,
          {
            paymentStatus: "cancelled",
            orderStatus: "Cancelled",
            status: "cancelled",
            stockRestored: true,
            stockRestoreDetails: JSON.stringify(restoreResult.restoredProducts),
            updatedAt: new Date().toISOString(),
          },
        );

        // Send notification
        await createNotification({
          message: `❌ Payment cancelled for order #${orderId}. Stock restored.`,
          type: "payment_cancelled",
          username: order.username,
          userId: order.userId || order.users,
          email: order.customerEmail,
          metadata: JSON.stringify({
            orderId,
            productsRestored: restoreResult.restoredProducts.length,
          }),
        });
      }
    }

    res.json({
      success: true,
      message: "Payment cancelled and stock restored",
      orderId,
    });
  } catch (error) {
    console.error("Payment cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process cancellation",
      error: error.message,
    });
  }
};

const verifyStripePayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // ✅ Update your DB order to "Paid"
      const order = {
        orderId: session.metadata.orderId,
        userId: session.metadata.userId || session.metadata.users,
        username: session.metadata.username,
        totalAmount: (session.amount_total / 100).toFixed(2),
        status: "Paid",
      };

      // Example: updateOrder(order.orderId, { status: "Paid" });
      return res.json({ success: true, order });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        status: session.payment_status,
      });
    }
  } catch (err) {
    console.error("Stripe verify error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

const PayPalCreateOrder = async (req, res) => {
  try {
    const { cart, totalAmount, userId } = req.body;

    if (!cart || !totalAmount || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmount.toFixed(2), // dynamic amount
          },
          description: `Order for user ${userId}`,
        },
      ],
    });

    const response = await client().execute(request);
    res.json({ orderID: response.result.id });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

const PayPalCaptureOrder = async (req, res) => {
  const { orderID } = req.body;

  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const response = await client().execute(request);
    res.json({ status: response.result.status, details: response.result });
  } catch (err) {
    console.error("Capture Error:", err);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};

const Emailconfirmation = async ({
  customerEmail,
  customerName,
  orderId,
  orderTotal,
  cart,
  paymentMethod,
  status,
}) => {
  try {
    await sendOrderConfirmationEmail({
      customerEmail,
      customerName,
      orderId,
      orderTotal,
      cart,
      paymentMethod,
      status,
    });
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
  }
};

/**
 * Get M-Pesa OAuth Access Token
 */
async function getMpesaAccessToken() {
  const consumerKey = env.MPESA_CONSUMER_KEY;
  const consumerSecret = env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "M-Pesa consumer key and secret are required. Check your .env file.",
    );
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  );

  const url =
    env.MPESA_ENVIRONMENT === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  try {
    console.log("Requesting M-Pesa OAuth token from:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    console.log("M-Pesa OAuth response:", data);

    if (!response.ok) {
      throw new Error(
        `M-Pesa auth failed: ${data.errorMessage || response.statusText}`,
      );
    }

    return data.access_token;
  } catch (error) {
    console.error("M-Pesa OAuth error:", error);
    throw error;
  }
}

/**
 * Initiate M-Pesa STK Push (Lipa na M-Pesa Online)
 */
const initiateMpesaPayment = async (req, res) => {
  try {
    console.log("=== M-PESA STK PUSH REQUEST ===");
    const {
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
      userId,
      cart,
      customerEmail,
      username,
      currency,
    } = req.body;

    // Ensure userId is a string, not an array
    const userIdValue = Array.isArray(userId) ? userId[0] : userId;
    console.log("User ID processed:", userIdValue, "Original:", userId);

    // Validation
    if (!phoneNumber || !amount || !accountReference) {
      return res.status(400).json({
        success: false,
        message: "Phone number, amount, and account reference are required",
      });
    }

    // Format phone number (remove + and ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Check stock availability
    if (cart && Array.isArray(cart)) {
      const stockCheck = await checkStockAvailability(cart);
      if (!stockCheck.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Some items are out of stock",
          unavailableItems: stockCheck.unavailableItems,
        });
      }
    }

    // Get access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    // Generate password
    const shortCode = env.MPESA_SHORTCODE;
    const passkey = env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
      "base64",
    );

    // Create order in database first
    const orderId = ID.unique();
    const orderDocument = {
      userId: userIdValue,
      customerEmail,
      username,
      items: JSON.stringify(cart || []),
      amount: Math.round(parseFloat(amount)),
      currency: currency || "KES",
      paymentMethod: "M-Pesa",
      status: "Pending",
      orderStatus: "Pending Payment",
      paymentStatus: "pending",
      mpesaPhone: formattedPhone,
      stockChecked: true,
      stockUpdated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
      orderDocument,
    );

    console.log(`✅ M-Pesa order created: ${orderId}`);

    // Prepare STK Push request
    const stkUrl =
      env.MPESA_ENVIRONMENT === "production"
        ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(parseFloat(amount)),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL:
        env.MPESA_CALLBACK_URL ||
        `${env.BACKEND_URL}/api/payments/mpesa/callback`,
      AccountReference: accountReference || orderId,
      TransactionDesc: transactionDesc || `Payment for order ${orderId}`,
    };

    console.log("Sending STK Push...");
    const stkResponse = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    // Get response text first to handle non-JSON responses
    const responseText = await stkResponse.text();
    console.log("STK Push Raw Response:", responseText);

    let stkData;
    try {
      stkData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse M-Pesa response:", responseText);

      // Update order as failed
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: "Invalid M-Pesa response - likely callback URL issue",
          updatedAt: new Date().toISOString(),
        },
      );

      return res.status(500).json({
        success: false,
        message:
          "M-Pesa returned an invalid response. Check your callback URL configuration.",
        hint: "Ensure MPESA_CALLBACK_URL is a valid HTTPS URL accessible by M-Pesa servers",
      });
    }

    console.log("STK Push Response:", stkData);

    if (stkData.ResponseCode === "0") {
      // Update order with checkout request ID
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          mpesaCheckoutRequestID: stkData.CheckoutRequestID,
          mpesaMerchantRequestID: stkData.MerchantRequestID,
          updatedAt: new Date().toISOString(),
        },
      );

      return res.status(200).json({
        success: true,
        message: "STK Push sent successfully. Please check your phone.",
        orderId,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
      });
    } else {
      // Update order as failed
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: stkData.ResponseDescription || "STK Push failed",
          updatedAt: new Date().toISOString(),
        },
      );

      return res.status(400).json({
        success: false,
        message:
          stkData.ResponseDescription || "Failed to initiate M-Pesa payment",
        errorCode: stkData.ResponseCode,
      });
    }
  } catch (error) {
    console.error("❌ M-Pesa STK Push error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate M-Pesa payment",
      error: error.message,
    });
  }
};

/**
 * M-Pesa Payment Callback - PRODUCTION SAFE with idempotency
 */
const mpesaCallback1 = async (req, res) => {
  try {
    console.log("=== M-PESA CALLBACK RECEIVED ===");
    console.log("Callback Body:", JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // CRITICAL: Prevent duplicate processing with distributed lock
    const lockKey = `mpesa_callback_${CheckoutRequestID}`;
    if (processedCallbacks.has(lockKey)) {
      console.log(`M-Pesa callback already processed: ${CheckoutRequestID}`);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // Mark as processing
    processedCallbacks.set(lockKey, Date.now());

    // Find order by checkout request ID with proper error handling
    let orders;
    try {
      orders = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        [
          Query.equal("mpesaCheckoutRequestID", CheckoutRequestID),
          Query.limit(1),
        ],
      );
    } catch (dbError) {
      console.error("Database error finding order:", dbError);
      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 1, ResultDesc: "Database error" });
    }

    if (!orders.documents || orders.documents.length === 0) {
      console.warn("No order found for CheckoutRequestID:", CheckoutRequestID);
      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "Order not found" });
    }

    const order = orders.documents[0];
    const orderId = order.$id;

    // Check if order is already processed (double callback protection)
    if (order.paymentStatus === "succeeded") {
      console.log(`Order ${orderId} already marked as paid`);
      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // ResultCode 0 = Success
    if (ResultCode === 0) {
      console.log("✅ M-Pesa payment successful for order:", orderId);

      // Extract payment details from metadata
      let mpesaReceiptNumber = "";
      let amount = 0;
      let phoneNumber = "";

      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach((item) => {
          if (item.Name === "MpesaReceiptNumber")
            mpesaReceiptNumber = item.Value;
          if (item.Name === "Amount") amount = item.Value;
          if (item.Name === "PhoneNumber") phoneNumber = item.Value;
        });
      }

      // Process payment atomically
      await processSuccessfulMpesaPayment(order, orderId, {
        mpesaReceiptNumber,
        amount,
        phoneNumber,
      });
    } else {
      // Payment failed
      console.log(
        `❌ M-Pesa payment failed for order ${orderId}: ${ResultDesc}`,
      );

      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: ResultDesc,
          updatedAt: new Date().toISOString(),
        },
      );
    }

    // Clear processing lock
    processedCallbacks.delete(lockKey);

    // Always respond with success to M-Pesa to prevent retries
    return res
      .status(200)
      .json({ ResultCode: 0, ResultDesc: "Callback processed" });
  } catch (error) {
    console.error("❌ M-Pesa callback error:", error);
    // Still return 200 to prevent retries
    return res
      .status(200)
      .json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
};

const mpesaCallback = async (req, res) => {
  try {
    console.log("=== M-PESA CALLBACK RECEIVED ===");
    console.log("Callback Body:", JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // CRITICAL: Prevent duplicate processing with distributed lock
    const lockKey = `mpesa_callback_${CheckoutRequestID}`;
    if (processedCallbacks.has(lockKey)) {
      console.log(`M-Pesa callback already processed: ${CheckoutRequestID}`);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // Mark as processing
    processedCallbacks.set(lockKey, Date.now());

    // Find order by checkout request ID with proper error handling
    let orders;
    try {
      orders = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        [
          Query.equal("mpesaCheckoutRequestID", CheckoutRequestID),
          Query.limit(1),
        ],
      );
    } catch (dbError) {
      console.error("Database error finding order:", dbError);
      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 1, ResultDesc: "Database error" });
    }

    // If no order found, check for subscription
    if (!orders.documents || orders.documents.length === 0) {
      console.warn("No order found for CheckoutRequestID:", CheckoutRequestID);

      // Try to find a pending subscription instead
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          const subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("checkoutRequestId", CheckoutRequestID),
              Query.equal("status", "pending"),
              Query.limit(1),
            ],
          );

          if (subscriptions.documents && subscriptions.documents.length > 0) {
            console.log(
              "Found pending subscription for CheckoutRequestID:",
              CheckoutRequestID,
            );

            // Process subscription payment
            const subscription = subscriptions.documents[0];
            const userId = subscription.userId;

            // ResultCode 0 = Success
            if (ResultCode === 0) {
              console.log("✅ M-Pesa subscription payment successful");

              // Extract payment details from metadata
              let mpesaReceiptNumber = "";
              let amount = 0;
              let phoneNumber = "";

              if (CallbackMetadata && CallbackMetadata.Item) {
                CallbackMetadata.Item.forEach((item) => {
                  if (item.Name === "MpesaReceiptNumber")
                    mpesaReceiptNumber = item.Value;
                  if (item.Name === "Amount") amount = item.Value;
                  if (item.Name === "PhoneNumber") phoneNumber = item.Value;
                });
              }

              // Update subscription to active
              await db.updateDocument(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
                subscription.$id,
                {
                  status: "active",
                  transactionId: mpesaReceiptNumber,
                },
              );

              // Get user and update premium status
              const { users } = require("../../services/appwriteService");
              const user = await users.get(userId);

              // Update user prefs with premium status
              await users.updatePrefs(userId, {
                ...user.prefs,
                isPremium: true,
                subscriptionId: subscription.subscriptionId,
                subscriptionExpiresAt: subscription.expiresAt,
                subscriptionStartedAt: subscription.startedAt,
                subscriptionCancelledAt: null,
              });

              // Update user collection document attributes if exists
              if (env.APPWRITE_USER_COLLECTION_ID) {
                try {
                  const userDocs = await db.listDocuments(
                    env.APPWRITE_DATABASE_ID,
                    env.APPWRITE_USER_COLLECTION_ID,
                    [Query.equal("email", user.email)],
                  );
                  if (userDocs.documents.length > 0) {
                    await db.updateDocument(
                      env.APPWRITE_DATABASE_ID,
                      env.APPWRITE_USER_COLLECTION_ID,
                      userDocs.documents[0].$id,
                      {
                        isPremium: true,
                        subscriptionId: subscription.subscriptionId,
                        startedAt: subscription.startedAt,
                        cancelledAt: null,
                      },
                    );
                  }
                } catch (docError) {
                  console.error("Error updating user document:", docError);
                }
              }

              console.log(
                `✅ User ${userId} premium activated until ${subscription.expiresAt}`,
              );

              // Send welcome email
              try {
                const SubscriptionEmailService = require("../../services/subscriptionEmailService");
                const userName =
                  user.name || user.prefs?.name || "Valued Customer";
                await SubscriptionEmailService.sendWelcomeEmail({
                  email: user.email,
                  name: userName,
                  expiresAt: subscription.expiresAt,
                  subscriptionId: subscription.subscriptionId,
                  amount: subscription.amount || 200,
                  paymentMethod: "mpesa",
                });
              } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
              }
            } else {
              // Subscription payment failed
              console.log(
                `❌ M-Pesa subscription payment failed: ${ResultDesc}`,
              );

              await db.updateDocument(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
                subscription.$id,
                {
                  status: "failed",
                  failureReason: ResultDesc,
                },
              );
            }

            processedCallbacks.delete(lockKey);
            return res.status(200).json({
              ResultCode: 0,
              ResultDesc: "Subscription callback processed",
            });
          }
        } catch (subError) {
          console.error("Error processing subscription callback:", subError);
        }
      }

      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "No order or subscription found" });
    }

    const order = orders.documents[0];
    const orderId = order.$id;

    // Check if order is already processed (double callback protection)
    if (order.paymentStatus === "succeeded") {
      console.log(`Order ${orderId} already marked as paid`);
      processedCallbacks.delete(lockKey);
      return res
        .status(200)
        .json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    // ResultCode 0 = Success
    if (ResultCode === 0) {
      console.log("✅ M-Pesa payment successful for order:", orderId);

      // Extract payment details from metadata
      let mpesaReceiptNumber = "";
      let amount = 0;
      let phoneNumber = "";

      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach((item) => {
          if (item.Name === "MpesaReceiptNumber")
            mpesaReceiptNumber = item.Value;
          if (item.Name === "Amount") amount = item.Value;
          if (item.Name === "PhoneNumber") phoneNumber = item.Value;
        });
      }

      // Process payment atomically
      await processSuccessfulMpesaPayment(order, orderId, {
        mpesaReceiptNumber,
        amount,
        phoneNumber,
      });
    } else {
      // Payment failed
      console.log(
        `❌ M-Pesa payment failed for order ${orderId}: ${ResultDesc}`,
      );

      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: ResultDesc,
          updatedAt: new Date().toISOString(),
        },
      );
    }

    // Clear processing lock
    processedCallbacks.delete(lockKey);

    // Always respond with success to M-Pesa to prevent retries
    return res
      .status(200)
      .json({ ResultCode: 0, ResultDesc: "Callback processed" });
  } catch (error) {
    console.error("❌ M-Pesa callback error:", error);
    // Still return 200 to prevent retries
    return res
      .status(200)
      .json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
};

/**
 * Check M-Pesa Payment Status
 */
const mpesaPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Get order from database
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.$id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      amount: order.amount,
      mpesaReceiptNumber: order.mpesaReceiptNumber || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("❌ M-Pesa status check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check payment status",
      error: error.message,
    });
  }
};

/**
 * Cancel M-Pesa Payment
 */
const mpesaCancelPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Get order from database
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only cancel if payment is still pending
    if (
      order.paymentStatus === "pending" ||
      order.paymentStatus === "initiated"
    ) {
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Cancelled",
          paymentStatus: "cancelled",
          status: "Cancelled",
          updatedAt: new Date().toISOString(),
        },
      );

      // Archive to cancelled orders collection
      await archiveCancelledOrder(
        order,
        "Cancelled by customer",
        "user_cancelled",
      );

      // Send cancellation email
      try {
        const cart = JSON.parse(order.items || "[]");
        await sendOrderCancellationEmail({
          customerEmail: order.customerEmail,
          customerName: order.username,
          orderId,
          orderTotal: parseFloat(order.amount),
          cart,
          cancellationReason: "Cancelled by customer",
        });
        console.log("✅ Cancellation email sent");
      } catch (emailError) {
        console.warn("Cancellation email error:", emailError.message);
      }

      // Send notification
      try {
        await createNotification({
          userId: order.userId || order.users,
          message: `Your M-Pesa payment for order ${orderId} was cancelled.`,
          type: "payment",
          username: order.username,
          email: order.customerEmail,
        });
      } catch (e) {
        console.warn("Notification error:", e.message);
      }

      return res.status(200).json({
        success: true,
        message: "Payment cancelled successfully",
        orderId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel payment with status: ${order.paymentStatus}`,
        paymentStatus: order.paymentStatus,
      });
    }
  } catch (error) {
    console.error("❌ M-Pesa cancel payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
      error: error.message,
    });
  }
};

/**
 * Cancel Cash on Delivery Order
 */
const cancelCodOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Get order from database
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only allow cancellation for COD orders that are pending
    if (order.paymentMethod !== "Cash on Delivery") {
      return res.status(400).json({
        success: false,
        message:
          "Only Cash on Delivery orders can be cancelled through this endpoint",
      });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`,
      });
    }

    // Update order status
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
      {
        orderStatus: "Cancelled",
        paymentStatus: "cancelled",
        status: "Cancelled",
        updatedAt: new Date().toISOString(),
      },
    );

    // Archive to cancelled orders collection
    await archiveCancelledOrder(
      order,
      "Order cancelled by customer",
      "user_cancelled",
    );

    // Restore stock if it was reduced
    if (order.stockUpdated) {
      try {
        const cart = JSON.parse(order.items || "[]");
        // Note: You'll need to implement restoreProductStock function
        // For now, we'll just log it
        console.log("TODO: Restore stock for cancelled COD order", cart);
      } catch (e) {
        console.warn("Stock restore error:", e.message);
      }
    }

    // Send cancellation email
    try {
      const cart = JSON.parse(order.items || "[]");
      await sendOrderCancellationEmail({
        customerEmail: order.customerEmail,
        customerName: order.username,
        orderId,
        orderTotal: parseFloat(order.amount),
        cart,
        cancellationReason: "Order cancelled by customer",
      });
      console.log("✅ Cancellation email sent");
    } catch (emailError) {
      console.warn("Cancellation email error:", emailError.message);
    }

    // Send notification
    try {
      await createNotification({
        userId: order.userId || order.users,
        message: `Your Cash on Delivery order ${orderId} was cancelled successfully.`,
        type: "order",
        username: order.username,
        email: order.customerEmail,
      });
    } catch (e) {
      console.warn("Notification error:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      orderId,
    });
  } catch (error) {
    console.error("❌ Cancel COD order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

module.exports = {
  PayPalCaptureOrder,
  PayPalCreateOrder,
  Emailconfirmation,
  stripewebpayment,
  cashonDelivery,
  verifyStripePayment,
  stripePaymentCancelled,
  initiateMpesaPayment,
  mpesaCallback,
  mpesaPaymentStatus,
  mpesaCancelPayment,
  cancelCodOrder,
  stripeMobilePaymentSheet, // New PaymentSheet endpoint
};
