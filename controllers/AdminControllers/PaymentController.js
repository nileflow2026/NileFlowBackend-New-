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

const FRONTEND_URL = env.FRONTEND_UR || "http://localhost:5173";

/**
 * Helper function to archive cancelled/failed order to separate collection
 */
async function archiveCancelledOrder(order, reason, failureType) {
  // Only archive if collection is configured
  if (!env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID) {
    console.warn(
      "Cancelled orders collection not configured, skipping archive"
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
        users: order.users,
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
      }
    );

    console.log(
      `✅ Order archived to cancelled collection: ${archivedOrder.$id}`
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

    // VALIDATION - Only do this once
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        message: "Cart is required and must contain items",
      });
    }

    if (!userId)
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
      users: userId,
      customerEmail,
      username,
      items: JSON.stringify(cart),
      amount: Math.round(parseFloat(totalAmount)), // Convert string to number
      currency,
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
      orderDocument
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
        }
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
      `✅ Stock updated for ${stockUpdateResult.updatedProducts.length} products`
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
      }
    );

    // 6. PREMIUM TRACKING AND MILES CALCULATION
    console.log("Processing premium benefits and miles...");

    // Get user ID from authentication token
    const authenticatedUserId = req.user?.userId || req.user?.$id;

    // Check if user has premium subscription
    const premiumStatus = await checkUserPremiumStatus(
      authenticatedUserId || userId
    );

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
      premiumStatus.isPremium
    );

    console.log("Premium analysis:", {
      isPremium: premiumStatus.isPremium,
      subtotal,
      shippingFee,
      savings: premiumSavings,
    });

    // Update order with premium tracking data
    if (orderId) {
      await updateOrderWithPremiumData(
        orderId,
        premiumSavings,
        authenticatedUserId || userId
      );

      // Award correct miles amount (premium service handles 2x multiplier)
      if (premiumSavings.milesTotal > 0) {
        await awardMilesToUser(
          authenticatedUserId || userId,
          premiumSavings.milesTotal,
          orderId
        );
        console.log(
          `✅ Awarded ${premiumSavings.milesTotal} Nile Miles (Premium: ${premiumStatus.isPremium})`
        );
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
          }
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

    if (!cart || !cart.length || !userId || !customerEmail) {
      return res.status(400).json({ message: "Missing cart or user details" });
    }

    if (!userId)
      return res.status(400).json({ message: "User ID is required" });
    if (!customerEmail)
      return res.status(400).json({ message: "Customer email is required" });
    if (!username)
      return res.status(400).json({ message: "Username is required" });

    console.log("=== STRIPE WEB PAYMENT REQUEST ===");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log(
      `Processing Stripe order for ${username}, ${cart.length} items`
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
      users: userId,
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
      `✅ Stock reduced for ${stockUpdateResult.updatedProducts.length} products`
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
        users: userId,
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
      stockUpdateResult.updatedProducts
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
        true // Synchronous
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
        [Query.equal("userId", userId)]
      );

      // Delete all cart items
      for (const item of cartItems.documents) {
        await db.deleteDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CART_COLLECTION_ID,
          item.$id
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
        orderId
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
          "payment_cancelled"
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
          }
        );

        // Send notification
        await createNotification({
          message: `❌ Payment cancelled for order #${orderId}. Stock restored.`,
          type: "payment_cancelled",
          username: order.username,
          userId: order.users,
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
        userId: session.metadata.users,
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
      "M-Pesa consumer key and secret are required. Check your .env file."
    );
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
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
        `M-Pesa auth failed: ${data.errorMessage || response.statusText}`
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
      "base64"
    );

    // Create order in database first
    const orderId = ID.unique();
    const orderDocument = {
      users: userId,
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
      orderDocument
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
        }
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
        }
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
        }
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
 * M-Pesa Payment Callback
 */
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

    // Find order by checkout request ID
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.equal("mpesaCheckoutRequestID", CheckoutRequestID)]
    );

    if (!orders.documents || orders.documents.length === 0) {
      console.warn("No order found for CheckoutRequestID:", CheckoutRequestID);
      return res.status(200).json({ message: "Order not found" });
    }

    const order = orders.documents[0];
    const orderId = order.$id;

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

      // Reduce stock
      const cart = JSON.parse(order.items || "[]");
      if (cart.length > 0) {
        const stockUpdateResult = await reduceProductStock(cart, orderId);
        if (!stockUpdateResult.success) {
          console.error("Stock update failed:", stockUpdateResult.errors);
        }
      }

      // Update order status
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Ordered",
          paymentStatus: "succeeded",
          status: "Pending",
          mpesaReceiptNumber,
          mpesaTransactionDate: new Date().toISOString(),
          stockUpdated: true,
          updatedAt: new Date().toISOString(),
        }
      );

      // PREMIUM TRACKING AND MILES CALCULATION
      console.log("Processing premium benefits for M-Pesa order...");

      // Check if user has premium subscription
      const premiumStatus = await checkUserPremiumStatus(order.users);

      // Calculate subtotal from cart items
      const orderCart = JSON.parse(order.items || "[]");
      const subtotal = orderCart.reduce((sum, item) => {
        return sum + parseFloat(item.price || 0) * parseInt(item.quantity || 0);
      }, 0);

      // Determine shipping fee (0 for premium users on orders >=500, otherwise 200)
      const shippingFee = premiumStatus.isPremium && subtotal >= 500 ? 0 : 200;

      // Calculate premium savings
      const premiumSavings = calculatePremiumSavings(
        subtotal,
        shippingFee,
        premiumStatus.isPremium
      );

      console.log("M-Pesa Premium analysis:", {
        isPremium: premiumStatus.isPremium,
        subtotal,
        shippingFee,
        savings: premiumSavings,
      });

      // Update order with premium tracking data
      await updateOrderWithPremiumData(orderId, premiumSavings, order.users);

      // Award correct miles amount (using premium service instead of old method)
      if (premiumSavings.milesTotal > 0) {
        await awardMilesToUser(order.users, premiumSavings.milesTotal, orderId);
        console.log(
          `✅ Awarded ${premiumSavings.milesTotal} Nile Miles via premium service (Premium: ${premiumStatus.isPremium})`
        );
      }

      // Send confirmation email
      try {
        await Emailconfirmation({
          cart: orderCart,
          customerEmail: order.customerEmail,
          customerName: order.username,
          orderId,
          orderTotal: parseFloat(order.amount),
          paymentMethod: "M-Pesa",
          status: "Confirmed",
        });
      } catch (e) {
        console.warn("Email error:", e.message);
      }

      // Create notification with premium benefits info
      const notificationMessage = premiumStatus.isPremium
        ? `Your M-Pesa payment of KES ${amount} was successful. Order ${orderId} confirmed. Premium benefits applied: ${premiumSavings.milesTotal} Nile Miles earned (2x bonus), ${premiumSavings.discountAmount} KSH discount saved.`
        : `Your M-Pesa payment of KES ${amount} was successful. Order ${orderId} confirmed.`;

      try {
        await createNotification({
          userId: order.users,
          message: notificationMessage,
          type: "payment",
          username: order.username,
          email: order.customerEmail,
        });
      } catch (e) {
        console.warn("Notification error:", e.message);
      }

      console.log("🎉 M-Pesa order completed:", orderId);
    } else {
      // Payment failed or cancelled
      console.warn(
        `❌ M-Pesa payment failed for order ${orderId}:`,
        ResultDesc
      );

      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId,
        {
          orderStatus: "Failed",
          paymentStatus: "failed",
          failureReason: ResultDesc,
          mpesaResultCode: ResultCode?.toString() || "",
          updatedAt: new Date().toISOString(),
        }
      );

      // Archive to cancelled orders collection
      await archiveCancelledOrder(
        order,
        ResultDesc,
        ResultCode === 1032 ? "user_cancelled" : "payment_failed"
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
          cancellationReason: ResultDesc,
        });
        console.log("✅ Cancellation email sent");
      } catch (emailError) {
        console.warn("Cancellation email error:", emailError.message);
      }

      // Notify user
      try {
        await createNotification({
          userId: order.users,
          message: `Your M-Pesa payment failed: ${ResultDesc}`,
          type: "payment",
          username: order.username,
          email: order.customerEmail,
        });
      } catch (e) {
        console.warn("Notification error:", e.message);
      }
    }

    // Always respond with success to M-Pesa
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
      orderId
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
      orderId
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
        }
      );

      // Archive to cancelled orders collection
      await archiveCancelledOrder(
        order,
        "Cancelled by customer",
        "user_cancelled"
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
          userId: order.users,
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
      orderId
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
      }
    );

    // Archive to cancelled orders collection
    await archiveCancelledOrder(
      order,
      "Order cancelled by customer",
      "user_cancelled"
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
        userId: order.users,
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
};
