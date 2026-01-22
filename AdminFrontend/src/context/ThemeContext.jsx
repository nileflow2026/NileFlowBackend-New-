/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { account } from "../../appwrite";
import { getProfile } from "../../adminService";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  /*  const { user } = useAuth(); */
  const { user } = useState(null);

  useEffect(() => {
    const fetchThemeFromPrefs = async () => {
      try {
        const savedTheme = user?.prefs?.theme || "light";
        setTheme(savedTheme);
        document.documentElement.classList.toggle(
          "dark",
          savedTheme === "dark"
        );
      } catch (error) {
        console.error("Failed to fetch theme from prefs:", error.message);
      }
    };

    if (user) {
      fetchThemeFromPrefs();
    } else {
      // No localStorage for guests — default to light
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, [user]);

  /*  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  
    try {
   
        const user = await getProfile();
      const currentPrefs = user.prefs || {};
      // Merge theme into current prefs
      const updatedPrefs = {
        ...currentPrefs,
        theme: newTheme, 
      };
  
      // Update prefs safely
      await account.updatePrefs(updatedPrefs);
      console.log('✅ Theme saved to prefs:', newTheme);
    } catch (error) {
      console.error('❌ Failed to save theme to prefs:', error.message);
    }
  }; */

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    // Save theme only if the user is logged in
    if (user && user.$id) {
      try {
        const currentPrefs = user.prefs || {};
        const updatedPrefs = {
          ...currentPrefs,
          theme: newTheme,
        };
        await account.updatePrefs(updatedPrefs);
        console.log("✅ Theme saved to prefs:", newTheme);
      } catch (error) {
        console.error("❌ Failed to save theme to prefs:", error.message);
      }
    } else {
      // Guests: keep theme in memory only (no localStorage persistence)
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
