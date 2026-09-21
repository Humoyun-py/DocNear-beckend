import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'pill' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeLabels: Record<ThemeMode, { label: string; icon: React.ReactNode }> = {
    light: {
      label: language === 'uz' ? 'Yorug‘' : language === 'ru' ? 'Светлая' : 'Light',
      icon: <Sun size={15} className="text-amber-500" />,
    },
    dark: {
      label: language === 'uz' ? 'Qorong‘i' : language === 'ru' ? 'Тёмная' : 'Dark',
      icon: <Moon size={15} className="text-indigo-400" />,
    },
    system: {
      label: language === 'uz' ? 'Tizim' : language === 'ru' ? 'Системная' : 'System',
      icon: <Laptop size={15} className="text-slate-400" />,
    },
  };

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}>
        {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
          const isCurrent = theme === mode;
          const { label, icon } = themeLabels[mode];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Change Theme"
        >
          {isDark ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
          <span>{themeLabels[theme].label}</span>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
              const isCurrent = theme === mode;
              const { label, icon } = themeLabels[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTheme(mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {icon}
                    <span>{label}</span>
                  </span>
                  {isCurrent && <Check size={13} className="text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default 'icon' button: fast toggle between light & dark
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs group ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon size={17} className="text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
