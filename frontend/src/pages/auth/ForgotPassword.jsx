import React, { useState } from 'react'
import apiClient from '../../services/apiClient'
import { useNotification } from '../../contexts/NotificationContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      showNotification('Please enter a valid email', 'error')
      return
    }
    try {
      setLoading(true)
      await apiClient.post('/users/auth/password/forgot/', { email })
      showNotification('If an account exists, a reset link was sent.', 'success')
      setEmail('')
    } catch (err) {
      console.error('Forgot password error:', err)
      showNotification('Failed to send reset email. Try again later.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h2 className="text-2xl font-semibold mb-4">Forgot your password?</h2>
      <p className="text-sm text-gray-600 mb-6">Enter your email and we'll send a link to reset your password.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded"
          required
        />
        <div className="flex items-center justify-between">
          <button type="submit" className={`px-4 py-2 bg-pink-600 text-white rounded ${loading ? 'opacity-60' : ''}`} disabled={loading}>
            Send reset link
          </button>
        </div>
      </form>
    </div>
  )
}
