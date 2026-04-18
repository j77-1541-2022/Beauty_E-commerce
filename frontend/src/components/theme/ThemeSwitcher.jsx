import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Moon, Sun, Droplets, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const themeIcons = {
  light: Sun,
  dark: Moon,
  blue: Droplets,
  'rose-gold': Sparkles,
};

const themeColors = {
  light: 'from-pink-500 to-purple-500',
  dark: 'from-gray-700 to-gray-900',
  blue: 'from-blue-500 to-cyan-500',
  'rose-gold': 'from-rose-400 to-amber-400',
};

export const ThemeSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, themes, changeTheme, currentTheme } = useTheme();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
    setIsOpen(false);
  };

  const CurrentIcon = themeIcons[theme] || Palette;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-gray-300 hover:text-white"
        aria-label="Change theme"
        title="Change theme"
      >
        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${themeColors[theme]} flex items-center justify-center`}>
          <CurrentIcon className="w-3 h-3 text-white" />
        </div>
        <span className="hidden sm:inline text-sm">{currentTheme.name}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
              <h3 className="font-medium text-white text-sm">Select Theme</h3>
            </div>
            
            <div className="p-2">
              {Object.entries(themes).map(([key, themeData]) => {
                const IconComponent = themeIcons[key] || Palette;
                const isActive = theme === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${themeColors[key]} flex items-center justify-center`}>
                      <IconComponent className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm flex-1">{themeData.name}</span>
                    {isActive && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
