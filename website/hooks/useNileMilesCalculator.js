import { usePremiumStatus } from "./usePremiumStatus";

/**
 * Hook to calculate Nile Miles with premium 2x multiplier
 * @param {number} baseMiles - Base miles to be earned
 * @returns {{ calculatedMiles: number, isPremiumBonus: boolean, multiplier: number }}
 */
export const useNileMilesCalculator = (baseMiles = 0) => {
  const { isPremium } = usePremiumStatus();

  const multiplier = isPremium ? 2 : 1;
  const calculatedMiles = Math.floor(baseMiles * multiplier);
  const bonusMiles = calculatedMiles - baseMiles;

  return {
    calculatedMiles,
    baseMiles,
    bonusMiles,
    isPremiumBonus: isPremium,
    multiplier,
  };
};

/**
 * Calculate miles from order amount
 * Premium users get 2x miles
 * @param {number} orderAmount - Order total in Ksh
 * @param {boolean} isPremium - Premium status
 * @returns {number} - Calculated miles
 */
export const calculateMilesFromAmount = (orderAmount, isPremium = false) => {
  // Base calculation: 1 mile per 10 Ksh spent
  const baseMiles = Math.floor(orderAmount / 10);
  const multiplier = isPremium ? 2 : 1;
  return baseMiles * multiplier;
};
