# Rating Analytics Frontend Implementation Guide

## 🎯 Overview

Complete frontend implementation guide for the Rating Analytics Dashboard to view rider performance and customer feedback.

## 📊 Dashboard Architecture

### **Main Dashboard Layout**

```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├─────────────────────────────────────────────────┤
│  📊 Overall Stats Cards (4 columns)            │
├─────────────────────────────────────────────────┤
│  📈 Trends Chart    │  🏆 Top Riders           │
│                     │                           │
├─────────────────────────────────────────────────┤
│  🎯 Rider Performance Table                     │
├─────────────────────────────────────────────────┤
│  💬 Recent Customer Feedback                    │
└─────────────────────────────────────────────────┘
```

## 🚀 Required Pages & Components

### **1. Analytics Dashboard** (`/admin/analytics`)

**Main analytics overview with summary cards and charts**

### **2. Rider Performance** (`/admin/analytics/riders`)

**Detailed rider performance table and filters**

### **3. Individual Rider View** (`/admin/analytics/riders/[riderId]`)

**Deep dive into specific rider's performance**

### **4. Customer Feedback** (`/admin/analytics/feedback`)

**Customer feedback analysis and comments review**

---

## 📋 API Endpoints Available

### **Overall Analytics**

```javascript
GET /api/analytics/overall?startDate=2025-01-01&endDate=2025-12-31
```

**Returns:**

- Total ratings, average rating
- Rating distribution (1-5 stars)
- Recent ratings and top comments
- Total riders/customers count

### **Rider Performance**

```javascript
GET /api/analytics/riders/performance?sortBy=averageRating&limit=50
```

**Returns:**

- List of riders with performance stats
- Average ratings, total deliveries
- Rating distribution per rider
- Recent activity

### **Individual Rider Analytics**

```javascript
GET /api/analytics/riders/:riderId?startDate=2025-01-01
```

**Returns:**

- Detailed rider statistics
- Rating trends over time
- Recent ratings and customer feedback
- Performance breakdown

### **Rating Trends**

```javascript
GET /api/analytics/trends?period=week&startDate=2025-01-01
```

**Returns:**

- Time-series data for charts
- Rating trends by day/week/month
- Performance over time

### **Customer Feedback**

```javascript
GET /api/analytics/feedback?hasComment=true&minRating=1&maxRating=5
```

**Returns:**

- Customer comments and ratings
- Feedback analysis (common words)
- Rating breakdown by sentiment

---

## 🎨 Frontend Components Needed

### **1. Summary Cards Component**

```jsx
const SummaryCards = ({ analytics }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <StatCard
      title="Total Ratings"
      value={analytics.totalRatings}
      icon="⭐"
      trend="+12%"
    />
    <StatCard
      title="Average Rating"
      value={`${analytics.averageRating}/5`}
      icon="📊"
      trend="+0.2"
    />
    <StatCard
      title="Active Riders"
      value={analytics.totalRiders}
      icon="🚴‍♂️"
      trend="+3"
    />
    <StatCard
      title="Happy Customers"
      value={analytics.totalCustomers}
      icon="😊"
      trend="+25%"
    />
  </div>
);
```

### **2. Rating Trends Chart**

```jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RatingTrendsChart = ({ trends }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Rating Trends</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[1, 5]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="averageRating"
          stroke="#10b981"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
```

### **3. Rider Performance Table**

```jsx
const RiderPerformanceTable = ({ riders, onViewRider }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold">Rider Performance</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Rider
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Avg Rating
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Total Ratings
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Last Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {riders.map((rider) => (
            <tr key={rider.riderId}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {rider.riderName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {rider.riderPhone}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    {rider.averageRiderRating}
                  </span>
                  <div className="ml-2">
                    <StarRating rating={rider.averageRiderRating} size="sm" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {rider.totalRatings}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(rider.lastRatingDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onViewRider(rider.riderId)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
```

### **4. Rating Distribution Chart**

```jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RatingDistributionChart = ({ distribution }) => {
  const data = [
    { rating: "⭐", count: distribution[1], fill: "#ef4444" },
    { rating: "⭐⭐", count: distribution[2], fill: "#f97316" },
    { rating: "⭐⭐⭐", count: distribution[3], fill: "#eab308" },
    { rating: "⭐⭐⭐⭐", count: distribution[4], fill: "#22c55e" },
    { rating: "⭐⭐⭐⭐⭐", count: distribution[5], fill: "#10b981" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill={(entry) => entry.fill} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### **5. Customer Feedback Component**

```jsx
const CustomerFeedback = ({ feedback }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold">Recent Customer Feedback</h3>
    </div>
    <div className="divide-y divide-gray-200">
      {feedback.map((item, index) => (
        <div key={index} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-900">
                  {item.customerName}
                </span>
                <div className="ml-2">
                  <StarRating rating={item.riderRating} size="sm" />
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              {item.comment && (
                <p className="text-gray-700 text-sm italic">"{item.comment}"</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

---

## 🛠 Implementation Steps

### **Step 1: Install Dependencies**

```bash
npm install recharts date-fns
```

### **Step 2: Create Data Fetching Hooks**

```jsx
// hooks/useAnalytics.js
import { useState, useEffect } from "react";

export const useOverallAnalytics = (dateRange) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange.startDate)
          params.append("startDate", dateRange.startDate);
        if (dateRange.endDate) params.append("endDate", dateRange.endDate);

        const response = await fetch(`/api/analytics/overall?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.analytics);
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  return { data, loading, error };
};
```

### **Step 3: Create Main Dashboard Page**

```jsx
// pages/admin/analytics/index.js
import { useState } from "react";
import {
  useOverallAnalytics,
  useRatingTrends,
} from "../../../hooks/useAnalytics";
import SummaryCards from "../../../components/analytics/SummaryCards";
import RatingTrendsChart from "../../../components/analytics/RatingTrendsChart";
import RiderPerformanceTable from "../../../components/analytics/RiderPerformanceTable";

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  });

  const { data: analytics, loading: analyticsLoading } =
    useOverallAnalytics(dateRange);
  const { data: trends, loading: trendsLoading } = useRatingTrends(dateRange);

  if (analyticsLoading || trendsLoading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rating Analytics</h1>
        <p className="mt-2 text-gray-600">
          Monitor rider performance and customer satisfaction
        </p>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="mb-8"
      />

      {/* Summary Cards */}
      <SummaryCards analytics={analytics} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RatingTrendsChart trends={trends} />
        <RatingDistributionChart distribution={analytics.ratingDistribution} />
      </div>

      {/* Rider Performance */}
      <div className="mb-8">
        <RiderPerformanceTable
          riders={analytics.topRiders || []}
          onViewRider={(riderId) =>
            router.push(`/admin/analytics/riders/${riderId}`)
          }
        />
      </div>

      {/* Customer Feedback */}
      <CustomerFeedback feedback={analytics.recentRatings} />
    </div>
  );
};

export default AnalyticsDashboard;
```

---

## 📱 Responsive Design Considerations

### **Mobile Layout**

- Stack cards vertically on mobile
- Horizontal scroll for tables
- Simplified chart views
- Collapsible filter sections

### **Tablet Layout**

- 2-column card grid
- Side-by-side charts
- Condensed table rows

### **Desktop Layout**

- 4-column card grid
- Full-width charts and tables
- Advanced filtering sidebar

---

## 🎯 Advanced Features to Implement

### **1. Real-time Updates**

```jsx
// Add WebSocket or polling for live data
useEffect(() => {
  const interval = setInterval(() => {
    refetchAnalytics();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);
```

### **2. Export Functionality**

```jsx
const exportToCSV = (data) => {
  // Convert analytics data to CSV format
  const csvContent = generateCSV(data);
  downloadFile(csvContent, "rider-analytics.csv");
};
```

### **3. Advanced Filters**

- Date range picker
- Rider selection filter
- Rating range filter
- Performance tier filter

### **4. Notification Alerts**

```jsx
// Alert for low-performing riders
const LowPerformanceAlert = ({ riders }) => {
  const lowPerformers = riders.filter((r) => r.averageRating < 3.0);

  if (lowPerformers.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h4 className="text-red-800 font-medium">⚠️ Attention Required</h4>
      <p className="text-red-700 text-sm">
        {lowPerformers.length} rider(s) have ratings below 3.0 and may need
        coaching.
      </p>
    </div>
  );
};
```

---

## 🚀 Quick Start Implementation

### **Priority Order:**

1. **Overall Analytics Dashboard** - Core metrics and charts
2. **Rider Performance Table** - List view with sorting
3. **Individual Rider View** - Detailed rider analytics
4. **Customer Feedback** - Comments and sentiment analysis
5. **Advanced Features** - Exports, real-time updates, alerts

### **Tech Stack Recommendations:**

- **Framework:** Next.js or React
- **Charts:** Recharts or Chart.js
- **Styling:** Tailwind CSS
- **State:** React Query for data fetching
- **Icons:** Heroicons or Lucide React

The analytics dashboard will provide comprehensive insights into rider performance and customer satisfaction, enabling data-driven decisions for service improvement! 📊🚀
