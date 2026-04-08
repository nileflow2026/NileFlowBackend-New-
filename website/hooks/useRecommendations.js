/* eslint-disable react-hooks/exhaustive-deps */
// hooks/useRecommendations.js
import { useState, useEffect } from "react";
import axiosClient from "../api.js";

export const useRecommendations = (userId, options = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams({
          limit: options.limit || 20,
          category: options.category || "",
          exploration: options.exploration || "true",
          context: options.context || "homepage",
        });

        const apiUrl = `/api/recommendations/${userId}?${params}`;
        const response = await axiosClient.get(apiUrl);

        const data = response.data;

        // Handle different response formats
        let recommendations = [];
        let metadata = null;

        if (data.success && data.data && data.data.recommendations) {
          // Your backend format: { success: true, data: { recommendations: [...], metadata: {...} } }
          recommendations = data.data.recommendations;
          metadata = data.data.metadata;
        } else if (data.success && data.recommendations) {
          // Alternative format: { success: true, recommendations: [...], metadata: {...} }
          recommendations = data.recommendations;
          metadata = data.metadata;
        } else if (Array.isArray(data)) {
          // Format: direct array of recommendations
          recommendations = data;
        } else if (
          data.recommendations &&
          Array.isArray(data.recommendations)
        ) {
          // Format: { recommendations: [...], metadata?: {...} }
          recommendations = data.recommendations;
          metadata = data.metadata;
        } else if (data.data && Array.isArray(data.data)) {
          // Format: { data: [...] }
          recommendations = data.data;
        }

        setRecommendations(
          Array.isArray(recommendations) ? recommendations : []
        );
        setMetadata(metadata);

        // Track recommendation impressions automatically
        if (recommendations.length > 0 && metadata?.sessionId) {
          trackImpressions(recommendations, metadata.sessionId, userId);
        }
      } catch (error) {
        console.error("Recommendations API failed:", error);
        // Fallback to popular items or cached recommendations
        setRecommendations(getFallbackRecommendations());
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [userId, options.category, options.context]);

  return { recommendations, loading, metadata };
};

// Fallback recommendations when API fails
const getFallbackRecommendations = () => {
  return [];
};

// Track impressions for continuous learning
const trackImpressions = (items, sessionId, userId) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return;
  }

  const impressions = items.map((item) => ({
    itemId: item.itemId, // Changed from item.id to item.itemId
    sessionId: sessionId || "unknown",
    timestamp: Date.now(),
    position: items.indexOf(item),
    context: "recommendation_display",
  }));

  // Batch send impressions with userId as expected by backend
  axiosClient
    .post("/api/recommendations/feedback/impressions", {
      userId: userId,
      impressions: impressions,
    })
    .catch((error) => {
      console.warn("Failed to track impressions:", error);
    });
};
