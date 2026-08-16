'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ThemeContext = createContext();

export const themes = {
  light: {
    name: 'Light',
    primary: 'indigo',
    background: 'white',
    surface: 'gray-50',
    text: 'gray-900',
    textSecondary: 'gray-600',
    border: 'gray-200',
  },
  dark: {
    name: 'Dark',
    primary: 'indigo',
    background: 'gray-900',
    surface: 'gray-800',
    text: 'white',
    textSecondary: 'gray-300',
    border: 'gray-700',
  },
  blue: {
    name: 'Ocean Blue',
    primary: 'blue',
    background: 'white',
    surface: 'blue-50',
    text: 'gray-900',
    textSecondary: 'blue-600',
    border: 'blue-200',
  },
  green: {
    name: 'Nature Green',
    primary: 'green',
    background: 'white',
    surface: 'green-50',
    text: 'gray-900',
    textSecondary: 'green-600',
    border: 'green-200',
  },
  purple: {
    name: 'Royal Purple',
    primary: 'purple',
    background: 'white',
    surface: 'purple-50',
    text: 'gray-900',
    textSecondary: 'purple-600',
    border: 'purple-200',
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'orange',
    background: 'white',
    surface: 'orange-50',
    text: 'gray-900',
    textSecondary: 'orange-600',
    border: 'orange-200',
  },
};

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const [currentTheme, setCurrentTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Determine if we're in admin section
  const isAdminSection = pathname?.startsWith('/admin') || pathname?.startsWith('/login/admin');
  const isManufacturerSection = pathname?.startsWith('/manufacturer');
  const isResellerSection = pathname?.startsWith('/reseller');

  useEffect(() => {
    // Load appropriate theme based on section
    let savedTheme;
    if (isAdminSection) {
      savedTheme = localStorage.getItem('adminTheme') || 'light';
    } else if (isManufacturerSection) {
      savedTheme = localStorage.getItem('manufacturerTheme') || 'light';
    } else if (isResellerSection) {
      savedTheme = localStorage.getItem('resellerTheme') || 'light';
    } else {
      // Public pages always use light theme
      savedTheme = 'light';
    }
    
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);
  }, [isAdminSection, isManufacturerSection, isResellerSection]);

  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;

    // Apply CSS custom properties
    root.setAttribute('data-theme', themeName);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeName === 'dark' ? '#111827' : '#ffffff');
    }
  };

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    
    // Save to appropriate localStorage key based on section
    if (isAdminSection) {
      localStorage.setItem('adminTheme', themeName);
    } else if (isManufacturerSection) {
      localStorage.setItem('manufacturerTheme', themeName);
    } else if (isResellerSection) {
      localStorage.setItem('resellerTheme', themeName);
    }
    // Don't save theme for public pages
    
    applyTheme(themeName);
  };

  const resetToLightTheme = () => {
    setCurrentTheme('light');
    applyTheme('light');
  };

  const value = {
    theme: currentTheme,
    themeConfig: themes[currentTheme],
    themes,
    changeTheme,
    resetToLightTheme,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
