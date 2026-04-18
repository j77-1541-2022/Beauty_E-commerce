import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, CheckCircle, Clock, Save, Building2, Phone, MapPin, Mail, Calendar } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useNotification } from '../../contexts/NotificationContext'
import { dealerAPI } from '../../services/apiClient'

const DealerProfile = () => {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    business_name: '',
    business_phone: '',
    location: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await dealerAPI.getProfile()
      setProfile(res.data)
      setFormData({
        business_name: res.data.business_name || '',
        business_phone: res.data.business_phone || '',
        location: res.data.location || ''
      })
    } catch (err) {
      console.error('Failed to fetch dealer profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await dealerAPI.updateProfile(formData)
      showNotification('Profile updated successfully', 'success')
      fetchProfile()
    } catch (err) {
      showNotification('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Profile</h1>
        <p className="text-gray-600">Manage your business information</p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile?.business_name || 'Your Business'}</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile?.is_verified ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter business name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="+254 XXX XXX XXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Nairobi, Kenya"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </motion.button>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Email</span>
            </div>
            <span className="font-medium">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Commission Rate</span>
            </div>
            <span className="font-medium">{profile?.commission_rate}%</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Member Since</span>
            </div>
            <span className="font-medium">
              {profile?.member_since ? new Date(profile.member_since).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Public Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{profile?.email || profile?.business_email || '-'}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phone</p>
            <p className="font-medium text-gray-900">{profile?.phone || profile?.business_phone || '-'}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Products</p>
            <p className="font-medium text-gray-900">{profile?.total_products ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Member Since</p>
            <p className="font-medium text-gray-900">{profile?.member_since ? new Date(profile.member_since).toLocaleDateString() : '-'}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Address</p>
            <p className="font-medium text-gray-900">{profile?.full_address || profile?.location || '-'}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Coordinates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Latitude</p>
            <p className="font-medium text-gray-900">{profile?.latitude ?? '-'}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Longitude</p>
            <p className="font-medium text-gray-900">{profile?.longitude ?? '-'}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export default DealerProfile
