import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button
        type="button"
        className={`glass-theme-btn-compact ${className}`}
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? <Sun size={17} className="theme-icon sun" /> : <Moon size={17} className="theme-icon moon" />}
      </button>
    );
  }

  return (
    <div className={`glass-theme-switch-container ${className}`}>
      <button
        type="button"
        className={`glass-theme-switch ${isDark ? 'is-dark' : 'is-light'}`}
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label={`Toggle theme (currently ${theme})`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        <span className="glass-theme-switch-indicator" aria-hidden="true" />

        <span className="glass-theme-label dark">
          <Moon size={12} />
          <span>Dark</span>
        </span>

        <span className="glass-theme-label light">
          <Sun size={12} />
          <span>Light</span>
        </span>
      </button>
    </div>
  );
};
