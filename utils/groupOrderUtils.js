// lib/groupOrderUtils.js

const { db } = require("../services/appwriteService");
const { env } = require("../src/env");

/**
 * computeCurrentPrice
 * Accepts { basePrice, strategy, tiers, participantsCount }
 * Returns newPrice (number)
 */
function computeCurrentPrice({
  basePrice,
  strategy = "tiered",
  tiers = null,
  participantsCount = 1,
}) {
  if (strategy === "linear") {
    // Example linear: 5% per participant beyond 1, capped at 30%
    const perUser = 0.05;
    const cap = 0.3;
    const discount = Math.min((participantsCount - 1) * perUser, cap);
    return parseFloat((basePrice * (1 - discount)).toFixed(2));
  } else {
    // Tiered strategy: find the highest tier where min <= participantsCount
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      // fallback to no discount
      return parseFloat(basePrice.toFixed(2));
    }
    // sort tiers by min ascending
    const sorted = [...tiers].sort((a, b) => a.min - b.min);
    let chosen = sorted[0];
    for (const t of sorted) {
      if (participantsCount >= t.min) chosen = t;
    }
    const discount = chosen.discount || 0;
    return parseFloat((basePrice * (1 - discount)).toFixed(2));
  }
}

/**
 * Optimistic lock + retry for Appwrite update: read -> transform -> try update.
 * If update fails due to concurrent modification, retry up to N times.
 *
 * transformFn(order) => returns partialUpdate (object) OR throws an error {code,msg}
 */
async function retryUpdateDocumentWithOptimisticLock(
  docId,
  transformFn,
  maxAttempts = 5,
  backoffMs = 80
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // fetch latest doc
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
      docId
    );
    if (!order) throw { code: 404, msg: "Order not found" };

    // ask transform what to update
    const updatePatch = await transformFn(order);
    // build update object
    try {
      // Use Appwrite updateDocument - Appwrite does not provide direct compare-and-swap in SDK,
      // but we can attempt the update; if a race causes logical problem (we validated earlier), retry.
      const updated = await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_GROUP_ORDER_COLLECTION_ID,
        docId,
        updatePatch
      );
      return updated;
    } catch (err) {
      // Heuristic: if error indicates concurrency or conflict, retry. For Appwrite, implement retry on any failure up to max.
      if (attempt < maxAttempts - 1) {
        await sleep(backoffMs * (attempt + 1));
        continue;
      } else {
        throw err;
      }
    }
  }
  throw { code: 500, msg: "Failed to update after retries" };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  computeCurrentPrice,
  computePriceByTiers: computeCurrentPrice,
  retryUpdateDocumentWithOptimisticLock,
};
