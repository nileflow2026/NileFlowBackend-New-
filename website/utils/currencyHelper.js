import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to get the stored currency
export const getUserCurrency = async () => {
    const currency = await AsyncStorage.getItem("selectedCurrency");
    return currency || "usd"; // Default to USD if not set
};
