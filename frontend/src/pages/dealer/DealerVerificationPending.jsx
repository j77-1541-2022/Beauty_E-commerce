import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Clock } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'

const DealerVerificationPending = () => {
  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center py-12 px-4">
      <GlassCard className="max-w-3xl w-full p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dealer Verification Pending</h1>
        <p className="text-gray-600 mb-6">
          Thanks for joining Glow Beyond Beauty. Your dealer account is under review and will be verified shortly.
          Once approved, you will be able to access the dealer portal and manage inventory, orders, and earnings.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Continue Shopping
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
          >
            Sign Out and Return
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <div className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Processing typically takes 1-2 business days.
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export default DealerVerificationPending
