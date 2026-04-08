import { databases, Config } from "../../appwrite";

/**
 * Validates if a user ID exists in the database
 * @param {string} userId - The user ID to validate
 * @returns {Promise<{exists: boolean, error?: string}>}
 */
export const validateUserId = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return { exists: false, error: "Invalid user ID format" };
    }

    // Check if user ID has the correct format (Appwrite IDs are typically 20+ characters)
    if (userId.length < 20) {
      return { exists: false, error: "User ID appears to be too short" };
    }

    // Try to fetch the user document
    const userDoc = await databases.getDocument(
      Config.databaseId,
      Config.userCollectionId,
      userId
    );

    return { exists: true, user: userDoc };
  } catch (error) {
    console.error("User validation error:", error);

    if (error.code === 404) {
      return { exists: false, error: "User not found in database" };
    } else if (error.code === 401) {
      return {
        exists: false,
        error: "Access denied - insufficient permissions",
      };
    } else if (error.code === 400) {
      return { exists: false, error: "Invalid user ID format" };
    }

    return { exists: false, error: `Database error: ${error.message}` };
  }
};

/**
 * Lists all users to help debug user ID issues
 * @returns {Promise<Array>}
 */
export const debugListUsers = async () => {
  try {
    const result = await databases.listDocuments(
      Config.databaseId,
      Config.userCollectionId,
      [],
      50 // Limit to first 50 users
    );

    console.log(
      "Available users:",
      result.documents.map((user) => ({
        id: user.$id,
        username: user.username,
        email: user.email,
        created: user.$createdAt,
      }))
    );

    return result.documents;
  } catch (error) {
    console.error("Error listing users for debug:", error);
    return [];
  }
};

/**
 * Checks database and collection configuration
 * @returns {Promise<Object>}
 */
export const debugAppwriteConfig = async () => {
  const config = {
    databaseId: Config.databaseId,
    userCollectionId: Config.userCollectionId,
    orderCollectionId: Config.orderCollectionId,
    addressCollectionId: Config.addressCollection,
    orderCollection: Config.orderCollection, // Note: you have both orderCollection and orderCollectionId
  };

  console.log("Current Appwrite Config:", config);

  try {
    // Try to list documents from each collection to verify they exist
    const userTest = await databases.listDocuments(
      Config.databaseId,
      Config.userCollectionId,
      [],
      1
    );
    const orderTest = await databases.listDocuments(
      Config.databaseId,
      Config.orderCollectionId,
      [],
      1
    );
    const addressTest = await databases.listDocuments(
      Config.databaseId,
      Config.addressCollection,
      [],
      1
    );

    console.log("Collection accessibility test:");
    console.log("- Users collection: ✓ Accessible");
    console.log("- Orders collection: ✓ Accessible");
    console.log("- Address collection: ✓ Accessible");

    return {
      success: true,
      collections: {
        users: userTest.total,
        orders: orderTest.total,
        addresses: addressTest.total,
      },
    };
  } catch (error) {
    console.error("Configuration test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
