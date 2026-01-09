import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to get JWT Token from AsyncStorage
export const getJwtToken = async () => {
    try {
        const token = await AsyncStorage.getItem("jwtToken");
        return token;
    } catch (error) {
        console.error("❌ Error retrieving JWT Token:", error);
        return null;
    }
};

// Function to save JWT Token to AsyncStorage
export const saveJwtToken = async (token) => {
    try {
        await AsyncStorage.setItem("jwtToken", token);
    } catch (error) {
        console.error("❌ Error saving JWT Token:", error);
    }
};

// Function to remove JWT Token (use when logging out)
export const removeJwtToken = async () => {
    try {
        await AsyncStorage.removeItem("jwtToken");
    } catch (error) {
        console.error("❌ Error removing JWT Token:", error);
    }
};
