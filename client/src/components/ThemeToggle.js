import React from 'react';
import { useTheme } from '../components/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      className="btn btn-outline-secondary border-0"
      onClick={toggleTheme}
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
    >
      {isDark ? (
        <i className="bi bi-sun-fill"></i> // Иконка солнца для тёмной темы
      ) : (
        <i className="bi bi-moon-fill"></i> // Иконка луны для светлой темы
      )}
    </button>
  );
};

export default ThemeToggle;