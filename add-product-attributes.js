/**
 * add-product-attributes.js
 *
 * Adds all new product form fields to the Appwrite collections.
 *
 * Collections updated:
 *  1. Vendor Products    → VENDOR_DATABASE_ID  / VENDOR_PRODUCTS_COLLECTION_ID
 *  2. Main Products      → APPWRITE_DATABASE_ID / APPWRITE_PRODUCT_COLLECTION_ID
 *
 * Run from /Backend:
 *   node add-product-attributes.js
 */

require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

// ─── Config ───────────────────────────────────────────────────────────────────
const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const VENDOR_DB_ID = process.env.VENDOR_DATABASE_ID;
const VENDOR_PRODUCTS_COL = process.env.VENDOR_PRODUCTS_COLLECTION_ID;

const MAIN_DB_ID = process.env.APPWRITE_DATABASE_ID;
const MAIN_PRODUCTS_COL = process.env.APPWRITE_PRODUCT_COLLECTION_ID;

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Small delay so Appwrite can finish indexing each attribute. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Safely create a string attribute.
 * Skips gracefully if the attribute already exists (409 conflict).
 */
async function addString(
  dbId,
  colId,
  key,
  size = 255,
  required = false,
  defaultValue = null,
) {
  try {
    await databases.createStringAttribute(
      dbId,
      colId,
      key,
      size,
      required,
      defaultValue ?? undefined,
    );
    console.log(`  ✅  [string]  ${key}`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  ⏭️   [string]  ${key}  (already exists – skipped)`);
    } else {
      console.error(`  ❌  [string]  ${key}  →  ${err.message}`);
    }
  }
  await sleep(600);
}

async function addFloat(
  dbId,
  colId,
  key,
  required = false,
  defaultValue = null,
) {
  try {
    await databases.createFloatAttribute(
      dbId,
      colId,
      key,
      required,
      undefined,
      undefined,
      defaultValue ?? undefined,
    );
    console.log(`  ✅  [float]   ${key}`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  ⏭️   [float]   ${key}  (already exists – skipped)`);
    } else {
      console.error(`  ❌  [float]   ${key}  →  ${err.message}`);
    }
  }
  await sleep(600);
}

async function addInteger(
  dbId,
  colId,
  key,
  required = false,
  defaultValue = null,
) {
  try {
    await databases.createIntegerAttribute(
      dbId,
      colId,
      key,
      required,
      undefined,
      undefined,
      defaultValue ?? undefined,
    );
    console.log(`  ✅  [int]     ${key}`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  ⏭️   [int]     ${key}  (already exists – skipped)`);
    } else {
      console.error(`  ❌  [int]     ${key}  →  ${err.message}`);
    }
  }
  await sleep(600);
}

async function addBoolean(
  dbId,
  colId,
  key,
  required = false,
  defaultValue = null,
) {
  try {
    await databases.createBooleanAttribute(
      dbId,
      colId,
      key,
      required,
      defaultValue ?? undefined,
    );
    console.log(`  ✅  [bool]    ${key}`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  ⏭️   [bool]    ${key}  (already exists – skipped)`);
    } else {
      console.error(`  ❌  [bool]    ${key}  →  ${err.message}`);
    }
  }
  await sleep(600);
}

// ─── Attribute definitions ────────────────────────────────────────────────────

/**
 * All new attributes for the VENDOR products collection.
 * Each entry: [type, key, ...extra args for the helper]
 */
const VENDOR_ATTRIBUTES = [
  // Basic Info
  ["string", "shortDescription", 500],
  ["string", "brand", 255],
  ["string", "barcode", 100],
  ["string", "type", 50, false, "physical"],
  ["string", "condition", 50, false, "new"],
  ["string", "subcategoryId", 100],

  // Pricing
  ["float", "compareAtPrice"],
  ["float", "costPerItem"],
  ["string", "currency", 10, false, "KES"],
  ["boolean", "taxable", false, true],

  // Inventory
  ["integer", "lowStockThreshold", false, 5],
  ["boolean", "trackInventory", false, true],
  ["boolean", "allowBackorders", false, false],

  // Shipping
  ["float", "weight"],
  ["string", "weightUnit", 10, false, "kg"],
  ["float", "length"],
  ["float", "width"],
  ["float", "height"],
  ["string", "dimensionUnit", 10, false, "cm"],
  ["boolean", "freeShipping", false, false],
  ["string", "shippingClass", 50, false, "standard"],
  ["string", "deliveryEstimate", 100],

  // SEO
  ["string", "seoTitle", 100],
  ["string", "seoDescription", 200],
];

/**
 * New attributes for the MAIN website products collection.
 * (Only fields the main collection schema doesn't already have)
 */
const MAIN_ATTRIBUTES = [
  // Basic Info
  ["string", "shortDescription", 500],
  ["string", "barcode", 100],
  ["string", "condition", 50, false, "new"],

  // Pricing
  ["float", "compareAtPrice"],
  ["float", "costPerItem"],
  ["boolean", "taxable", false, true],

  // Inventory
  ["integer", "lowStockThreshold", false, 5],
  ["boolean", "trackInventory", false, true],
  ["boolean", "allowBackorders", false, false],

  // Shipping (main already has weight:0, but add the extra fields)
  ["string", "weightUnit", 10, false, "kg"],
  ["float", "length"],
  ["float", "width"],
  ["float", "height"],
  ["string", "dimensionUnit", 10, false, "cm"],
  ["boolean", "freeShipping", false, false],
  ["string", "shippingClass", 50, false, "standard"],
  ["string", "deliveryEstimate", 100],

  // SEO
  ["string", "seoTitle", 100],
  ["string", "seoDescription", 200],
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function applyAttributes(label, dbId, colId, attrs) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Adding attributes to: ${label}`);
  console.log(`  DB: ${dbId}   |   Col: ${colId}`);
  console.log(`${"═".repeat(60)}`);

  for (const [type, key, ...rest] of attrs) {
    switch (type) {
      case "string":
        await addString(dbId, colId, key, ...rest);
        break;
      case "float":
        await addFloat(dbId, colId, key, ...rest);
        break;
      case "integer":
        await addInteger(dbId, colId, key, ...rest);
        break;
      case "boolean":
        await addBoolean(dbId, colId, key, ...rest);
        break;
      default:
        console.warn(`  ⚠️  Unknown type "${type}" for key "${key}" – skipped`);
    }
  }

  console.log(`\n  ✔  Done with: ${label}\n`);
}

async function main() {
  console.log("\n🚀  NileFlow — Product Attribute Migration");
  console.log(`    Endpoint : ${ENDPOINT}`);
  console.log(`    Project  : ${PROJECT_ID}\n`);

  if (!VENDOR_DB_ID || !VENDOR_PRODUCTS_COL) {
    console.error(
      "❌  Missing VENDOR_DATABASE_ID or VENDOR_PRODUCTS_COLLECTION_ID in .env",
    );
    process.exit(1);
  }
  if (!MAIN_DB_ID || !MAIN_PRODUCTS_COL) {
    console.error(
      "❌  Missing APPWRITE_DATABASE_ID or APPWRITE_PRODUCT_COLLECTION_ID in .env",
    );
    process.exit(1);
  }

  await applyAttributes(
    "Vendor Products Collection",
    VENDOR_DB_ID,
    VENDOR_PRODUCTS_COL,
    VENDOR_ATTRIBUTES,
  );

  await applyAttributes(
    "Main Products Collection",
    MAIN_DB_ID,
    MAIN_PRODUCTS_COL,
    MAIN_ATTRIBUTES,
  );

  console.log("🎉  Migration complete!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
