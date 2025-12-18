const { reduceProductStock } = require("./stockController");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;

    case "checkout.session.completed":
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const { orderId, users: userId, customerEmail } = paymentIntent.metadata;

    if (!orderId) {
      console.error("No orderId in payment intent metadata");
      return;
    }

    // Get order from database
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.equal("orderId", orderId)]
    );

    if (orders.documents.length === 0) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    const order = orders.documents[0];
    const cart = JSON.parse(order.items || "[]");

    // Reduce stock
    const stockUpdateResult = await reduceProductStock(cart, orderId);

    // Update order status
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      order.$id,
      {
        paymentStatus: "succeeded",
        orderStatus: "Confirmed",
        stockUpdated: stockUpdateResult.success,
        stockUpdateDetails: JSON.stringify(stockUpdateResult.updatedProducts),
        paymentIntentId: paymentIntent.id,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`✅ Stock updated for Stripe order ${orderId}`);
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
};

module.exports = { handleStripeWebhook };
