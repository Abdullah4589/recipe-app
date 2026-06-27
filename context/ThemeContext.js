import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme, Colors, DarkColors } from '../constants/theme';
import { loadThemeKey, saveThemeKey, loadDarkMode, saveDarkMode } from '../utils/storage';

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
  isDark: false,
  toggleDark: () => {},
  colors: Colors,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [isDark, setIsDark]    = useState(false);

  useEffect(() => {
    loadThemeKey().then((key) => {
      if (key && themes[key]) setThemeState(themes[key]);
    });
    loadDarkMode().then((dark) => {
      if (dark) setIsDark(true);
    });
  }, []);

  const setTheme = (key) => {
    if (!themes[key]) return;
    setThemeState(themes[key]);
    saveThemeKey(key);
  };

  const toggleDark = () => {
    setIsDark((prev) => {
      saveDarkMode(!prev);
      return !prev;
    });
  };

  const colors = isDark ? DarkColors : Colors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme  = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;
