import React from 'react'
import { motion } from 'framer-motion'
import { useCurrency } from '../contexts/CurrencyContext'
import { Globe, DollarSign, Euro, PoundSterling } from 'lucide-react'

const CurrencySelector = () => {
  const { currency, currencies, changeCurrency, formatPrice } = useCurrency()

  const currencyIcons = {
    KSH: <DollarSign className="w-4 h-4" />,
    USD: <DollarSign className="w-4 h-4" />,
    EUR: <Euro className="w-4 h-4" />,
    GBP: <PoundSterling className="w-4 h-4" />
  }

  const handleCurrencyChange = (e) => {
    changeCurrency(e.target.value)
  }

  return (
    <div className="relative">
      <motion.select
        value={currency}
        onChange={handleCurrencyChange}
        className="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {Object.entries(currencies).map(([code, info]) => (
          <option key={code} value={code} className="bg-gray-800 text-white">
            {info.symbol} - {code}
          </option>
        ))}
      </motion.select>
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Globe className="w-4 h-4 text-white/70" />
      </div>
    </div>
  )
}

export default CurrencySelector
