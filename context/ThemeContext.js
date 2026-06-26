import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme } from '../constants/theme';
import { loadThemeKey, saveThemeKey } from '../utils/storage';

const ThemeContext = createContext({ theme: defaultTheme, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(defaultTheme);

  useEffect(() => {
    loadThemeKey().then((key) => {
      if (key && themes[key]) setThemeState(themes[key]);
    });
  }, []);

  const setTheme = (key) => {
    if (!themes[key]) return;
    setThemeState(themes[key]);
    saveThemeKey(key);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
