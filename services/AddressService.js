const { ID, Query, Permission, Role } = require("node-appwrite");
const { avatars, users, db, account } = require("../src/appwrite");
const { env } = require("../src/env");
const AddressService = {
  // Get all addresses for a specific user
  getAddresses: async (userId) => {
    if (!userId) {
      console.error("Error fetching addresses: User ID is missing.");
      return [];
    }

    try {
      const response = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADDRESS_COLLECTION_ID,
        [Query.equal("user", userId)]
      );
      // console.log("Fetched addresses for user:", userId, response.documents);
      return response.documents;
    } catch (error) {
      console.error("Error fetching addresses:", error);
      throw new Error("Failed to fetch addresses.");
    }
  },

  // Get customer addresses filtered by type (admin function)
  getCustomerAddressByType: async (customerId, addressType = "delivery") => {
    if (!customerId) {
      console.error(
        "Error fetching customer addresses: Customer ID is missing."
      );
      return [];
    }

    try {
      // Get all addresses for the customer
      const allAddressesResponse = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADDRESS_COLLECTION_ID,
        [Query.equal("user", customerId)]
      );

      let filteredAddresses = allAddressesResponse.documents;

      // Filter by type if addresses have type field
      if (addressType && allAddressesResponse.documents.length > 0) {
        // Check if any address has a type field
        const hasTypeField = allAddressesResponse.documents.some(
          (addr) => addr.type !== undefined
        );

        if (hasTypeField) {
          // Handle semantic mapping: frontend requests "delivery" but customer addresses are stored as "pickup"
          let actualTypeToSearch = addressType;
          if (addressType === "delivery") {
            actualTypeToSearch = "pickup"; // Map delivery requests to pickup type in database
          }

          filteredAddresses = allAddressesResponse.documents.filter(
            (addr) => addr.type === actualTypeToSearch
          );
        }
      }

      console.log(
        `Fetched ${addressType} addresses for customer ${customerId}: ${filteredAddresses.length} found`
      );

      return filteredAddresses;
    } catch (error) {
      console.error("Error fetching customer addresses:", error);
      throw new Error("Failed to fetch customer addresses.");
    }
  },

  // Add a new address
  addAddress: async (userId, newAddress) => {
    try {
      const payload = {
        user: userId,
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        address: newAddress.address,
        city: newAddress.city,
        state: newAddress.state,
        zipCode: newAddress.zipCode,
        country: newAddress.country,
      };

      const permissions = [
        Permission.read(Role.any()), // Allow public read access (optional, adjust as needed)
        Permission.write(Role.user(userId)), // Allow the specific user to write
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ];

      const response = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADDRESS_COLLECTION_ID,
        ID.unique(),
        payload,
        permissions
      );

      return response;
    } catch (error) {
      console.error("Error adding address:", error);
      throw new Error("Failed to add address.");
    }
  },

  // Update an existing address
  updateAddress: async (addressId, updatedData) => {
    try {
      const response = await databases.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADDRESS_COLLECTION_ID,
        addressId,
        updatedData
      );
      return response;
    } catch (error) {
      console.error("Error updating address:", error);
      throw new Error("Failed to update address.");
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    try {
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADDRESS_COLLECTION_ID,
        addressId
      );
      return true;
    } catch (error) {
      console.error("Error deleting address:", error);
      throw new Error("Failed to delete address.");
    }
  },
};

module.exports = AddressService;
