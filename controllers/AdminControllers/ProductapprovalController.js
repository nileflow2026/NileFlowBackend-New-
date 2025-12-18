const { db } = require("../../services/appwriteService");
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");
const {
  CreateProductApprovalNotification,
} = require("./notificationController");

// adminProductController.js
const approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const adminId = req.user.userId;

    // 1. Get the pending product
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Product already approved",
      });
    }

    // 2. Get vendor details to get email
    let vendorEmail = null;
    let vendorName = "Vendor";

    try {
      if (product.vendorId) {
        const vendor = await db.getDocument(
          env.VENDOR_DATABASE_ID,
          env.VENDOR_COLLECTION_ID,
          product.vendorId
        );

        vendorEmail = vendor.email;
        vendorName = vendor.name || vendor.storeName || "Vendor";

        console.log("Vendor details fetched:", {
          email: vendorEmail,
          name: vendorName,
          id: vendor.$id,
        });
      }
    } catch (vendorError) {
      console.warn("Could not fetch vendor details:", vendorError.message);
      // Continue without vendor email
    }

    // 2. Update product status
    const updatedProduct = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        isActive: true,
        isApproved: true,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        updatedAt: new Date().toISOString(),
      }
    );

    // 4. Notify the vendor (only if we have email)
    if (vendorEmail) {
      try {
        await CreateProductApprovalNotification({
          message: `Your product "${product.productName}" has been approved and is now live on the website!`,
          type: "product_approved",
          username: vendorName,
          email: vendorEmail, // Use the fetched email
          userId: product.vendorId,
          metadata: JSON.stringify({
            productId,
            productName: product.productName,
            approvedAt: new Date().toISOString(),
            viewUrl: `/products/${product.slug || productId}`,
          }),
        });
        console.log("Notification sent to vendor");
      } catch (notificationError) {
        console.error(
          "Notification failed (continuing):",
          notificationError.message
        );
        // Don't fail the whole request if notification fails
      }
    } else {
      console.warn("No vendor email found, skipping notification");
    }

    // 4. Optional: Update vendor's product record
    try {
      await db.updateDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_PRODUCTS_COLLECTION_ID,
        productId,
        {
          isLive: true,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (vendorUpdateError) {
      console.warn("Could not update vendor product:", vendorUpdateError);
    }

    res.json({
      success: true,
      message: "Product approved successfully",
      data: { product: updatedProduct },
    });
  } catch (error) {
    console.error("Approve product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve product",
    });
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body; // Reason for rejection
    const adminId = req.user.userId;

    // 1. Get the pending product
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
    );

    // 2. Update product status
    const updatedProduct = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
      {
        isActive: false,
        isApproved: false,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId,
        rejectionReason: reason || "Does not meet our guidelines",
        updatedAt: new Date().toISOString(),
      }
    );

    // 3. Notify the vendor
    await CreateProductApprovalNotification({
      message: `Your product "${product.productName}" was not approved. Reason: ${reason || "Does not meet our guidelines"}`,
      type: "product_rejected",
      username: product.vendor?.name || "Vendor",
      email: product.vendor?.email,
      userId: product.vendorId,
      metadata: {
        productId,
        productName: product.productName,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        resubmitUrl: `/vendor/products/edit/${productId}`,
      },
    });

    res.json({
      success: true,
      message: "Product rejected",
      data: { product: updatedProduct },
    });
  } catch (error) {
    console.error("Reject product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject product",
    });
  }
};

const getPendingProducts = async (req, res) => {
  try {
    const pendingProducts = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("status", "pending"),
        Query.orderDesc("submittedAt"),
        Query.limit(50),
      ]
    );

    res.json({
      success: true,
      data: {
        products: pendingProducts.documents,
        total: pendingProducts.total,
      },
    });
  } catch (error) {
    console.error("Get pending products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending products",
    });
  }
};

module.exports = {
  approveProduct,
  rejectProduct,
  getPendingProducts,
};
