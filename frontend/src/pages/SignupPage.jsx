import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const SignupPage = () => {
  const navigate = useNavigate()
  const { signup } = useCustomerAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const result = await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      })

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
            >
              Glow Beyond Beauty
            </motion.h1>
            <p className="text-gray-600 mt-2">Create your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="First name"
                  />
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Last name"
                  />
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Choose a username"
                />
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Min. 6 characters"
                />
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                />
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SignupPage
