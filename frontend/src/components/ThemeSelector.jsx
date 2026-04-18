import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { Palette, Check } from 'lucide-react'

const ThemeSelector = () => {
  const { theme, themes, changeTheme } = useTheme()

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center">
        <Palette className="w-4 h-4 mr-2" />
        Select Theme
      </h3>
      <div className="space-y-2">
        {Object.entries(themes).map(([key, themeData]) => (
          <motion.button
            key={key}
            onClick={() => changeTheme(key)}
            className={`w-full flex items-center p-3 rounded-lg border transition-all ${
              theme === key
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Color preview */}
            <div className={`w-8 h-8 rounded-full mr-3 bg-gradient-to-r ${themeData.primary}`} />
            
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">{themeData.name}</p>
            </div>
            
            {theme === key && (
              <Check className="w-5 h-5 text-amber-600" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default ThemeSelector
