// controllers/vendorDashboardController.js
const { ID, Query } = require("node-appwrite");
const { env } = require("../../src/env");
const { db } = require("../../services/appwriteService");

// Get vendor dashboard statistics
const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.userId; // Get vendor ID from authenticated user

    // 1. Get vendor's products count
    const vendorProducts = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const totalProducts = vendorProducts.total;

    // 2. Get orders that contain vendor's products
    // First, get all product IDs for this vendor
    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );

    // Get all orders
    const allOrders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.limit(1000)] // Adjust limit as needed
    );

    // Filter orders that contain vendor's products
    let vendorOrders = [];
    let totalRevenue = 0;
    let uniqueCustomers = new Set();

    for (const order of allOrders.documents) {
      try {
        const items = JSON.parse(order.items || "[]");
        const vendorItems = items.filter((item) =>
          vendorProductIds.includes(item.productId)
        );

        if (vendorItems.length > 0) {
          // Calculate revenue for vendor's items
          const orderRevenue = vendorItems.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          );

          totalRevenue += orderRevenue;
          uniqueCustomers.add(order.users); // Add customer ID

          vendorOrders.push({
            orderId: order.orderId || order.$id,
            customer: order.username || order.customerEmail,
            date: order.createdAt || order.date,
            amount: orderRevenue,
            status: order.status || "pending",
            items: vendorItems,
          });
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }
    }

    // 3. Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = vendorOrders.reduce((sum, order) => {
      const orderDate = new Date(order.date);
      if (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      ) {
        return sum + order.amount;
      }
      return sum;
    }, 0);

    // 4. Get pending payment (earnings for this month)
    const pendingPayment = monthlyRevenue;

    // 5. Get top selling products
    const productSales = {};

    vendorOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].sales += item.quantity || 1;
        productSales[item.productId].revenue +=
          item.price * (item.quantity || 1);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        sales: product.sales,
        revenue: `$${product.revenue.toFixed(2)}`,
      }));

    // 6. Get recent orders (last 10)
    const recentOrders = vendorOrders
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map((order) => ({
        id: order.orderId,
        customer: order.customer,
        date: new Date(order.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        amount: `$${order.amount.toFixed(2)}`,
        status: order.status,
      }));

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue: `$${totalRevenue.toFixed(2)}`,
          monthlyRevenue: `$${monthlyRevenue.toFixed(2)}`,
          pendingPayment: `$${pendingPayment.toFixed(2)}`,
          totalOrders: vendorOrders.length,
          totalProducts: totalProducts,
          totalCustomers: uniqueCustomers.size,
        },
        recentOrders: recentOrders,
        topProducts: topProducts,
        chartData: {
          monthlyEarnings: generateMonthlyEarningsChart(vendorOrders),
          productPerformance: topProducts,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
    });
  }
};

// Helper function for monthly earnings chart
const generateMonthlyEarningsChart = (vendorOrders) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentYear = new Date().getFullYear();

  const monthlyEarnings = new Array(12).fill(0);

  vendorOrders.forEach((order) => {
    const orderDate = new Date(order.date);
    if (orderDate.getFullYear() === currentYear) {
      const monthIndex = orderDate.getMonth();
      monthlyEarnings[monthIndex] += order.amount;
    }
  });

  return months.map((month, index) => ({
    month,
    earnings: monthlyEarnings[index],
  }));
};

// Get vendor payment history
const getVendorPayments = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // In a real system, you'd have a payments collection
    // For now, we'll calculate from orders
    const vendorProducts = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );
    const allOrders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.limit(1000)]
    );

    const payments = [];
    let totalPaid = 0;

    // Group by month
    const monthlyPayments = {};

    allOrders.documents.forEach((order) => {
      try {
        const items = JSON.parse(order.items || "[]");
        const vendorItems = items.filter((item) =>
          vendorProductIds.includes(item.productId)
        );

        if (vendorItems.length > 0) {
          const orderAmount = vendorItems.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          );

          const orderDate = new Date(order.createdAt || order.date);
          const monthYear = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;

          if (!monthlyPayments[monthYear]) {
            monthlyPayments[monthYear] = {
              month: orderDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
              amount: 0,
              orders: 0,
              status: "pending", // This month's payment is pending
            };
          }

          monthlyPayments[monthYear].amount += orderAmount;
          monthlyPayments[monthYear].orders += 1;

          // If order is from previous month, mark as paid
          const currentDate = new Date();
          if (
            orderDate.getMonth() < currentDate.getMonth() ||
            orderDate.getFullYear() < currentDate.getFullYear()
          ) {
            monthlyPayments[monthYear].status = "paid";
            totalPaid += orderAmount;
          }
        }
      } catch (error) {
        console.error("Error processing order for payments:", error);
      }
    });

    // Convert to array and sort by date
    const paymentHistory = Object.values(monthlyPayments)
      .sort((a, b) => new Date(b.month) - new Date(a.month))
      .map((payment) => ({
        ...payment,
        amount: `$${payment.amount.toFixed(2)}`,
      }));

    res.json({
      success: true,
      data: {
        paymentHistory: paymentHistory,
        summary: {
          totalPaid: `$${totalPaid.toFixed(2)}`,
          pendingPayment: `$${paymentHistory
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + parseFloat(p.amount.replace("$", "")), 0)
            .toFixed(2)}`,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor payments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment data",
    });
  }
};

module.exports = {
  getVendorDashboard,
  getVendorPayments,
};
