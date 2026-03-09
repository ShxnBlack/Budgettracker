'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { TrendingDown, TrendingUp, BarChart3, Activity } from 'lucide-react'
import type { AppData } from '@/lib/store'
import { formatCurrency, getCurrentMonth } from '@/lib/store'

interface AnalyticsPageProps {
  data: AppData
}

// Vivid chart palette: indigo, emerald, amber, rose, violet, cyan
const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

export default function AnalyticsPage({ data }: AnalyticsPageProps) {
  const month = getCurrentMonth()
  const cur   = data.currency

  const pieData = useMemo(() => data.categories
    .map(cat => ({
      name: cat.name,
      value: data.transactions.filter(t => t.month === month && t.type === 'spend' && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value),
    [data, month]
  )

  const barData = useMemo(() => data.categories
    .map(cat => ({
      name: cat.name.length > 9 ? cat.name.slice(0, 9) + '…' : cat.name,
      spent:  data.transactions.filter(t => t.month === month && t.type === 'spend' && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0),
      budget: cat.items.reduce((s, i) => s + i.budget, 0),
    }))
    .filter(d => d.budget > 0 || d.spent > 0),
    [data, month]
  )

  const trendData = useMemo(() => {
    const months: { month: string; label: string; income: number; spent: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const m     = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('default', { month: 'short' })
      months.push({
        month: m, label,
        income: data.transactions.filter(t => t.month === m && t.type === 'income').reduce((s, t) => s + t.amount, 0),
        spent:  data.transactions.filter(t => t.month === m && t.type === 'spend').reduce((s, t) => s + t.amount, 0),
      })
    }
    return months
  }, [data])

  const totalSpent  = data.transactions.filter(t => t.month === month && t.type === 'spend').reduce((s, t) => s + t.amount, 0)
  const totalIncome = data.transactions.filter(t => t.month === month && t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const netFlow     = totalIncome - totalSpent
  const topCategory = pieData[0]
  const topPct      = totalSpent > 0 && topCategory ? ((topCategory.value / totalSpent) * 100).toFixed(1) : '0'

  const cardStyle: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.28)' }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string }> }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-2xl p-3 shadow-2xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill ?? '#6366f1' }} />
            <span style={{ color: 'var(--muted-foreground)' }}>{p.name}:</span>
            <span className="font-bold text-white">{formatCurrency(p.value, cur)}</span>
          </div>
        ))}
      </div>
    )
  }

  const PieCustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (!active || !payload?.length) return null
    const pct = totalSpent > 0 ? ((payload[0].value / totalSpent) * 100).toFixed(1) : '0'
    return (
      <div className="rounded-2xl p-3 shadow-2xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold text-white">{payload[0].name}</p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(payload[0].value, cur)} ({pct}%)</p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <div className="h-3" />

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Summary row ─────────────────────────────────── */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: TrendingUp,  label: 'Income',   value: formatCurrency(totalIncome, cur), color: '#34d399', bg: 'rgba(16,185,129,0.12)',  delay: 0.05 },
          { icon: TrendingDown,label: 'Spent',    value: formatCurrency(totalSpent, cur),  color: '#fb7185', bg: 'rgba(244,63,94,0.12)',   delay: 0.08 },
          { icon: Activity,    label: 'Net Flow', value: formatCurrency(netFlow, cur),     color: netFlow >= 0 ? '#818cf8' : '#fbbf24', bg: netFlow >= 0 ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)', delay: 0.11 },
        ].map(({ icon: Ic, label, value, color, bg, delay }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className="rounded-2xl p-3.5" style={cardStyle}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Ic className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Spending by Category (Pie) ───────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="mx-5 mb-5 rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4" style={{ color: '#818cf8' }} />
          <p className="text-sm font-bold text-white">Spending by Category</p>
        </div>
        {pieData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No spending data for this month
          </div>
        ) : (
          <>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                    {pieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieCustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {pieData.slice(0, 7).map((d, i) => {
                const pct = totalSpent > 0 ? ((d.value / totalSpent) * 100).toFixed(1) : '0'
                return (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-white">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
                      <span className="text-xs font-semibold text-white">{formatCurrency(d.value, cur)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Spending vs Budget (Bar) ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="mx-5 mb-5 rounded-2xl p-4" style={cardStyle}>
        <p className="text-sm font-bold text-white mb-4">Spending vs Budget</p>
        {barData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Set up budgets to see comparison
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#64748b' }} />
                <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent"  name="Spent"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* ── 6-Month Trend ────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="mx-5 mb-5 rounded-2xl p-4" style={cardStyle}>
        <p className="text-sm font-bold text-white mb-4">6-Month Trend</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#64748b' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent"  name="Spent"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Insights ─────────────────────────────────────── */}
      {topCategory && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          className="mx-5 mb-5 rounded-2xl p-4" style={cardStyle}>
          <p className="text-sm font-bold text-white mb-3">Insights</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <TrendingDown className="w-4 h-4 flex-shrink-0" style={{ color: '#fbbf24' }} />
              <p className="text-xs text-white">
                <span className="font-bold">{topCategory.name}</span> is your biggest expense at{' '}
                <span className="font-bold" style={{ color: '#fbbf24' }}>{topPct}%</span> of total spending
              </p>
            </div>
            {netFlow < 0 && (
              <div className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)' }}>
                <Activity className="w-4 h-4 flex-shrink-0" style={{ color: '#fb7185' }} />
                <p className="text-xs text-white">
                  You are spending{' '}
                  <span className="font-bold" style={{ color: '#fb7185' }}>{formatCurrency(Math.abs(netFlow), cur)}</span>{' '}
                  more than you earn this month
                </p>
              </div>
            )}
            {netFlow >= 0 && totalIncome > 0 && (
              <div className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
                <p className="text-xs text-white">
                  You are saving{' '}
                  <span className="font-bold" style={{ color: '#34d399' }}>{((netFlow / totalIncome) * 100).toFixed(1)}%</span>{' '}
                  of your income this month
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
