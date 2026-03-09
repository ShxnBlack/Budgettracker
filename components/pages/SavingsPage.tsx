'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, Target,
  PiggyBank, GraduationCap, TrendingUp, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { AppData, SavingsVault, SavingsTransaction } from '@/lib/store'
import { formatCurrency, generateId, VAULT_COLORS } from '@/lib/store'

interface SavingsPageProps {
  data: AppData
  onUpdate: (data: AppData) => void
}

type SubTab = 'vaults' | 'loan'

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: '#f1f5f9',
}

export default function SavingsPage({ data, onUpdate }: SavingsPageProps) {
  const [subTab,        setSubTab]        = useState<SubTab>('vaults')
  const [vaultModal,    setVaultModal]    = useState<{ open: boolean; vault?: SavingsVault }>({ open: false })
  const [transferModal, setTransferModal] = useState<{ open: boolean; vaultId?: string; type?: 'deposit' | 'withdraw' }>({ open: false })
  const [expandedVault, setExpandedVault] = useState<string | null>(null)

  const [vName, setVName]     = useState('')
  const [vTarget, setVTarget] = useState('')
  const [vMonthly, setVMonthly] = useState('')
  const [vColor, setVColor]   = useState(VAULT_COLORS[0])
  const [tAmount, setTAmount] = useState('')
  const [tNote, setTNote]     = useState('')

  const [loanTotal,  setLoanTotal]  = useState(String(data.studentLoan.totalLoan  || ''))
  const [loanStart,  setLoanStart]  = useState(data.studentLoan.termStart  || '')
  const [loanEnd,    setLoanEnd]    = useState(data.studentLoan.termEnd    || '')
  const [loanTarget, setLoanTarget] = useState(String(data.studentLoan.leftoverTarget || ''))

  const cur        = data.currency
  const totalSaved = data.savingsVaults.reduce((s, v) => s + v.currentAmount, 0)
  const totalTarget = data.savingsVaults.reduce((s, v) => s + v.targetAmount, 0)
  const monthlyIncome = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const savingsRate = monthlyIncome > 0 ? (totalSaved / monthlyIncome) * 100 : 0

  const openAddVault  = () => { setVName(''); setVTarget(''); setVMonthly(''); setVColor(VAULT_COLORS[0]); setVaultModal({ open: true }) }
  const openEditVault = (vault: SavingsVault) => { setVName(vault.name); setVTarget(String(vault.targetAmount)); setVMonthly(String(vault.monthlyContribution)); setVColor(vault.color); setVaultModal({ open: true, vault }) }
  const saveVault = () => {
    if (!vName.trim()) return
    const vault: SavingsVault = {
      id: vaultModal.vault?.id ?? generateId(), name: vName, targetAmount: parseFloat(vTarget) || 0,
      monthlyContribution: parseFloat(vMonthly) || 0, currentAmount: vaultModal.vault?.currentAmount ?? 0, color: vColor,
    }
    const vaults = vaultModal.vault ? data.savingsVaults.map(v => v.id === vault.id ? vault : v) : [...data.savingsVaults, vault]
    onUpdate({ ...data, savingsVaults: vaults }); setVaultModal({ open: false })
  }
  const deleteVault = (id: string) => {
    onUpdate({ ...data, savingsVaults: data.savingsVaults.filter(v => v.id !== id), savingsTransactions: data.savingsTransactions.filter(t => t.vaultId !== id) })
  }

  const openTransfer = (vaultId: string, type: 'deposit' | 'withdraw') => { setTAmount(''); setTNote(''); setTransferModal({ open: true, vaultId, type }) }
  const doTransfer   = () => {
    if (!tAmount || !transferModal.vaultId) return
    const amount = parseFloat(tAmount)
    if (isNaN(amount) || amount <= 0) return
    const vault = data.savingsVaults.find(v => v.id === transferModal.vaultId)!
    if (transferModal.type === 'withdraw' && amount > vault.currentAmount) return
    const newAmount = transferModal.type === 'deposit' ? vault.currentAmount + amount : vault.currentAmount - amount
    const stx: SavingsTransaction = { id: generateId(), vaultId: transferModal.vaultId!, type: transferModal.type!, amount, date: new Date().toISOString().split('T')[0], note: tNote || undefined }
    const vaults = data.savingsVaults.map(v => v.id === transferModal.vaultId ? { ...v, currentAmount: newAmount } : v)
    onUpdate({ ...data, savingsVaults: vaults, savingsTransactions: [...data.savingsTransactions, stx] })
    setTransferModal({ open: false })
  }

  const saveLoan = () => {
    onUpdate({ ...data, studentLoan: { totalLoan: parseFloat(loanTotal) || 0, termStart: loanStart, termEnd: loanEnd, leftoverTarget: parseFloat(loanTarget) || 0 } })
  }

  const loan     = data.studentLoan
  const loanCalc = (() => {
    if (!loan.termStart || !loan.termEnd || !loan.totalLoan) return null
    const start = new Date(loan.termStart + '-01')
    const end   = new Date(loan.termEnd   + '-01')
    const totalMonths     = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
    const monthlyAllowance = loan.totalLoan / totalMonths
    const now              = new Date()
    const monthsElapsed    = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
    const monthsRemaining  = Math.max(0, totalMonths - monthsElapsed)
    const termSpending     = data.transactions.filter(t => t.type === 'spend' && t.date >= loan.termStart + '-01').reduce((s, t) => s + t.amount, 0)
    const remainingLoan    = Math.max(0, loan.totalLoan - termSpending)
    return { totalMonths, monthlyAllowance, monthsElapsed, monthsRemaining, termSpending, remainingLoan }
  })()

  const getVaultTx = (vaultId: string) =>
    data.savingsTransactions.filter(t => t.vaultId === vaultId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const cardStyle: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.28)' }

  return (
    <div className="pb-28">
      <div className="h-3" />

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4">
        <h1 className="text-xl font-bold text-white mb-4">Savings</h1>
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {([['vaults', 'Savings Vaults'], ['loan', 'Student Loan']] as [SubTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setSubTab(id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={subTab === id ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' } : { color: 'var(--muted-foreground)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vaults Tab ──────────────────────────────────── */}
      {subTab === 'vaults' && (
        <div className="px-5">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Saved', value: formatCurrency(totalSaved, cur),  color: '#34d399' },
              { label: 'Target',      value: formatCurrency(totalTarget, cur), color: '#f1f5f9' },
              { label: 'Rate',        value: `${savingsRate.toFixed(1)}%`,     color: '#818cf8' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={cardStyle}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Your Vaults</h2>
            <button onClick={openAddVault}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              <Plus className="w-4 h-4" /> New Vault
            </button>
          </div>

          {data.savingsVaults.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={cardStyle}>
                <PiggyBank className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="text-white font-semibold">No savings vaults</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Create a vault to start saving towards a goal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.savingsVaults.map((vault, i) => {
                const pct       = vault.targetAmount > 0 ? Math.min((vault.currentAmount / vault.targetAmount) * 100, 100) : 0
                const vaultTx   = getVaultTx(vault.id)
                const isExpanded = expandedVault === vault.id

                return (
                  <motion.div key={vault.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl overflow-hidden" style={cardStyle}>
                    <div className="p-4">
                      {/* Vault info row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: vault.color + '22', border: `1px solid ${vault.color}44` }}>
                          <PiggyBank className="w-5 h-5" style={{ color: vault.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{vault.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {formatCurrency(vault.currentAmount, cur)} of {formatCurrency(vault.targetAmount, cur)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: vault.color }}>{pct.toFixed(0)}%</p>
                          {vault.monthlyContribution > 0 && (
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(vault.monthlyContribution, cur)}/mo</p>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-3)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.65 }}
                          className="h-full rounded-full" style={{ background: vault.color }} />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => openTransfer(vault.id, 'deposit')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                        </button>
                        <button onClick={() => openTransfer(vault.id, 'withdraw')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}>
                          <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                        </button>
                        <button onClick={() => openEditVault(vault)} className="p-2 rounded-xl" style={{ color: 'var(--muted-foreground)' }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteVault(vault.id)} className="p-2 rounded-xl" style={{ color: '#f43f5e' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setExpandedVault(isExpanded ? null : vault.id)} className="p-2 rounded-xl" style={{ color: 'var(--muted-foreground)' }}>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Transaction history */}
                    <AnimatePresence>
                      {isExpanded && vaultTx.length > 0 && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="p-3 space-y-1">
                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Recent Activity</p>
                            {vaultTx.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between py-1.5 px-2 rounded-xl"
                                style={{ background: 'var(--surface-2)' }}>
                                <div className="flex items-center gap-2">
                                  {tx.type === 'deposit'
                                    ? <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                                    : <ArrowUpRight  className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                                  }
                                  <p className="text-xs text-white">{tx.type === 'deposit' ? 'Deposit' : 'Withdraw'}</p>
                                  {tx.note && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {tx.note}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold" style={{ color: tx.type === 'deposit' ? '#34d399' : '#fbbf24' }}>
                                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                                  </p>
                                  <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{tx.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Student Loan Tab ────────────────────────────── */}
      {subTab === 'loan' && (
        <div className="px-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}>
              <GraduationCap className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Student Loan Planner</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Track your loan spending over the term</p>
            </div>
          </div>

          {/* Loan settings */}
          <div className="rounded-2xl p-4 mb-4 space-y-4" style={cardStyle}>
            <p className="text-sm font-bold text-white">Loan Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Loan',       val: loanTotal,  set: setLoanTotal,  ph: '0',         type: 'number' },
                { label: 'Leftover Target',  val: loanTarget, set: setLoanTarget, ph: '0',         type: 'number' },
                { label: 'Term Start',       val: loanStart,  set: setLoanStart,  ph: '',          type: 'month'  },
                { label: 'Term End',         val: loanEnd,    set: setLoanEnd,    ph: '',          type: 'month'  },
              ].map(({ label, val, set, ph, type }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    style={inputStyle} />
                </div>
              ))}
            </div>
            <button onClick={saveLoan}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              Save Loan Details
            </button>
          </div>

          {loanCalc ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Target,       label: 'Monthly Allowance',  value: formatCurrency(loanCalc.monthlyAllowance, cur), color: '#818cf8' },
                  { icon: TrendingUp,   label: 'Term Spending',      value: formatCurrency(loanCalc.termSpending, cur),     color: '#fbbf24' },
                  { icon: Info,         label: 'Remaining Loan',     value: formatCurrency(loanCalc.remainingLoan, cur),    color: '#34d399' },
                  { icon: GraduationCap,label: 'Months Remaining',   value: String(loanCalc.monthsRemaining),               color: '#a78bfa' },
                ].map(({ icon: Ic, label, value, color }) => (
                  <div key={label} className="rounded-2xl p-3.5" style={cardStyle}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Ic className="w-4 h-4" style={{ color }} />
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                    </div>
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Term progress */}
              <div className="rounded-2xl p-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">Term Progress</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loanCalc.monthsElapsed} / {loanCalc.totalMonths} months</p>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.min((loanCalc.monthsElapsed / loanCalc.totalMonths) * 100, 100)}%` }}
                    transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: '#a78bfa' }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.termStart}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.termEnd}</p>
                </div>
              </div>

              {/* Spending vs budget */}
              <div className="rounded-2xl p-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">Spending vs Budget</p>
                  <p className="text-xs font-bold"
                    style={{ color: loanCalc.termSpending > loan.totalLoan - loan.leftoverTarget ? '#f43f5e' : '#34d399' }}>
                    {loanCalc.termSpending > loan.totalLoan - loan.leftoverTarget ? 'Over budget' : 'On track'}
                  </p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.min((loanCalc.termSpending / Math.max(loan.totalLoan - loan.leftoverTarget, 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.6 }} className="h-full rounded-full"
                    style={{ background: loanCalc.termSpending > loan.totalLoan - loan.leftoverTarget ? '#f43f5e' : '#34d399' }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Spent: {formatCurrency(loanCalc.termSpending, cur)}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Budget: {formatCurrency(loan.totalLoan - loan.leftoverTarget, cur)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center text-center rounded-2xl" style={cardStyle}>
              <GraduationCap className="w-10 h-10 mb-2" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-white font-semibold">Fill in your loan details</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Set your loan amount and term dates above</p>
            </div>
          )}
        </div>
      )}

      {/* ── Vault Modal ──────────────────────────────────── */}
      <Modal open={vaultModal.open} onClose={() => setVaultModal({ open: false })} title={vaultModal.vault ? 'Edit Vault' : 'New Savings Vault'}>
        <div className="space-y-4">
          {[
            { label: 'Vault Name',            val: vName,    set: setVName,    ph: 'e.g. Emergency Fund', type: 'text',   pre: '' },
            { label: 'Target Amount',         val: vTarget,  set: setVTarget,  ph: '0.00',                type: 'number', pre: '$' },
            { label: 'Monthly Contribution',  val: vMonthly, set: setVMonthly, ph: '0.00',                type: 'number', pre: '$' },
          ].map(({ label, val, set, ph, type, pre }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
              <div className="relative">
                {pre && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>{pre}</span>}
                <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} min="0" step="0.01"
                  className={`w-full ${pre ? 'pl-8' : 'px-4'} pr-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                  style={inputStyle} />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {VAULT_COLORS.map(c => (
                <button key={c} onClick={() => setVColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${vColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#0e0e16]' : ''}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties} />
              ))}
            </div>
          </div>
          <button onClick={saveVault} disabled={!vName.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {vaultModal.vault ? 'Save Changes' : 'Create Vault'}
          </button>
        </div>
      </Modal>

      {/* ── Transfer Modal ───────────────────────────────── */}
      <Modal open={transferModal.open} onClose={() => setTransferModal({ open: false })}
        title={transferModal.type === 'deposit' ? 'Deposit to Vault' : 'Withdraw from Vault'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>$</span>
              <input type="number" value={tAmount} onChange={e => setTAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" autoFocus
                className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Note (optional)</label>
            <input type="text" value={tNote} onChange={e => setTNote(e.target.value)} placeholder="e.g. Monthly savings"
              className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              style={inputStyle} />
          </div>
          <button onClick={doTransfer} disabled={!tAmount || parseFloat(tAmount) <= 0}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: transferModal.type === 'deposit' ? '#10b981' : '#f59e0b', boxShadow: `0 4px 14px ${transferModal.type === 'deposit' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
            {transferModal.type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
