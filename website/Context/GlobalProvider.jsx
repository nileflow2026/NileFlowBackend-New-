/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axiosClient from "../api";
import { account } from "../appwrite";
import { getCurrentUser } from "../authServices";

// The problematic import is removed
// import AsyncStorage from "@react-native-async-storage/async-storage";

const GlobalContext = createContext({
  isLogged: false,
  setIsLogged: () => {},
  user: null,
  setUser: () => {},
  loading: true,
  isGuest: false,
  setIsGuest: () => {},
  startGuestSessionFlow: () => Promise.resolve(),
  handleLogout: () => {},

  // 🆕 Assistant defaults
  assistantMessages: [],
  setAssistantMessages: () => {},
  assistantOpen: false,
  setAssistantOpen: () => {},
});

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // 🆕 Assistant state
  const [assistantMessages, setAssistantMessages] = useState(() => {
    // Load persisted history from localStorage (optional)
    const saved = localStorage.getItem("assistantMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Persist messages in localStorage
  useEffect(() => {
    localStorage.setItem(
      "assistantMessages",
      JSON.stringify(assistantMessages)
    );
  }, [assistantMessages]);

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const guest = localStorage.getItem("isGuest");
        setIsGuest(guest === "true");
      } catch (error) {
        console.error("Error checking guest status:", error);
      }
    };
    checkGuestStatus();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setIsLogged(true);
          if (currentUser.key) {
            const { key, ...rest } = currentUser;
            setUser({ ...rest, appwriteKey: key });
          } else {
            setUser(currentUser);
          }
          setIsGuest(false);
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        setIsLogged(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("isGuest");
      localStorage.removeItem("assistantMessages"); // 🆕 clear assistant history

      setIsLogged(false);
      setUser(null);
      setIsGuest(false);
      setAssistantMessages([]); // reset on logout

      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const contextValue = useMemo(
    () => ({
      isLogged,
      setIsLogged,
      user,
      setUser,
      loading,
      isGuest,
      setIsGuest,
      handleLogout,

      // 🆕 Assistant context values
      assistantMessages,
      setAssistantMessages,
      assistantOpen,
      setAssistantOpen,
    }),
    [isLogged, user, loading, isGuest, assistantMessages, assistantOpen]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
