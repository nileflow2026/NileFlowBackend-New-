const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
// Get all customers (for admin/vendor dashboard)
const getAllCustomers = async (req, res) => {
  try {
    // Get all orders to extract customer data
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.limit(1000)]
    );

    // Group orders by user to get customer statistics
    const customerMap = new Map();
    const customerDetails = new Map(); // Store additional customer details

    // First, get all unique users from orders
    orders.documents.forEach((order) => {
      const userId = order.users;

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId: userId,
          orders: 0,
          totalSpent: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
        });
      }

      const customer = customerMap.get(userId);
      customer.orders += 1;

      // Parse amount from order (handle both string and number)
      let orderAmount = 0;
      if (typeof order.amount === "number") {
        orderAmount = order.amount;
      } else if (typeof order.amount === "string") {
        orderAmount = parseFloat(order.amount) || 0;
      }

      customer.totalSpent += orderAmount;

      // Update dates
      if (new Date(order.createdAt) < new Date(customer.firstOrderDate)) {
        customer.firstOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
      }

      // Store customer details from order
      if (!customerDetails.has(userId)) {
        customerDetails.set(userId, {
          name: order.username || "Customer",
          email: order.customerEmail || "",
          phone: "", // Not available in orders, would need user collection
          joinDate: order.createdAt,
        });
      }
    });

    // Convert to array and format
    const customers = Array.from(customerMap.entries()).map(
      ([userId, data]) => {
        const details = customerDetails.get(userId) || {};

        // Calculate status based on activity
        let status = "Active";
        const lastOrderDate = new Date(data.lastOrderDate);
        const daysSinceLastOrder =
          (new Date() - lastOrderDate) / (1000 * 60 * 60 * 24);

        if (daysSinceLastOrder > 90) {
          status = "Inactive";
        } else if (data.totalSpent > 1000 || data.orders > 20) {
          status = "VIP";
        }

        // Calculate loyalty points (1 point per $1 spent + 10 points per order)
        const loyaltyPoints = Math.round(data.totalSpent + data.orders * 10);

        return {
          id: userId,
          name: details.name,
          email: details.email,
          phone: details.phone,
          orders: data.orders,
          totalSpent: `$${data.totalSpent.toFixed(2)}`,
          totalSpentRaw: data.totalSpent,
          status: status,
          joinDate: new Date(details.joinDate).toISOString().split("T")[0],
          loyaltyPoints: loyaltyPoints,
          lastOrderDate: data.lastOrderDate,
          firstOrderDate: data.firstOrderDate,
        };
      }
    );

    // Sort by total spent (descending)
    customers.sort((a, b) => b.totalSpentRaw - a.totalSpentRaw);

    res.json({
      success: true,
      customers: customers,
      stats: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c) => c.status === "Active").length,
        vipCustomers: customers.filter((c) => c.status === "VIP").length,
        totalOrders: customers.reduce((sum, c) => sum + c.orders, 0),
        totalRevenue: customers.reduce((sum, c) => sum + c.totalSpentRaw, 0),
        averageOrderValue:
          customers.length > 0
            ? (
                customers.reduce((sum, c) => sum + c.totalSpentRaw, 0) /
                customers.reduce((sum, c) => sum + c.orders, 0)
              ).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customers",
    });
  }
};

