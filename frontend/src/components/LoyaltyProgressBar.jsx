import React from 'react'
import { motion } from 'framer-motion'
import {
  Crown,
  Star,
  Gift,
  Award,
  Sparkles,
  TrendingUp
} from 'lucide-react'

const LoyaltyProgressBar = ({ currentPoints, totalPoints, nextTierPoints, currentTier, nextTier }) => {
  const progressPercentage = (currentPoints / nextTierPoints) * 100
  const pointsToNextTier = nextTierPoints - currentPoints

  const tiers = [
    { name: 'Bronze', icon: <Star className="w-4 h-4" />, color: 'from-amber-600 to-amber-400', required: 0 },
    { name: 'Silver', icon: <Award className="w-4 h-4" />, color: 'from-gray-400 to-gray-200', required: 100 },
    { name: 'Gold', icon: <Crown className="w-4 h-4" />, color: 'from-yellow-500 to-yellow-300', required: 500 },
    { name: 'Platinum', icon: <Gift className="w-4 h-4" />, color: 'from-purple-500 to-purple-300', required: 1000 },
    { name: 'Diamond', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-500 to-cyan-300', required: 2500 }
  ]

  const currentTierIndex = tiers.findIndex(tier => tier.name === currentTier)
  const nextTierIndex = currentTierIndex + 1
  const nextTierData = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null

  const benefits = [
    { tier: 'Bronze', benefits: ['5% cashback', 'Free shipping on orders over $50', 'Birthday bonus'] },
    { tier: 'Silver', benefits: ['10% cashback', 'Free shipping on all orders', 'Early access to sales', 'Birthday bonus'] },
    { tier: 'Gold', benefits: ['15% cashback', 'Free express shipping', 'Exclusive products access', 'Personalized recommendations'] },
    { tier: 'Platinum', benefits: ['20% cashback', 'Free overnight shipping', 'VIP customer service', 'Exclusive events', 'Personal beauty consultant'] },
    { tier: 'Diamond', benefits: ['25% cashback', 'Free worldwide shipping', 'Concierge service', 'Exclusive product launches', 'Invitation to beauty events'] }
  ]

  const currentBenefits = benefits.find(b => b.tier === currentTier)?.benefits || []

  return (
    <div className="space-y-6">
      {/* Current Tier Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r bg-clip-text text-transparent mb-4">
          <div className={`w-full h-full rounded-full bg-gradient-to-r ${tiers[currentTierIndex].color} flex items-center justify-center`}>
            {tiers[currentTierIndex].icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{currentTier} Member</h3>
        <p className="text-purple-200">You have {currentPoints} points</p>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-200">Progress to {nextTierData?.name || 'Max Tier'}</span>
          <span className="text-white font-medium">{pointsToNextTier} points to go</span>
        </div>
        
        <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 right-2 w-3 h-3 bg-white rounded-full"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-purple-300">
          <span>{currentPoints}</span>
          <span>{nextTierPoints}</span>
        </div>
      </div>

      {/* Tier Milestones */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white mb-4">Your Journey</h4>
        <div className="space-y-2">
          {tiers.map((tier, index) => {
            const isCompleted = index <= currentTierIndex
            const isCurrent = index === currentTierIndex
            
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrent 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : isCompleted
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                    {tier.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tier.name}</p>
                    <p className="text-purple-300 text-sm">{tier.required} points</p>
                  </div>
                </div>
                {isCompleted && (
                  <div className="flex items-center space-x-2">
                    {isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      </motion.div>
                    ) : (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Current Benefits */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Current Benefits</h4>
        <div className="grid grid-cols-1 gap-3">
          {currentBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Points Earned This Month */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Points Earned This Month</p>
            <p className="text-purple-200 text-sm">Keep shopping to earn more!</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">+{Math.floor(currentPoints * 0.1)}</p>
            <p className="text-xs text-purple-300">This month</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoyaltyProgressBar
