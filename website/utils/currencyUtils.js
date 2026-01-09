import AsyncStorage from "@react-native-async-storage/async-storage";

import { Databases, Query } from "appwrite";
import { client, Config } from "../Appwrite";

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  KES: "KSh",
  SSP: "ssp",
  // Add more currencies if needed
};
const databases = new Databases(client);
export const convertPrice = async (priceInUSD) => {
  const userCurrency = (await AsyncStorage.getItem("userCurrency")) || "KES";

  try {
    const response = await databases.listDocuments(
      Config.databaseId,
      Config.currenciesCollection,
      [Query.equal("currency_code", userCurrency)]
    );

    if (response.documents.length > 0) {
      const exchangeRate = response.documents[0].rate;
      const symbol = currencySymbols[userCurrency] || "";
      return `${symbol} ${(priceInUSD * exchangeRate).toFixed(2)}`;
    }
  } catch (error) {
    console.error("Error converting price:", error);
  }
  return `KSh ${priceInUSD.toFixed(2)}`; // Default to KES if error occurs
};
