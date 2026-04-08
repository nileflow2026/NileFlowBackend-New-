const AddressService = require("../../services/AddressService");

// addressesController.js
exports.getAddresses = async (req, res) => {
  try {
    // The middleware ensures req.user is already available
    const userId = req.user.userId;
    console.log("Extracted User ID:", userId);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    const addresses = await AddressService.getAddresses(userId);
    return res.status(200).json(addresses);
  } catch (error) {
    console.error("Controller Error (getAddresses):", error);
    return res.status(500).json({ error: "Failed to fetch addresses." });
  }
};
// Controller to get all addresses for a user
exports.getAddressesMobile = async (req, res) => {
  try {
    // userId is typically extracted from the authenticated user's session or token
    // For this example, we'll assume it's available in the request object (req.user.id)
    // You can also pass it as a URL parameter: const { userId } = req.params;
    const userId = req.user.$id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }

    const addresses = await AddressService.getAddresses(userId);
    return res.status(200).json(addresses);
  } catch (error) {
    console.error("Controller Error (getAddresses):", error);
    return res.status(500).json({ error: "Failed to fetch addresses." });
  }
};

// Controller to add a new address
exports.addAddress = async (req, res) => {
  try {
    const { userId, ...newAddressData } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }

    if (!newAddressData || !newAddressData.phone || !newAddressData.address) {
      return res
        .status(400)
        .json({ error: "Missing required address fields." });
    }

    const addedAddress = await AddressService.addAddress(
      userId,
      newAddressData
    );

    if (addedAddress) {
      return res.status(201).json(addedAddress);
    } else {
      return res.status(500).json({ error: "Failed to add address." });
    }
  } catch (error) {
    console.error("Controller Error (addAddress):", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Controller to update an existing address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.params; // Get addressId from URL parameters
    const updatedData = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    if (!addressId) {
      return res.status(400).json({ error: "Address ID is missing." });
    }

    const updatedAddress = await AddressService.updateAddress(
      addressId,
      updatedData
    );

    if (updatedAddress) {
      return res.status(200).json(updatedAddress);
    } else {
      return res
        .status(404)
        .json({ error: "Address not found or failed to update." });
    }
  } catch (error) {
    console.error("Controller Error (updateAddress):", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Controller to delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    if (!addressId) {
      return res.status(400).json({ error: "Address ID is missing." });
    }

    const isDeleted = await AddressService.deleteAddress(addressId);

    if (isDeleted) {
      return res.status(204).send(); // 204 No Content for successful deletion
    } else {
      return res
        .status(404)
        .json({ error: "Address not found or failed to delete." });
    }
  } catch (error) {
    console.error("Controller Error (deleteAddress):", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Admin controller to get customer addresses by type
exports.getCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { type = "delivery" } = req.query;

    // Validate admin access (optional - depends on your auth setup)
    if (req.user && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    console.log(`Fetching ${type} addresses for customer:`, customerId);

    // Get customer addresses filtered by type
    const addresses = await AddressService.getCustomerAddressByType(
      customerId,
      type
    );

    return res.status(200).json({
      success: true,
      addresses: addresses,
      customerId: customerId,
      type: type,
    });
  } catch (error) {
    console.error("Controller Error (getCustomerAddress):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch customer addresses",
      message: error.message,
    });
  }
};
