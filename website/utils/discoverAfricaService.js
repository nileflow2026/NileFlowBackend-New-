/**
 * Discover Africa Service
 * Handles API calls for African facts, cultural content, and educational content
 */

import axiosClient from "../axiosClient";

/**
 * Fetch all African facts
 * @param {Object} filters - Optional filters (category, search, limit)
 * @returns {Promise<Array>} - Array of African facts
 */
export const fetchAfricanFacts = async (filters = {}) => {
  try {
    const { category, search, limit } = filters;
    const params = new URLSearchParams();

    if (category && category !== "all") {
      params.append("category", category);
    }
    if (search) {
      params.append("search", search);
    }
    if (limit) {
      params.append("limit", limit);
    }

    const response = await axiosClient.get(
      `/api/african-facts?${params.toString()}`
    );
    return response.data.facts || response.data || [];
  } catch (error) {
    console.error("Error fetching African facts:", error);
    throw error;
  }
};

/**
 * Fetch a single African fact by ID
 * @param {string} id - Fact ID
 * @returns {Promise<Object>} - African fact object
 */
export const fetchAfricanFactById = async (id) => {
  try {
    const response = await axiosClient.get(`/african-facts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching African fact:", error);
    throw error;
  }
};

/**
 * Fetch African fact categories
 * @returns {Promise<Array>} - Array of categories
 */
export const fetchAfricanFactCategories = async () => {
  try {
    const response = await axiosClient.get("/api/african-facts/categories");
    return response.data.categories || response.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return default categories if API fails
    return [
      { id: "all", name: "All Wonders" },
      { id: "culture", name: "Cultural Heritage" },
      { id: "nature", name: "Natural Wonders" },
      { id: "history", name: "Historical Facts" },
      { id: "art", name: "Art & Creativity" },
      { id: "wildlife", name: "Wildlife & Safari" },
    ];
  }
};

/**
 * Fetch African proverbs
 * @param {number} limit - Number of proverbs to fetch
 * @returns {Promise<Array>} - Array of proverbs
 */
export const fetchAfricanProverbs = async (limit = 7) => {
  try {
    const response = await axiosClient.get(
      `/api/african-proverbs?limit=${limit}`
    );
    return response.data.proverbs || response.data || [];
  } catch (error) {
    console.error("Error fetching proverbs:", error);
    // Return default proverbs if API fails
    return [
      "It takes a village to raise a child.",
      "A spider's web is stronger than it looks.",
      "Do not look where you fell, but where you slipped.",
      "He who learns, teaches.",
      "Smooth seas do not make skillful sailors.",
      "A tree is known by its fruit.",
      "When there is no enemy within, the enemies outside cannot hurt you.",
    ];
  }
};

/**
 * Get stats about African content
 * @returns {Promise<Object>} - Stats object with countries, languages, etc.
 */
export const fetchAfricanStats = async () => {
  try {
    const response = await axiosClient.get("/api/african-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching African stats:", error);
    // Return default stats if API fails
    return {
      countries: 54,
      languages: 2000,
      ethnicGroups: 3000,
      naturalWonders: 7,
      musicalTraditions: 500,
    };
  }
};

export default {
  fetchAfricanFacts,
  fetchAfricanFactById,
  fetchAfricanFactCategories,
  fetchAfricanProverbs,
  fetchAfricanStats,
};
