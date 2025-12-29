// Frontend utility function to integrate with your PickupAddressModal
// Add this to your frontend utilities or wherever you handle API calls

export const pickupAddressAPI = {
  /**
   * Save customer pickup address
   * @param {Object} addressData - The address data from the form
   * @param {string} addressData.address - Street address
   * @param {string} addressData.phone - Phone number
   * @param {string} addressData.city - City
   * @param {string} addressData.state - State/Province
   * @param {string} addressData.postalCode - Postal code (optional)
   * @returns {Promise<Object>} API response
   */
  async savePickupAddress(addressData) {
    try {
      const response = await fetch("/api/customerauth/pickup-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pickup address");
      }

      return data;
    } catch (error) {
      console.error("Error saving pickup address:", error);
      throw error;
    }
  },

  /**
   * Get customer's current pickup address
   * @returns {Promise<Object>} API response with address data
   */
  async getPickupAddress() {
    try {
      const response = await fetch("/api/customerauth/pickup-address", {
        method: "GET",
        credentials: "include", // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // No pickup address found - this is expected for new users
          return null;
        }
        throw new Error(data.error || "Failed to get pickup address");
      }

      return data;
    } catch (error) {
      console.error("Error getting pickup address:", error);
      throw error;
    }
  },

  /**
   * Check if customer has a pickup address
   * @returns {Promise<boolean>} True if customer has a pickup address
   */
  async hasPickupAddress() {
    try {
      const result = await this.getPickupAddress();
      return result && result.success;
    } catch (error) {
      return false;
    }
  },
};

// Updated PickupAddressModal handleSubmit function
// Replace your existing handleSubmit with this:
/*
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    // Use the API utility function
    const result = await pickupAddressAPI.savePickupAddress(formData);
    
    if (result.success) {
      // Show success message
      setShowSuccessMessage(true);

      // Call parent's onSubmit if provided
      if (onSubmit) {
        await onSubmit(formData);
      }

      // Close modal after short delay
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);
    }
  } catch (error) {
    console.error("Error saving pickup address:", error);
    showErrorToast(error.message || "Failed to save pickup address");
  } finally {
    setIsSubmitting(false);
  }
};
*/

export default pickupAddressAPI;
