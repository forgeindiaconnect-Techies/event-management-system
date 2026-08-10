import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark';

export interface Colors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  border: string;
  icon: string;
  card: string;
}

export const lightColors: Colors = {
  background: '#F4F3F6',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#6b7280',
  primary: '#7931ED',
  border: '#e5e7eb',
  icon: '#2C2636',
  card: '#F9F7FD', // Typically for trending card bg
};

export const darkColors: Colors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  primary: '#9D64FF',
  border: '#374151',
  icon: '#F9FAFB',
  card: '#2A2A2A',
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  colors: Colors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
