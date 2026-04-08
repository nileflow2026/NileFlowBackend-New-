import { useEffect, useState } from "react";
import { useRecommendations } from "../hooks/useRecommendations";
import { RecommendationSection } from "./RecommendationSection";

// components/SmartRecommendations.jsx
export const SmartRecommendations = ({ userId }) => {
  const [variant, setVariant] = useState("default");

  useEffect(() => {
    // Get A/B test variant
    const getVariant = async () => {
      const response = await fetch(
        `/api/recommendations/ab-test/variant/${userId}`
      );
      const data = await response.json();
      setVariant(data.variant); // 'cultural_boost', 'exploration_heavy', 'business_optimized'
    };

    getVariant();
  }, [userId]);

  // Different recommendation strategies
  const getRecommendationConfig = () => {
    switch (variant) {
      case "cultural_boost":
        return { culturalWeight: 2.0, explorationRate: 0.1 };
      case "exploration_heavy":
        return { explorationRate: 0.3, diversityBoost: 1.5 };
      case "business_optimized":
        return { businessWeight: 1.3, marginBoost: 1.2 };
      default:
        return {};
    }
  };

  const { recommendations } = useRecommendations(userId, {
    variant,
    config: getRecommendationConfig(),
  });

  return (
    <RecommendationSection
      recommendations={recommendations}
      variant={variant}
    />
  );
};