// Get customer details by ID
const getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get customer's orders
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.equal("users", customerId)]
    );

    if (orders.documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Calculate statistics
    let totalSpent = 0;
    let firstOrderDate = orders.documents[0].createdAt;
    let lastOrderDate = orders.documents[0].createdAt;

    orders.documents.forEach((order) => {
      // Parse amount
      let orderAmount = 0;
      if (typeof order.amount === "number") {
        orderAmount = order.amount;
      } else if (typeof order.amount === "string") {
        orderAmount = parseFloat(order.amount) || 0;
      }
      totalSpent += orderAmount;

      // Update dates
      if (new Date(order.createdAt) < new Date(firstOrderDate)) {
        firstOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(lastOrderDate)) {
        lastOrderDate = order.createdAt;
      }
    });

    // Get customer details from first order
    const firstOrder = orders.documents[0];

    // Calculate status
    let status = "Active";
    const daysSinceLastOrder =
      (new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24);

    if (daysSinceLastOrder > 90) {
      status = "Inactive";
    } else if (totalSpent > 1000 || orders.total > 20) {
      status = "VIP";
    }

    // Calculate loyalty points
    const loyaltyPoints = Math.round(totalSpent + orders.total * 10);

    // Get customer's favorite products
    const productMap = new Map();
    orders.documents.forEach((order) => {
      try {
        const items = JSON.parse(order.items || "[]");
        items.forEach((item) => {
          if (!productMap.has(item.productId)) {
            productMap.set(item.productId, {
              name: item.productName,
              quantity: 0,
              totalSpent: 0,
            });
          }
          const product = productMap.get(item.productId);
          product.quantity += item.quantity || 1;
          product.totalSpent += item.price * (item.quantity || 1);
        });
      } catch (error) {
        console.error("Error parsing order items:", error);
      }
    });

    const favoriteProducts = Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        name: data.name,
        quantity: data.quantity,
        totalSpent: data.totalSpent,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const customer = {
      id: customerId,
      name: firstOrder.username || "Customer",
      email: firstOrder.customerEmail || "",
      phone: "", // Would come from user collection
      orders: orders.total,
      totalSpent: `$${totalSpent.toFixed(2)}`,
      status: status,
      joinDate: new Date(firstOrderDate).toISOString().split("T")[0],
      loyaltyPoints: loyaltyPoints,
      lastOrderDate: lastOrderDate,
      averageOrderValue: `$${(totalSpent / orders.total).toFixed(2)}`,
      favoriteProducts: favoriteProducts,
      orderHistory: orders.documents
        .map((order) => ({
          orderId: order.orderId || order.$id,
          date: order.createdAt,
          amount: `$${order.amount || 0}`,
          status: order.status || "completed",
          items: JSON.parse(order.items || "[]").length,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    };

    res.json({
      success: true,
      customer: customer,
    });
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer details",
    });
  }
};

// Get customer insights/analytics
const getCustomerInsights = async (req, res) => {
  try {
    // Get all orders
    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.limit(1000)]
    );

    // Group by user
    const userOrders = new Map();
    orders.documents.forEach((order) => {
      const userId = order.users;
      if (!userOrders.has(userId)) {
        userOrders.set(userId, []);
      }
      userOrders.get(userId).push(order);
    });

    // Calculate insights
    const repeatCustomers = Array.from(userOrders.values()).filter(
      (orders) => orders.length > 1
    ).length;

    const repeatCustomerRate =
      userOrders.size > 0
        ? ((repeatCustomers / userOrders.size) * 100).toFixed(0)
        : 0;

    // Calculate average order value
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.documents.forEach((order) => {
      let orderAmount = 0;
      if (typeof order.amount === "number") {
        orderAmount = order.amount;
      } else if (typeof order.amount === "string") {
        orderAmount = parseFloat(order.amount) || 0;
      }
      totalRevenue += orderAmount;
      totalOrders += 1;
    });

    const averageOrderValue =
      totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : "$0";

    // Calculate purchase cycles (simplified)
    const purchaseCycles = [];
    userOrders.forEach((orders) => {
      if (orders.length > 1) {
        // Sort by date
        const sortedOrders = orders.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        for (let i = 1; i < sortedOrders.length; i++) {
          const daysBetween =
            (new Date(sortedOrders[i].createdAt) -
              new Date(sortedOrders[i - 1].createdAt)) /
            (1000 * 60 * 60 * 24);
          purchaseCycles.push(daysBetween);
        }
      }
    });

    const averagePurchaseCycle =
      purchaseCycles.length > 0
        ? `${Math.round(purchaseCycles.reduce((a, b) => a + b, 0) / purchaseCycles.length)} days`
        : "N/A";

    res.json({
      success: true,
      insights: {
        repeatCustomerRate: `${repeatCustomerRate}%`,
        averageOrderValue: averageOrderValue,
        averagePurchaseCycle: averagePurchaseCycle,
        satisfactionScore: "4.8/5", // This would come from reviews/ratings
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        averageOrdersPerCustomer:
          userOrders.size > 0
            ? (totalOrders / userOrders.size).toFixed(1)
            : "0",
      },
    });
  } catch (error) {
    console.error("Error fetching customer insights:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer insights",
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerDetails,
  getCustomerInsights,
};
