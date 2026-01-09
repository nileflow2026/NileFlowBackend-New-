// components/RecommendationSection.jsx
import React from "react";
import { useRecommendations } from "../hooks/useRecommendations";
import axiosClient from "../api.js";
import RecommendationSkeleton from "./RecommendationSkeleton";
import { RecommendationCard } from "./RecommendationCard";
import DebugPanel from "./DebugPanel";

/* export const RecommendationSection = ({
  userId,
  title = "Recommended for You",
  category = null,
  context = "homepage",
}) => {
  const { recommendations, loading, metadata } = useRecommendations(userId, {
    limit: 12,
    category,
    context,
    exploration: true,
  });

  // Track clicks for learning
  const handleItemClick = async (item, position) => {
    // Send feedback immediately
    await axiosClient.post("/api/recommendations/feedback/clicks", {
      userId,
      itemId: item.id,
      sessionId: metadata?.sessionId,
      position,
      context,
      timestamp: Date.now(),
    });

    // Navigate to product page
    window.location.href = `/products/${item.id}`;
  };

  if (loading) return <RecommendationSkeleton />;
  if (
    !recommendations ||
    !Array.isArray(recommendations) ||
    recommendations.length === 0
  )
    return null;

  return (
    <section className="recommendation-section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>

      
        {metadata?.culturalBoost > 1.1 && (
          <div className="text-sm text-green-600 flex items-center">
            🌍 Culturally Personalized
            <span className="ml-1 bg-green-100 px-2 py-1 rounded">
              +{Math.round((metadata.culturalBoost - 1) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.map((item, index) => (
          <RecommendationCard
            key={item.id || item._id || item.$id || `rec-${index}`}
            item={item}
            position={index}
            onClick={() => handleItemClick(item, index)}
            culturalRelevance={item.culturalRelevance}
            trustScore={item.trustScore}
          />
        ))}
      </div>

      
      {typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        metadata && <DebugPanel metadata={metadata} />}
    </section>
  );
};
 */
export const RecommendationSection = ({
  userId,
  title = "Recommended for You",
  category = null,
  context = "homepage",
}) => {
  const { recommendations, loading, metadata } = useRecommendations(userId, {
    limit: 12,
    category,
    context,
    exploration: true,
  });

  // Track clicks for learning
  const handleItemClick = async (item, position) => {
    try {
      // Send feedback immediately - UPDATED FORMAT
      await axiosClient.post("/api/recommendations/feedback/clicks", {
        clicks: [
          // ✅ Backend expects array of clicks
          {
            userId,
            itemId: item.itemId || item.id, // ✅ Use itemId (from API response)
            sessionId: metadata?.sessionId,
            position,
            timestamp: new Date().toISOString(), // ✅ ISO string format
          },
        ],
      });
    } catch (error) {
      console.error("Failed to track click:", error);
      // Don't block navigation if tracking fails
    }

    // Navigate to product page
    window.location.href = `/products/${item.itemId || item.id}`;
  };

  if (loading) return <RecommendationSkeleton />;
  if (
    !recommendations ||
    !Array.isArray(recommendations) ||
    recommendations.length === 0
  )
    return null;

  return (
    <section className="recommendation-section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>

        {/* Show cultural intelligence when active */}
        {metadata?.culturalBoost > 1.1 && (
          <div className="text-sm text-green-600 flex items-center">
            🌍 Culturally Personalized
            <span className="ml-1 bg-green-100 px-2 py-1 rounded">
              +{Math.round((metadata.culturalBoost - 1) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.map((item, index) => (
          <RecommendationCard
            key={
              item.itemId || item.id || item._id || item.$id || `rec-${index}`
            } // ✅ Updated key
            item={item}
            position={index}
            onClick={() => handleItemClick(item, index)}
            culturalRelevance={item.culturalRelevance}
            trustScore={item.trustScore}
          />
        ))}
      </div>

      {/* Debug info in development */}
      {typeof window !== "undefined" &&
        window.location.hostname === "localhost" &&
        metadata && <DebugPanel metadata={metadata} />}
    </section>
  );
};
