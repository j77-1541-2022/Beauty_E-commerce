import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../../services/apiClient'
import { useNotification } from '../../contexts/NotificationContext'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function ResetPassword() {
  const query = useQuery()
  const navigate = useNavigate()
  const [uid, setUid] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    const _uid = query.get('uid') || ''
    const _token = query.get('token') || ''
    setUid(_uid)
    setToken(_token)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || password.length < 8) {
      showNotification('Password must be at least 8 characters', 'error')
      return
    }
    try {
      setLoading(true)
      const payload = { uid, token, new_password: password }
      await apiClient.post('/users/auth/password/reset/', payload)
      showNotification('Password reset successful. You can now log in.', 'success')
      navigate('/login')
    } catch (err) {
      console.error('Reset password error:', err)
      showNotification('Failed to reset password. The link may have expired.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h2 className="text-2xl font-semibold mb-4">Reset your password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded"
          required
        />
        <button type="submit" className={`px-4 py-2 bg-pink-600 text-white rounded ${loading ? 'opacity-60' : ''}`} disabled={loading}>
          Set new password
        </button>
      </form>
    </div>
  )
}
