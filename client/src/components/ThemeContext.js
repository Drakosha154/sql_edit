import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // По умолчанию тёмная тема

  useEffect(() => {
    // Проверяем сохранённую тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const themeIsDark = savedTheme === 'dark';
      setIsDark(themeIsDark);
      applyTheme(themeIsDark);
    } else {
      applyTheme(true); // Применяем тёмную тему по умолчанию
    }
  }, []);

  const applyTheme = (dark) => {
    const theme = dark ? 'dark' : 'light';
    document.body.setAttribute('data-bs-theme', theme);
    
    // Также добавляем класс к root элементу для кастомных CSS
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      applyTheme(newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);