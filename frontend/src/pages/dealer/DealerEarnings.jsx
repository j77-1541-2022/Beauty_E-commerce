import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Area, AreaChart
} from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, PieChart as PieIcon, Send } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import { dealerAPI } from '../../services/apiClient'

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const DealerEarnings = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('bar') // 'bar' or 'line'
  const [payouts, setPayouts] = useState([])
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState(null)

  useEffect(() => {
    fetchEarnings()
    fetchPayouts()
  }, [])

  const fetchEarnings = async () => {
    try {
      const res = await dealerAPI.getEarnings()
      setData(res.data)
    } catch (err) {
      console.error('Failed to load dealer earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true)
      const res = await dealerAPI.getPayouts()
      setPayouts(res.data.payouts || [])
    } catch (err) {
      console.error('Failed to load payouts:', err)
    } finally {
      setPayoutsLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    try {
      setRequestingPayout(true)
      setPayoutMessage(null)

      const defaultAmount = Number(data?.pending_payout_ksh || 0).toFixed(2)
      const entered = window.prompt(
        `Enter payout amount in KSh (available: ${formatKSH(data?.pending_payout_ksh || 0)}):`,
        defaultAmount
      )

      if (entered === null) {
        setRequestingPayout(false)
        return
      }

      const amount = Number(String(entered).replace(/,/g, '').trim())
      if (Number.isNaN(amount) || amount <= 0) {
        setPayoutMessage({ type: 'error', text: 'Please enter a valid payout amount greater than zero.' })
        setRequestingPayout(false)
        return
      }

      const res = await dealerAPI.requestPayout({ amount })
      if (res.data.success) {
        const remaining = res.data.remaining_pending_ksh
        const suffix = remaining !== undefined ? ` Remaining pending: ${formatKSH(remaining)}.` : ''
        setPayoutMessage({ type: 'success', text: `${res.data.message}.${suffix}` })
        fetchPayouts()
        fetchEarnings()
      } else {
        setPayoutMessage({ type: 'error', text: res.data.error || 'Failed to request payout' })
      }
    } catch (err) {
      setPayoutMessage({ type: 'error', text: err.response?.data?.error || 'Failed to request payout' })
    } finally {
      setRequestingPayout(false)
    }
  }

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE')}`

  const summaryCards = data ? [
    { icon: Wallet, label: 'This Month', value: formatKSH(data.this_month_ksh), color: 'from-pink-500 to-rose-500', trend: data.monthly_breakdown?.length > 1 ? 
      ((data.this_month_ksh - (data.monthly_breakdown[data.monthly_breakdown.length - 2]?.earnings_ksh || 0)) / (data.monthly_breakdown[data.monthly_breakdown.length - 2]?.earnings_ksh || 1) * 100).toFixed(1) : null },
    { icon: TrendingUp, label: 'Last Month', value: formatKSH(data.last_month_ksh), color: 'from-emerald-500 to-teal-500', trend: null },
    { icon: Wallet, label: 'Total Lifetime', value: formatKSH(data.total_lifetime_ksh), color: 'from-blue-500 to-cyan-500', trend: null },
    { icon: Clock, label: 'Pending Payout', value: formatKSH(data.pending_payout_ksh), color: 'from-amber-500 to-orange-500', trend: null },
  ] : []

  // Prepare commission breakdown data for pie chart
  const lastSixMonths = data?.monthly_breakdown?.slice(-6) || []
  const commissionData = lastSixMonths.map((month) => ({
    name: month.month,
    earnings: month.earnings_ksh,
    commission: month.commission_ksh,
    revenue: month.revenue_ksh
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatKSH(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-8 bg-gray-200 rounded-xl w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} variant="card" />
          ))}
        </div>
        <div className="h-80 bg-gray-100 rounded-2xl" />
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600">Track your revenue and payouts</p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl">
          <p className="text-sm font-medium text-gray-700">
            Commission Rate: <span className="text-pink-600 font-bold">{data?.commission_rate}%</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Monthly Earnings (Last 6 Months)</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Line
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={lastSixMonths}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => `KSh ${(val / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="earnings_ksh" name="Earnings" fill="#ec4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission_ksh" name="Commission" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={lastSixMonths}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => `KSh ${(val / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="earnings_ksh" 
                name="Earnings" 
                stroke="#ec4899" 
                fill="#ec4899" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="commission_ksh" 
                name="Commission" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </GlassCard>

      {/* Commission vs Revenue Breakdown */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Revenue vs Commission Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={commissionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(val) => `KSh ${(val / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="commission" name="Commission" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Payout History</h2>
          <div className="flex items-center gap-2">
            {data?.pending_payout_ksh > 0 && (
              <button
                onClick={handleRequestPayout}
                disabled={requestingPayout}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
              >
                <Send className="w-4 h-4" />
                {requestingPayout ? 'Processing...' : `Request Payout (${formatKSH(data.pending_payout_ksh)})`}
              </button>
            )}
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {payouts.length > 0 ? 'Active' : 'No History'}
            </span>
          </div>
        </div>

        {payoutMessage && (
          <div className={`mb-4 p-3 rounded-lg ${payoutMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            {payoutMessage.text}
          </div>
        )}

        <div className="overflow-x-auto">
          {payoutsLoading ? (
            <div className="py-8 text-center text-slate-500">Loading payouts...</div>
          ) : payouts.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No payouts yet. Your earnings will appear here once processed.</p>
              {data?.pending_payout_ksh > 0 && (
                <p className="text-sm mt-2 text-emerald-600 font-medium">
                  You have {formatKSH(data.pending_payout_ksh)} available to withdraw!
                </p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-4 py-3 text-left text-emerald-900 font-bold">Date</th>
                  <th className="px-4 py-3 text-left text-emerald-900 font-bold">Period</th>
                  <th className="px-4 py-3 text-right text-emerald-900 font-bold">Amount</th>
                  <th className="px-4 py-3 text-center text-emerald-900 font-bold">Status</th>
                  <th className="px-4 py-3 text-left text-emerald-900 font-bold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-emerald-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">{payout.created_at}</td>
                    <td className="px-4 py-3 text-slate-700">{payout.period_start} - {payout.period_end}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">
                      KSh {payout.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        payout.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                        payout.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        payout.status === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-sm">
                      {payout.mpesa_receipt_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {payouts.length > 0 && (
          <p className="text-xs text-slate-500 mt-4 text-center">
            Payouts are processed automatically via M-Pesa. Funds typically arrive within 24 hours.
          </p>
        )}
      </GlassCard>
    </div>
  )
}

export default DealerEarnings
