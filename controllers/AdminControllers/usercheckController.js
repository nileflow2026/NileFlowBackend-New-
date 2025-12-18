const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const usercheck = async (req, res) => {
  try {
    const { email } = req.body;
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID, // Replace with your users database ID
      env.APPWRITE_USER_COLLECTION_ID, // Replace with your users collection ID
      [Query.equal("email", email)]
    );

    if (documents.length > 0) {
      const user = documents[0];
      return res.status(200).json({ userExists: true, name: user.username });
    } else {
      return res.status(200).json({ userExists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to check user existence." });
  }
};

module.exports = { usercheck };
