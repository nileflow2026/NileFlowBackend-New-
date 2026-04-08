import { usePremiumContext } from "../Context/PremiumContext";

/**
 * Hook to get current premium subscription status
 * @returns {{ isPremium: boolean, expiresAt: string | null, loading: boolean, error: string | null }}
 */
export const usePremiumStatus = () => {
  const { isPremium, expiresAt, loading, error } = usePremiumContext();

  return {
    isPremium,
    expiresAt,
    loading,
    error,
    isExpiringSoon: expiresAt ? isWithinDays(expiresAt, 7) : false,
  };
};

// Helper: Check if date is within X days
const isWithinDays = (dateString, days) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
};
