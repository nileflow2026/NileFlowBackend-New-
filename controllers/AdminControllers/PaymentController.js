const { db, functions } = require("../../services/appwriteService");
const { client } = require("../../services/paypal");
const { env } = require("../../src/env");
const Stripe = require("stripe");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const {
  sendOrderConfirmationEmail,
} = require("../../services/send-confirmation");
const { createNotification } = require("../UserControllers/Clientnotification");
const { ID, Query } = require("node-appwrite");
const { addNileMilesOnPurchase } = require("./rewardController");
// Import the stock helper functions
const {
  checkStockAvailability,
  reduceProductStock,
} = require("./stockController");

const FRONTEND_URL = env.FRONTEND_URL || "http://localhost:5174";

const cashonDeliverys = async (req, res) => {
  try {
    const { cart, userId, customerEmail, username, totalAmount, currency } =
      req.body;

    // Validate incoming data
    if (!cart || !userId || !customerEmail || !totalAmount || !currency) {
      return res
        .status(400)
        .json({ message: "Missing required order details." });
    }

    // Prepare the document to be saved in Appwrite
    const orderDocument = {
      users: userId,
      customerEmail,
      username,
      items: JSON.stringify(cart), // Appwrite JSON attribute requires a string
      amount: Math.round(totalAmount), // Convert to a rounded integer
      currency,
      paymentMethod: "Cash on Delivery",
      status: "Pending",
      orderStatus: "Ordered",
      paymentStatus: "succeeded",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save the order document to the Appwrite database
    const result = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      ID.unique(), // Appwrite` generates a unique ID for us
      orderDocument
    );

    // The document ID from Appwrite will serve as our unique orderId
    const orderId = result.$id;

    await addNileMilesOnPurchase(userId, totalAmount);

    // Return the generated orderId and a success message
    res.status(201).json({
      success: true,
      message: "Cash on Delivery order created successfully.",
      orderId: orderId,
      createdAt: orderDocument.createdAt,
    });
  } catch (error) {
    console.error("Error creating COD order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order.",
      error: error.message,
    });
  }
};

const stripewebpayments = async (req, res) => {
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

    const orderId = `ORD-${Date.now()}`;

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

    // 2. Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      metadata: {
        users: userId,
        username,
        orderId,
      },
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancelled?orderId=${orderId}`,
    });

    // 3. ✅ SYNC: Create order FIRST before responding to frontend
    try {
      await functions.createExecution(
        env.ORDER_FUNCTION_WEB_ID,
        JSON.stringify({
          orderId,
          products: cart,
          customerEmail,
          username,
          users: userId,
          paymentStatus: "initiated",
          sessionId: session.id,
          stockChecked: true,
          stockCheckedAt: new Date().toISOString(),
        }),
        true // ← CHANGE TO SYNCHRONOUS
      );
    } catch (orderError) {
      console.error("Order creation failed:", orderError);
      return res.status(500).json({ message: "Order creation failed" });
    }

    // 4. Now respond to frontend
    res.json({
      sessionId: session.id,
      orderId,
      orderStatus: "Ordered",
    });

    // In your payment controller, update the async IIFE:
    (async () => {
      try {
        const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);

        // ✅ Call createNotification WITHOUT the res parameter
        const notificationResult = await createNotification({
          message: `🛍️ New order #${orderId} placed by ${customerEmail} totaling $${totalAmount.toFixed(2)}.`,
          type: "order",
          username: username || customerEmail,
          userId,
          email: customerEmail,
        });

        console.log(`✅ Notification created:`, notificationResult);

        // Send email confirmation
        await Emailconfirmation({
          cart,
          customerEmail,
          customerName: username || customerEmail,
          orderId,
          orderTotal: totalAmount,
        });

        console.log(`✅ Email sent to ${customerEmail}`);

        // Add Nile Miles - make sure this function is similarly fixed
        await addNileMilesOnPurchase(userId, totalAmount);

        console.log(`✅ Nile Miles added for user ${userId}`);
      } catch (err) {
        console.error("❌ Async operations error:", err.message);
      }
    })();
  } catch (error) {
    console.error("Checkout Error:", error);
    return res
      .status(500)
      .json({ message: "Checkout failed. Please try again." });
  }
};

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

    // 6. ADD NILE MILES AND OTHER OPERATIONS
    try {
      await addNileMilesOnPurchase(userId, totalAmount);
      console.log("✅ Nile Miles added");
    } catch (milesError) {
      console.warn("Nile Miles error (non-critical):", milesError.message);
    }

    // 7. RETURN SUCCESS RESPONSE
    res.status(201).json({
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
    });

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
        // await addNileMilesOnPurchase(userId, totalAmount);
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

