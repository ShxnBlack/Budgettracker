'use client'
import { motion } from 'framer-motion'
import { LayoutDashboard, PieChart, ArrowLeftRight, PiggyBank, BarChart3, Settings } from 'lucide-react'

export type TabType = 'dashboard' | 'budget' | 'transactions' | 'savings' | 'analytics' | 'settings'

interface BottomNavProps {
  active: TabType
  onChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard',     label: 'Home',    icon: LayoutDashboard },
  { id: 'budget',        label: 'Budget',  icon: PieChart },
  { id: 'transactions',  label: 'Spend',   icon: ArrowLeftRight },
  { id: 'savings',       label: 'Savings', icon: PiggyBank },
  { id: 'analytics',     label: 'Insights',icon: BarChart3 },
  { id: 'settings',      label: 'Settings',icon: Settings },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(14,14,22,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1.5 px-0.5 rounded-xl transition-all relative"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.22)' }}
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors relative z-10 ${isActive ? '' : ''}`}
                style={{
                  color: isActive ? '#6366f1' : '#475569',
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(99,102,241,0.55))' : 'none',
                }}
              />
              <span
                className="text-[9px] font-semibold transition-colors relative z-10 leading-tight tracking-wide"
                style={{ color: isActive ? '#6366f1' : '#475569' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
