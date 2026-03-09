'use client'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Zap,
  ChevronRight, Calendar, ArrowUpRight, ArrowDownLeft, RotateCcw, Bell
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import type { AppData } from '@/lib/store'
import { formatCurrency, getCurrentMonth } from '@/lib/store'
import type { TabType } from '@/components/BottomNav'

interface DashboardPageProps {
  data: AppData
  onUpdate: (data: AppData) => void
  user: { name: string; email: string }
  onNavigate: (tab: TabType) => void
}

export default function DashboardPage({ data, user, onNavigate }: DashboardPageProps) {
  const month = getCurrentMonth()
  const cur = data.currency

  const monthlyTx     = data.transactions.filter(t => t.month === month)
  const monthlyIncome = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthlySpent  = monthlyTx.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0)
  const totalSaved    = data.savingsVaults.reduce((s, v) => s + v.currentAmount, 0)
  const currentBalance = data.startOfMonthBalance + monthlyIncome - monthlySpent

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  const recent = [...data.transactions]
    .filter(t => t.month === month)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const catSpend = data.categories.map(cat => {
    const spent = data.transactions
      .filter(t => t.month === month && t.type === 'spend' && t.categoryId === cat.id)
      .reduce((s, t) => s + t.amount, 0)
    const budget = (data.monthlyBudgets[month]?.filter(b => cat.items.some(i => i.id === b.itemId)) ?? [])
      .reduce((s, b) => s + b.budget, 0) || cat.items.reduce((s, i) => s + i.budget, 0)
    return { ...cat, spent, budget }
  }).filter(c => c.budget > 0 || c.spent > 0).slice(0, 4)

  const getCategoryItem = (tx: typeof recent[0]) => {
    if (!tx.categoryId) return null
    const cat = data.categories.find(c => c.id === tx.categoryId)
    if (!cat) return null
    const item = cat.items.find(i => i.id === tx.itemId)
    return { cat, item }
  }

  return (
    <div className="pb-28">
      {/* Android-style status bar spacer */}
      <div className="h-3" />

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-3 pb-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Good {getGreeting()},
          </p>
          <h1 className="text-xl font-bold text-white leading-tight">{user.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            {monthName}
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </motion.div>

      {/* ── Balance Hero Card ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="mx-5 mb-5 rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 60%, #3730a3 100%)',
          boxShadow: '0 8px 40px rgba(99,102,241,0.45)',
        }}
      >
        {/* Top shimmer overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 15% 0%, rgba(255,255,255,0.16) 0%, transparent 65%)',
          }}
        />
        {/* Decorative circle */}
        <div
          className="absolute -right-8 -top-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute -right-2 top-12 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />

        <p className="text-white/70 text-xs font-semibold tracking-widest uppercase relative mb-1">
          Current Balance
        </p>
        <p className="text-white text-[2.2rem] font-bold tracking-tight relative mb-1 leading-tight">
          {formatCurrency(currentBalance, cur)}
        </p>
        <p className="text-white/50 text-xs relative mb-5">
          Starting: {formatCurrency(data.startOfMonthBalance, cur)}
        </p>

        <div className="grid grid-cols-3 gap-2.5 relative">
          {[
            { label: 'Income', value: formatCurrency(monthlyIncome, cur), positive: true },
            { label: 'Spent',  value: formatCurrency(monthlySpent, cur),  positive: false },
            { label: 'Saved',  value: formatCurrency(totalSaved, cur),    positive: true },
          ].map(({ label, value, positive }) => (
            <div
              key={label}
              className="rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <p className="text-white/55 text-[10px] font-semibold tracking-wide mb-0.5">{label}</p>
              <p
                className="text-sm font-bold"
                style={{ color: positive ? '#a5f3fc' : '#fda4af' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <StatCard title="Income"  value={formatCurrency(monthlyIncome, cur)}  icon={TrendingUp}  color="green"  delay={0.10} />
        <StatCard title="Spent"   value={formatCurrency(monthlySpent, cur)}   icon={TrendingDown} color="red"   delay={0.12} />
        <StatCard title="Saved"   value={formatCurrency(totalSaved, cur)}     icon={PiggyBank}   color="indigo" delay={0.14} />
        <StatCard title="Balance" value={formatCurrency(currentBalance, cur)} icon={Wallet}      color={currentBalance >= 0 ? 'green' : 'red'} delay={0.16} />
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20 }}
        className="px-5 mb-5"
      >
        <h2 className="text-sm font-bold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Add Spend',  icon: Plus,     iconColor: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.22)',  tab: 'transactions' as const },
            { label: 'Quick Bill', icon: Zap,      iconColor: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)', tab: 'transactions' as const },
            { label: 'Savings',    icon: PiggyBank, iconColor: '#22d3ee', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.22)',  tab: 'savings' as const },
          ].map(({ label, icon: Icon, iconColor, bg, border, tab }) => (
            <button
              key={label}
              onClick={() => onNavigate(tab)}
              className="rounded-2xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon style={{ color: iconColor, width: 20, height: 20 }} />
              </div>
              <span className="text-xs font-semibold text-white">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Budget Overview ─────────────────────────────────── */}
      {catSpend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="px-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Budget Overview</h2>
            <button
              onClick={() => onNavigate('budget')}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#818cf8' }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {catSpend.map((cat, i) => {
              const pct = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0
              const over = cat.budget > 0 && cat.spent > cat.budget
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 + i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p className="text-sm font-semibold text-white">{cat.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{cat.group}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: over ? '#f43f5e' : '#818cf8' }}>
                        {formatCurrency(cat.spent, cur)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>of {formatCurrency(cat.budget, cur)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.55, delay: 0.3 + i * 0.04 }}
                      className="h-full rounded-full"
                      style={{ background: over ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #818cf8)' }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Recent Transactions ─────────────────────────────── */}
      {recent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="px-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#818cf8' }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            {recent.map((tx, i) => {
              const info = getCategoryItem(tx)
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)' }}
                  >
                    {tx.type === 'income'
                      ? <ArrowDownLeft className="w-4 h-4" style={{ color: '#10b981' }} />
                      : <ArrowUpRight  className="w-4 h-4" style={{ color: '#f43f5e' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{tx.company}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {info?.item?.name ?? info?.cat?.name ?? 'Uncategorized'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: tx.type === 'income' ? '#34d399' : '#fb7185' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(tx.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {recent.length === 0 && catSpend.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="px-5 py-10 flex flex-col items-center text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <RotateCcw className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p className="text-white font-semibold mb-1">No activity yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
            Set up your budget and add transactions to get started
          </p>
          <button
            onClick={() => onNavigate('budget')}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            Set up Budget
          </button>
        </motion.div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
