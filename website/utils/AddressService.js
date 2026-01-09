import axiosClient from "../api";

const AddressService = {
  getAddresses: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosClient.get("/api/nileflow/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Correctly access the documents array from the response data
      /*  console.log("Fetched addresses:", response.data); */

      return response.data; // <-- CHANGE THIS LINE
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return [];
    }
  },

  // Add a new address
  addAddress: async (userId, newAddressData) => {
    try {
      const response = await axiosClient.post("/api/nileflow/add/address", {
        userId,
        ...newAddressData,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding address:", error);
      return null;
    }
  },

  // Update an existing address
  updateAddress: async (addressId, updatedData) => {
    try {
      const response = await axiosClient.put(
        `api/nileflow/addresses/:addressId${addressId}`,
        updatedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating address:", error);
      return null;
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    try {
      await axiosClient.delete(`api/nileflow/addresses/${addressId}`);
      return true;
    } catch (error) {
      console.error("Error deleting address:", error);
      return false;
    }
  },
};
export default AddressService;
