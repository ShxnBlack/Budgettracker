'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Moon, Sun, DollarSign, Download, Upload, LogOut,
  Wallet, ChevronDown, Check, AlertTriangle, Shield,
  Database, Palette, User
} from 'lucide-react'
import type { AppData } from '@/lib/store'
import { CURRENCIES, formatCurrency, getCurrentMonth } from '@/lib/store'

interface SettingsPageProps {
  data: AppData
  onUpdate: (data: AppData) => void
  onLogout: () => void
  user: { name: string; email: string }
}

export default function SettingsPage({ data, onUpdate, onLogout, user }: SettingsPageProps) {
  const [showCurrencyList, setShowCurrencyList] = useState(false)
  const [importError, setImportError]     = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [balanceInput, setBalanceInput]   = useState(String(data.startOfMonthBalance))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDark = data.theme === 'dark'
  const cur    = data.currency

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    onUpdate({ ...data, theme: next })
    if (typeof document !== 'undefined')
      document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const setCurrency = (c: string) => { onUpdate({ ...data, currency: c }); setShowCurrencyList(false) }

  const saveBalance = () => onUpdate({ ...data, startOfMonthBalance: parseFloat(balanceInput) || 0 })

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `pocketbudget-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImportError(''); setImportSuccess(false)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        onUpdate(JSON.parse(ev.target?.result as string))
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch { setImportError('Invalid file. Please export from PocketBudget first.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const month      = getCurrentMonth()
  const txCount    = data.transactions.filter(t => t.month === month).length
  const catCount   = data.categories.length
  const vaultCount = data.savingsVaults.length
  const billCount  = data.recurringBills.length

  return (
    <div className="pb-28">
      {/* Android-style status area */}
      <div className="h-3 bg-transparent" />

      {/* Header */}
      <div className="px-4 pb-5 pt-2 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <User className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your preferences</p>
        </div>
      </div>

      {/* ── Profile card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-4 bg-[#1e2038] rounded-2xl p-4 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          {[
            { label: 'Tx', value: txCount },
            { label: 'Cats', value: catCount },
            { label: 'Vaults', value: vaultCount },
            { label: 'Bills', value: billCount },
          ].map(s => (
            <div key={s.label} className="text-center bg-[#252844] rounded-xl py-2">
              <p className="text-base font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Starting Balance ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="mx-4 mb-4 bg-[#1e2038] rounded-2xl border border-white/[0.06]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <Wallet className="w-4 h-4 text-indigo-400" />
          <p className="text-sm font-semibold text-white">Starting Balance</p>
          <span className="ml-auto text-xs text-slate-500">{formatCurrency(data.startOfMonthBalance, cur)}</span>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3">Your balance at the start of the month before income or spending.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{cur}</span>
              <input
                type="number"
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                onBlur={saveBalance}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#252844] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>
            <button
              onClick={saveBalance}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Appearance ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="mx-4 mb-4 bg-[#1e2038] rounded-2xl border border-white/[0.06]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <Palette className="w-4 h-4 text-violet-400" />
          <p className="text-sm font-semibold text-white">Appearance</p>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/15' : 'bg-amber-500/15'}`}>
              {isDark
                ? <Moon className="w-4 h-4 text-indigo-400" />
                : <Sun className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dark Mode</p>
              <p className="text-xs text-slate-500">{isDark ? 'Currently dark' : 'Currently light'}</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isDark ? 'bg-indigo-600' : 'bg-slate-600'}`}
          >
            <motion.div
              animate={{ x: isDark ? 26 : 2 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </motion.div>

      {/* ── Currency ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="mx-4 mb-4 bg-[#1e2038] rounded-2xl border border-white/[0.06]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <p className="text-sm font-semibold text-white">Currency</p>
        </div>
        <div className="p-4">
          <button
            onClick={() => setShowCurrencyList(!showCurrencyList)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#252844] border border-white/[0.08] hover:border-indigo-500/40 transition-all"
          >
            <span className="text-sm font-medium text-white">{cur}</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showCurrencyList ? 'rotate-180' : ''}`} />
          </button>

          {showCurrencyList && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-between px-3 ${
                    cur === c
                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                      : 'border-white/[0.06] bg-[#252844] text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span>{c}</span>
                  {cur === c && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Data Management ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
        className="mx-4 mb-4 bg-[#1e2038] rounded-2xl border border-white/[0.06]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <Database className="w-4 h-4 text-sky-400" />
          <p className="text-sm font-semibold text-white">Data Management</p>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={exportData}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#252844] border border-white/[0.06] hover:border-sky-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
              <Download className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Export Backup</p>
              <p className="text-xs text-slate-500">Download all data as JSON</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#252844] border border-white/[0.06] hover:border-emerald-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Import Backup</p>
              <p className="text-xs text-slate-500">Restore from a JSON file</p>
            </div>
          </button>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          {importError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-400">{importError}</p>
            </div>
          )}
          {importSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">Data imported successfully!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── About ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="mx-4 mb-5 bg-[#1e2038] rounded-2xl p-4 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">PocketBudget</p>
            <p className="text-xs text-slate-500">v1.0.0 · Personal Finance Tracker</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Local only</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          All your financial data is stored entirely on this device. Nothing is sent to any server.
        </p>
      </motion.div>

      {/* ── Sign Out ─────────────────────────────────────── */}
      <div className="px-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-sm hover:bg-rose-500/15 transition-colors active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
