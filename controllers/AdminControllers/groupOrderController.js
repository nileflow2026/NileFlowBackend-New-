const { ID } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const {
  retryUpdateDocumentWithOptimisticLock,
  computeCurrentPrice,
  computePriceByTiers,
} = require("../../utils/groupOrderUtils");

// The controller function that will be attached to an Express route
const createGroupOrders = async function (req, res) {
  try {
    // Extract data from the request body
    const { productId, creatorId, maxParticipants, initialPrice } = req.body;

    // Validate that all required fields are present
    if (!productId || !creatorId || !maxParticipants || !initialPrice) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const order = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      ID.unique(),
      {
        productId,
        creatorId,
        participants: [creatorId],
        maxParticipants,
        currentPrice: initialPrice,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiry
      }
    );

    // Send a success response with the created order
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating group order:", error);
    // Send an error response
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Create Group Order
 * Body: { productId, creatorId, maxParticipants, basePrice, priceStrategy, tiers(optional), ttlHours(optional) }
 */
async function createGroupOrder(req, res) {
  try {
    const {
      productId,
      creatorId,
      maxParticipants,
      basePrice,
      priceStrategy = "tiered",
      tiers = null,
      ttlHours = 24,
    } = req.body;
    console.log("req.body:", req.body);

    if (!productId || !creatorId || !maxParticipants || !basePrice) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const expiresAt = new Date(
      Date.now() + ttlHours * 60 * 60 * 1000
    ).toISOString();
    const initialPrice = computeCurrentPrice({
      basePrice,
      strategy: priceStrategy,
      tiers,
      participantsCount: 1,
    });

    const payload = {
      productId,
      creatorId,
      participants: [creatorId],
      maxParticipants,
      basePrice,
      currentPrice: initialPrice,
      priceStrategy,
      tiers,
      status: "pending",
      expiresAt,
    };

    const order = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      ID.unique(),
      payload
    );

    return res.status(201).json(order);
  } catch (err) {
    console.error("createGroupOrder:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Read single group order
 */
async function getGroupOrder(req, res) {
  try {
    const id = req.params.id;
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      id
    );
    if (!order) return res.status(404).json({ error: "Not found" });
    return res.json(order);
  } catch (err) {
    console.error("getGroupOrder:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * List group orders (filter by productId, creatorId etc via query)
 */
async function listGroupOrders(req, res) {
  try {
    const { productId, creatorId, status } = req.query;
    // Build query for Appwrite (simple example; adapt to Appwrite queries)
    const queries = [];
    if (productId) queries.push(`productId=${productId}`);
    if (creatorId) queries.push(`creatorId=${creatorId}`);
    if (status) queries.push(`status=${status}`);
    // Use db.listDocuments with queries depending on your Appwrite SDK
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      queries // adapt shape as Appwrite expects
    );
    return res.json(result);
  } catch (err) {
    console.error("listGroupOrders:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Update (admin or owner)
 * PATCH body: any fields to update (e.g., maxParticipants)
 */
async function updateGroupOrder(req, res) {
  try {
    const id = req.params.id;
    const updates = req.body;
    // Basic validation could go here
    const updated = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      id,
      updates
    );
    return res.json(updated);
  } catch (err) {
    console.error("updateGroupOrder:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Cancel group order (owner or admin)
 */
async function cancelGroupOrder(req, res) {
  try {
    const id = req.params.id;
    // set status to 'cancelled'
    const updated = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      id,
      { status: "cancelled" }
    );
    return res.json(updated);
  } catch (err) {
    console.error("cancelGroupOrder:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Join group order (concurrency-aware)
 * Body: { userId }
 */
async function joinGroupOrder(req, res) {
  try {
    const id = req.params.id;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Use retry loop with optimistic locking to avoid race conditions
    const result = await retryUpdateDocumentWithOptimisticLock(
      id,
      async (order) => {
        if (!order) throw { code: 404, msg: "Order not found" };
        if (order.status !== "pending")
          throw { code: 400, msg: "Order closed" };
        if (order.expiresAt && new Date(order.expiresAt) <= new Date())
          throw { code: 400, msg: "Order expired" };
        if (order.participants && order.participants.includes(userId))
          throw { code: 400, msg: "User already joined" };
        if (order.participants.length >= order.maxParticipants)
          throw { code: 400, msg: "Group full" };

        const newParticipants = [...order.participants, userId];
        const participantsCount = newParticipants.length;

        const newPrice = computeCurrentPrice({
          basePrice: order.basePrice,
          strategy: order.priceStrategy,
          tiers: order.tiers,
          participantsCount,
        });

        const newStatus =
          participantsCount >= order.maxParticipants ? "completed" : "pending";

        return {
          participants: newParticipants,
          currentPrice: newPrice,
          status: newStatus,
        };
      }
    );

    // result is the updated document
    return res.json(result);
  } catch (err) {
    console.error("joinGroupOrder:", err);
    if (err.code) return res.status(err.code).json({ error: err.msg });
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Leave group order
 * Body: { userId }
 */
async function leaveGroupOrder(req, res) {
  try {
    const id = req.params.id;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await retryUpdateDocumentWithOptimisticLock(
      id,
      async (order) => {
        if (!order) throw { code: 404, msg: "Order not found" };
        if (!order.participants.includes(userId))
          throw { code: 400, msg: "User not in group" };
        // remove user
        const newParticipants = order.participants.filter((u) => u !== userId);
        const participantsCount = newParticipants.length;
        // ensure at least creator remains; behavior: if creator leaves -> transfer ownership or cancel
        if (order.creatorId === userId) {
          // simple policy: if creator leaves and others remain, set new creator to first participant
          const newCreator = newParticipants[0] || null;
          // recompute price
          const newPrice = computeCurrentPrice({
            basePrice: order.basePrice,
            strategy: order.priceStrategy,
            tiers: order.tiers,
            participantsCount,
          });
          const newStatus = participantsCount === 0 ? "cancelled" : "pending";
          const update = {
            participants: newParticipants,
            currentPrice: newPrice,
            status: newStatus,
          };
          if (newCreator) update.creatorId = newCreator;
          return update;
        } else {
          const newPrice = computeCurrentPrice({
            basePrice: order.basePrice,
            strategy: order.priceStrategy,
            tiers: order.tiers,
            participantsCount,
          });
          const newStatus = participantsCount === 0 ? "cancelled" : "pending";
          return {
            participants: newParticipants,
            currentPrice: newPrice,
            status: newStatus,
          };
        }
      }
    );

    return res.json(result);
  } catch (err) {
    console.error("leaveGroupOrder:", err);
    if (err.code) return res.status(err.code).json({ error: err.msg });
    return res.status(500).json({ error: "Internal server error." });
  }
}

/**
 * Expire orders (scheduler should POST here)
 * - Find pending orders where expiresAt <= now
 * - Mark them expired and optionally perform follow-up (refunds / notify / convert to solo order)
 */
async function expireGroupOrders(req, res) {
  try {
    const now = new Date().toISOString();
    // List pending orders with expiresAt <= now. Implementation depends on Appwrite SDK query syntax.
    const expiredCandidates = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      [
        /* query: status = pending AND expiresAt <= now */
      ]
    );

    const updated = [];
    for (const order of expiredCandidates.documents || expiredCandidates) {
      try {
        if (order.status !== "pending") continue;
        // Decide business logic: either mark expired, or convert to single purchase for creator, or auto-cancel
        const update = { status: "expired" };
        const updatedDoc = await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
          order.$id,
          update
        );
        // TODO: enqueue refunds or convert-to-solo purchase workflow
        updated.push(updatedDoc);
      } catch (e) {
        console.error("expire update failed for", order.$id, e);
      }
    }

    return res.json({ expiredCount: updated.length, updated });
  } catch (err) {
    console.error("expireGroupOrders:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = {
  createGroupOrder,
  getGroupOrder,
  listGroupOrders,
  updateGroupOrder,
  cancelGroupOrder,
  joinGroupOrder,
  leaveGroupOrder,
  expireGroupOrders,
};
