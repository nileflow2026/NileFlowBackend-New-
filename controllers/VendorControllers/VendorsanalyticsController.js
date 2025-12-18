// controllers/analyticsController.js
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");
const { db } = require("../../services/appwriteService");

// Get sales analytics data
const getSalesAnalytics = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { period = "6m" } = req.query; // 1m, 3m, 6m, 1y

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "1m":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // Get vendor's products
    const vendorProducts = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );

    // Get all orders within date range
    const allOrders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [
        Query.greaterThanEqual("createdAt", startDate.toISOString()),
        Query.limit(1000),
      ]
    );

    // Process orders to get vendor's data
    let monthlyData = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    let uniqueCustomers = new Set();
    let productSales = {};

    allOrders.documents.forEach((order) => {
      try {
        const orderDate = new Date(order.createdAt);
        const monthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;

        const items = JSON.parse(order.items || "[]");
        const vendorItems = items.filter((item) =>
          vendorProductIds.includes(item.productId)
        );

        if (vendorItems.length > 0) {
          // Calculate order metrics for vendor
          const orderRevenue = vendorItems.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          );
          const orderCount = 1;
          const orderCustomers = new Set([order.users]);

          // Track product sales
          vendorItems.forEach((item) => {
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

          // Initialize month if not exists
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: orderDate.toLocaleDateString("en-US", { month: "short" }),
              fullMonth: orderDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
              revenue: 0,
              orders: 0,
              customers: new Set(),
              growth: 0,
            };
          }

          // Add to month totals
          monthlyData[monthYear].revenue += orderRevenue;
          monthlyData[monthYear].orders += orderCount;
          orderCustomers.forEach((customer) =>
            monthlyData[monthYear].customers.add(customer)
          );

          // Update overall totals
          totalRevenue += orderRevenue;
          totalOrders += orderCount;
          orderCustomers.forEach((customer) => uniqueCustomers.add(customer));
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }
    });

    // Convert monthly data to array and calculate growth
    const months = Object.keys(monthlyData).sort();
    const salesData = months.map((monthKey, index) => {
      const data = monthlyData[monthKey];
      const previousMonth = index > 0 ? monthlyData[months[index - 1]] : null;

      let growth = 0;
      if (previousMonth && previousMonth.revenue > 0) {
        growth =
          ((data.revenue - previousMonth.revenue) / previousMonth.revenue) *
          100;
      }

      return {
        month: data.month,
        fullMonth: data.fullMonth,
        revenue: Math.round(data.revenue),
        orders: data.orders,
        customers: data.customers.size,
        growth: Math.round(growth),
      };
    });

    // Calculate metrics
    const previousPeriodData =
      salesData.length >= 2 ? salesData[salesData.length - 2] : null;
    const currentPeriodData =
      salesData.length >= 1 ? salesData[salesData.length - 1] : null;

    const revenueChange = previousPeriodData
      ? (((currentPeriodData?.revenue || 0) - previousPeriodData.revenue) /
          previousPeriodData.revenue) *
        100
      : 0;

    const ordersChange = previousPeriodData
      ? (((currentPeriodData?.orders || 0) - previousPeriodData.orders) /
          previousPeriodData.orders) *
        100
      : 0;

    const customersChange = previousPeriodData
      ? (((currentPeriodData?.customers || 0) - previousPeriodData.customers) /
          previousPeriodData.customers) *
        100
      : 0;

    // Calculate performance metrics
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Estimate conversion rate (this would need actual visit data)
    const conversionRate = Math.min(65 + Math.random() * 10, 95); // Mock for now

    // Customer satisfaction (would need review data)
    const customerSatisfaction = Math.min(85 + Math.random() * 8, 98); // Mock for now

    // Inventory turnover (based on product sales vs inventory)
    const inventoryTurnover =
      (vendorProducts.documents.reduce((sum, product) => {
        const productSalesCount = productSales[product.$id]?.sales || 0;
        const inventory = product.inventory || 0;
        return sum + (inventory > 0 ? productSalesCount / inventory : 0);
      }, 0) /
        vendorProducts.documents.length) *
      100;

    // Repeat customer rate
    const repeatCustomerRate = Math.min(40 + Math.random() * 15, 70); // Mock for now

    // Top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        sales: product.sales,
        revenue: product.revenue,
      }));

    res.json({
      success: true,
      data: {
        salesData,
        metrics: {
          revenue: {
            value: `$${Math.round(totalRevenue).toLocaleString()}`,
            change: revenueChange,
          },
          orders: {
            value: totalOrders.toString(),
            change: ordersChange,
          },
          customers: {
            value: uniqueCustomers.size.toString(),
            change: customersChange,
          },
          growth: {
            value: `${Math.round(revenueChange)}%`,
            change: 0,
          },
        },
        performance: {
          conversionRate: Math.round(conversionRate),
          customerSatisfaction: Math.round(customerSatisfaction),
          inventoryTurnover: Math.round(inventoryTurnover),
          repeatCustomerRate: Math.round(repeatCustomerRate),
          avgOrderValue: Math.round(avgOrderValue),
        },
        topProducts,
        insights: generateInsights(salesData, vendorProducts.documents.length),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics data",
    });
  }
};

// Helper function to generate insights
const generateInsights = (salesData, productCount) => {
  const recentGrowth =
    salesData.length > 0 ? salesData[salesData.length - 1].growth : 0;
  const avgRevenue =
    salesData.reduce((sum, month) => sum + month.revenue, 0) / salesData.length;

  let insights = [];
  let recommendations = [];

  if (recentGrowth > 20) {
    insights.push(
      "Your revenue growth is excellent! You're outperforming industry averages by a significant margin."
    );
    recommendations.push(
      "Consider expanding your best-selling product lines to capitalize on current momentum."
    );
  } else if (recentGrowth > 0) {
    insights.push(
      "Your business is growing steadily. Maintain your current strategies for continued growth."
    );
    recommendations.push(
      "Focus on customer retention to boost repeat purchases."
    );
  } else {
    insights.push(
      "Revenue growth has slowed. Consider reviewing your pricing or marketing strategies."
    );
    recommendations.push(
      "Analyze customer feedback and consider promotional campaigns."
    );
  }

  if (productCount < 10) {
    recommendations.push(
      "Diversify your product offerings to reach more customers."
    );
  }

  if (salesData.length > 0 && salesData[salesData.length - 1].customers > 50) {
    insights.push(
      "You have a strong customer base. Leverage this for repeat business."
    );
  }

  return {
    insights: insights.join(" "),
    recommendations: recommendations.join(" "),
  };
};

// Export analytics data
const exportAnalyticsData = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { format = "json" } = req.query;

    // Get analytics data
    const analytics = await getSalesAnalyticsData(vendorId);

    if (format === "csv") {
      // Convert to CSV (simplified)
      const csvData = convertToCSV(analytics);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=analytics-export.csv"
      );
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export analytics data",
    });
  }
};

module.exports = {
  getSalesAnalytics,
  exportAnalyticsData,
};
