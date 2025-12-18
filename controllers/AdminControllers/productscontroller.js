const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const getProducts = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      id
    );

    res.json(product);
  } catch (err) {
    // A 404 is now handled by the Appwrite SDK itself.
    // getDocument throws an error if the document is not found.
    // The Appwrite error object will contain a code and message.
    if (err.code === 404) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getProducts };
