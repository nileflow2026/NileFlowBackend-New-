/* eslint-disable react-refresh/only-export-components */
// context/ThemeContext.js

import { createContext, useContext, useEffect, useState } from 'react';


const ThemeContext = createContext();
const STORAGE_KEY = 'app_theme';

const colorPalette = {
  orange: {
    100: '#FEE9DD',
    200: '#F5A05C',
    300: '#D96B29',
    400: '#8C3E14',
  },
  brown: {
    100: '#AF6432',
    200: '#6E3C1A',
  },
  beige: {
    100: '#FFF8F0',
  },
  black: {
    100: '#000000',
    200: '#222222',
  },
  white: {
    100: '#FFFFFF',
  },
  lightGray: {
  100: '#F5F5F5', // very light gray (almost white)
  200: '#E5E5E5', // soft UI background gray
  300: '#D4D4D4', // neutral form input gray
  400: '#A3A3A3', // medium-light gray (good for placeholders)
  500: '#737373', // baseline readable gray text
}

};

const themes = {
   light: {
    name: 'light',
    background: '#FFFFFF',
    text: '#000000',
    card: '#F4F4F4',
    primary: '#1D4ED8',
    button: '#60A5FA',
    accent: '#E5E7EB',
    colors: {}, // No custom palette in light mode
  },

  dark: {
    name: 'dark',
    background: colorPalette.brown[200],
    text: colorPalette.white[100],
    card: colorPalette.brown[100],
    primary: colorPalette.orange[400],
    button: colorPalette.lightGray[200],
    accent: colorPalette.orange[100],
    colors: colorPalette,
    background2: colorPalette.beige[200],
    text2: colorPalette.black[100],
    card2: colorPalette.orange[300],
    primary2: colorPalette.orange[300],
    button2: colorPalette.orange[200],
    accent2: colorPalette.brown[100],
    colors2: colorPalette,
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const [theme, setTheme] = useState(systemColorScheme || 'light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const LoadTheme = async () => {
      try {
        const storedTheme = localStorage.getItem(STORAGE_KEY);
        if (storedTheme) {
          setTheme(storedTheme)
        } 
      } catch (e) {
        console.log('Failed to Load theme from storage', e)
      } finally {
        setLoading(false)
      }
    }
    LoadTheme();
  }, [])

  const toggleTheme = async () => {
     const newTheme = theme === 'light' ? 'dark' : 'light';
    try{
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch (e) {
      console.warn("Failed to save theme to stoarge", e)
    }
    setTheme(newTheme);
  };

  if(loading) return null;

  return (
    <ThemeContext.Provider value={{ theme, themeStyles: themes[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