const stripemobilepayments = async (req, res) => {
  try {
    const { cart, userId, customerEmail, username } = req.body;

    if (!cart || !cart.length || !userId || !customerEmail) {
      return res.status(400).json({ message: "Missing cart or user details" });
    }

    const createdAt = new Date().toISOString();
    const Products = cart.map((item) => ({
      product_name: item.productName || item.name,
      currency: "usd",
      price: Math.round(Number(item.price) * 100),
      quantity: item.quantity,
    }));

    const amount = Products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!amount || isNaN(amount)) {
      return res
        .status(400)
        .json({ message: "Invalid amount calculated from cart." });
    }

    const currency = req.body.currency || "usd";

    const orderId = `ORD-${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { customerEmail, users: userId, orderId },
    });

    await functions.createExecution(
      env.ORDER_FUNCTION_ID,
      JSON.stringify({
        orderId,
        products: cart,
        customerEmail,
        username,
        users: userId,
        paymentStatus: "initiated",
        timestamp: createdAt,
      })
    );

    return res.json({
      client_secret: paymentIntent.client_secret,
      orderId,
      orderStatus: "Ordered",
      createdAt,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res
      .status(500)
      .json({ message: "Checkout failed", error: error.message });
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

const Emailconfirmation = async (req, res) => {
  const { customerEmail, customerName, orderId, orderTotal, cart } = req.body;

  try {
    await sendOrderConfirmationEmail({
      customerEmail,
      customerName,
      orderId,
      orderTotal,
      cart,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
};

/* New ones */
const stripemobilepayment = async (req, res) => {
  try {
    const { cart, userId, customerEmail, username } = req.body;

    if (!cart || !cart.length || !userId || !customerEmail) {
      return res.status(400).json({ message: "Missing cart or user details" });
    }

    // 1. CHECK STOCK AVAILABILITY
    const stockCheck = await checkStockAvailability(cart);

    if (!stockCheck.isAvailable) {
      return res.status(400).json({
        message: "Some items are out of stock or insufficient quantity",
        unavailableItems: stockCheck.unavailableItems,
      });
    }

    const createdAt = new Date().toISOString();
    const Products = cart.map((item) => ({
      product_name: item.productName || item.name,
      currency: "usd",
      price: Math.round(Number(item.price) * 100),
      quantity: item.quantity,
    }));

    const amount = Products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!amount || isNaN(amount)) {
      return res
        .status(400)
        .json({ message: "Invalid amount calculated from cart." });
    }

    const currency = req.body.currency || "usd";

    const orderId = `ORD-${Date.now()}`;

    // 2. CREATE ORDER WITH STOCK CHECK INFO
    const orderData = {
      orderId,
      products: cart,
      customerEmail,
      username,
      users: userId,
      paymentStatus: "initiated",
      timestamp: createdAt,
      stockChecked: true,
      stockCheckedAt: new Date().toISOString(),
    };

    await functions.createExecution(
      env.ORDER_FUNCTION_ID,
      JSON.stringify(orderData)
    );

    // 3. CREATE PAYMENT INTENT WITH STOCK RESERVATION INFO
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        customerEmail,
        users: userId,
        orderId,
        stockReserved: "true", // Indicate stock was checked
        productsCount: cart.length,
      },
      description: `Order ${orderId} - ${cart.length} items`,
    });

    return res.json({
      client_secret: paymentIntent.client_secret,
      orderId,
      orderStatus: "Ordered",
      createdAt,
      stockChecked: true,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res
      .status(500)
      .json({ message: "Checkout failed", error: error.message });
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
};
