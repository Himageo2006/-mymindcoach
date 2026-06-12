import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/colors';

const THEME_KEY = 'app_theme';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  Colors: LightColors,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, Colors: isDark ? DarkColors : LightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors() {
  return useContext(ThemeContext).Colors;
}

export function useTheme() {
  return useContext(ThemeContext);
}
