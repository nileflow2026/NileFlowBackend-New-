import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '67fe57950025a88aad24';

export const addRecentSearch = async (query) => {
  try {
    const existing = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    let searches = existing ? JSON.parse(existing) : [];

    // Remove duplicate & keep max 10 items
    searches = [query, ...searches.filter(item => item !== query)].slice(0, 10);
    
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to save recent search', error);
  }
};

export const getRecentSearches = async () => {
  try {
    const existing = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Failed to fetch recent searches', error);
    return [];
  }
};

export const clearRecentSearches = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Failed to clear recent searches', error);
  }
};
