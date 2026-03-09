'use client'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendPositive?: boolean
  color?: 'green' | 'red' | 'blue' | 'indigo' | 'amber' | 'purple'
  delay?: number
}

const colorMap: Record<string, { iconBg: string; iconColor: string; valueColor: string; border: string; glow: string }> = {
  green:  { iconBg: 'rgba(16,185,129,0.12)',  iconColor: '#10b981', valueColor: '#34d399', border: 'rgba(16,185,129,0.18)',  glow: 'rgba(16,185,129,0.08)'  },
  red:    { iconBg: 'rgba(244,63,94,0.12)',   iconColor: '#f43f5e', valueColor: '#fb7185', border: 'rgba(244,63,94,0.18)',   glow: 'rgba(244,63,94,0.08)'   },
  blue:   { iconBg: 'rgba(6,182,212,0.12)',   iconColor: '#06b6d4', valueColor: '#22d3ee', border: 'rgba(6,182,212,0.18)',   glow: 'rgba(6,182,212,0.08)'   },
  indigo: { iconBg: 'rgba(99,102,241,0.12)',  iconColor: '#6366f1', valueColor: '#818cf8', border: 'rgba(99,102,241,0.22)',  glow: 'rgba(99,102,241,0.10)'  },
  amber:  { iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#f59e0b', valueColor: '#fbbf24', border: 'rgba(245,158,11,0.18)',  glow: 'rgba(245,158,11,0.08)'  },
  purple: { iconBg: 'rgba(139,92,246,0.12)',  iconColor: '#8b5cf6', valueColor: '#a78bfa', border: 'rgba(139,92,246,0.18)',  glow: 'rgba(139,92,246,0.08)'  },
}

export default function StatCard({
  title, value, icon: Icon, trend, trendPositive, color = 'indigo', delay = 0
}: StatCardProps) {
  const c = colorMap[color] ?? colorMap.indigo
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay, ease: 'easeOut' }}
      className="rounded-2xl p-4"
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${c.border}`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.30), 0 0 0 0 ${c.glow}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: c.iconBg }}
        >
          <Icon style={{ color: c.iconColor, width: 18, height: 18 }} />
        </div>
        {trend && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
            style={
              trendPositive
                ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                : { background: 'rgba(244,63,94,0.12)',  color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)'  }
            }
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold tracking-widest mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
        {title.toUpperCase()}
      </p>
      <p className="text-[17px] font-bold leading-tight" style={{ color: c.valueColor }}>
        {value}
      </p>
    </motion.div>
  )
}
