'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Trash2, Edit2, ArrowUpRight, ArrowDownLeft,
  Zap, RotateCcw, Filter, ChevronDown, X
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { AppData, Transaction, QuickBill, RecurringBill, RecurringFrequency } from '@/lib/store'
import { formatCurrency, getCurrentMonth, generateId } from '@/lib/store'

interface TransactionsPageProps {
  data: AppData
  onUpdate: (data: AppData) => void
}

type SubTab = 'all' | 'quick' | 'recurring'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: '#f1f5f9',
}
const selectStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: '#f1f5f9',
}

export default function TransactionsPage({ data, onUpdate }: TransactionsPageProps) {
  const month = getCurrentMonth()
  const cur   = data.currency
  const [subTab,     setSubTab]     = useState<SubTab>('all')
  const [search,     setSearch]     = useState('')
  const [filterType, setFilterType] = useState<'all' | 'spend' | 'income'>('all')
  const [txModal,    setTxModal]    = useState<{ open: boolean; tx?: Transaction; isIncome?: boolean }>({ open: false })
  const [quickModal, setQuickModal] = useState<{ open: boolean; bill?: QuickBill }>({ open: false })
  const [recurModal, setRecurModal] = useState<{ open: boolean; bill?: RecurringBill }>({ open: false })

  const [txType,    setTxType]    = useState<'spend' | 'income'>('spend')
  const [txCompany, setTxCompany] = useState('')
  const [txCatId,   setTxCatId]   = useState('')
  const [txItemId,  setTxItemId]  = useState('')
  const [txAmount,  setTxAmount]  = useState('')
  const [txDate,    setTxDate]    = useState(new Date().toISOString().split('T')[0])
  const [txNotes,   setTxNotes]   = useState('')

  const [qLabel, setQLabel] = useState('')
  const [qCompany, setQCompany] = useState('')
  const [qCatId, setQCatId] = useState('')
  const [qItemId, setQItemId] = useState('')
  const [qAmount, setQAmount] = useState('')
  const [qNotes, setQNotes]   = useState('')

  const [rName, setRName]   = useState('')
  const [rCompany, setRCompany] = useState('')
  const [rCatId,   setRCatId]   = useState('')
  const [rItemId,  setRItemId]  = useState('')
  const [rAmount,  setRAmount]  = useState('')
  const [rNotes,   setRNotes]   = useState('')
  const [rFreq,    setRFreq]    = useState<RecurringFrequency>('monthly')
  const [rDueDate, setRDueDate] = useState('1')
  const [rDueMonth, setRDueMonth] = useState('1')
  const [rActive,  setRActive]  = useState(true)

  const filteredTx = useMemo(() =>
    data.transactions
      .filter(t => t.month === month)
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => !search || t.company.toLowerCase().includes(search.toLowerCase()) || (t.notes ?? '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data.transactions, month, search, filterType]
  )

  const selectedCatItems  = txCatId ? data.categories.find(c => c.id === txCatId)?.items ?? [] : []
  const qSelectedCatItems = qCatId  ? data.categories.find(c => c.id === qCatId)?.items  ?? [] : []
  const rSelectedCatItems = rCatId  ? data.categories.find(c => c.id === rCatId)?.items  ?? [] : []

  const openAddTx  = (isIncome = false) => {
    setTxType(isIncome ? 'income' : 'spend'); setTxCompany(''); setTxCatId(''); setTxItemId('')
    setTxAmount(''); setTxDate(new Date().toISOString().split('T')[0]); setTxNotes('')
    setTxModal({ open: true, isIncome })
  }
  const openEditTx = (tx: Transaction) => {
    setTxType(tx.type); setTxCompany(tx.company); setTxCatId(tx.categoryId ?? ''); setTxItemId(tx.itemId ?? '')
    setTxAmount(String(tx.amount)); setTxDate(tx.date); setTxNotes(tx.notes ?? '')
    setTxModal({ open: true, tx })
  }
  const saveTx = () => {
    if (!txCompany.trim() || !txAmount) return
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) return
    const date_ = txDate || new Date().toISOString().split('T')[0]
    const tx: Transaction = {
      id: txModal.tx?.id ?? generateId(), type: txType, company: txCompany,
      categoryId: txCatId || undefined, itemId: txItemId || undefined,
      amount, date: date_, notes: txNotes || undefined, month: date_.slice(0, 7),
    }
    const txs = txModal.tx ? data.transactions.map(t => t.id === tx.id ? tx : t) : [...data.transactions, tx]
    onUpdate({ ...data, transactions: txs })
    setTxModal({ open: false })
  }
  const deleteTx = (id: string) => onUpdate({ ...data, transactions: data.transactions.filter(t => t.id !== id) })

  const openAddQuick  = () => { setQLabel(''); setQCompany(''); setQCatId(''); setQItemId(''); setQAmount(''); setQNotes(''); setQuickModal({ open: true }) }
  const openEditQuick = (bill: QuickBill) => {
    setQLabel(bill.label); setQCompany(bill.company); setQCatId(bill.categoryId ?? ''); setQItemId(bill.itemId ?? '')
    setQAmount(String(bill.amount)); setQNotes(bill.notes ?? ''); setQuickModal({ open: true, bill })
  }
  const saveQuick = () => {
    if (!qLabel.trim() || !qAmount) return
    const amount = parseFloat(qAmount)
    if (isNaN(amount)) return
    const bill: QuickBill = { id: quickModal.bill?.id ?? generateId(), label: qLabel, company: qCompany, categoryId: qCatId || undefined, itemId: qItemId || undefined, amount, notes: qNotes || undefined }
    const bills = quickModal.bill ? data.quickBills.map(b => b.id === bill.id ? bill : b) : [...data.quickBills, bill]
    onUpdate({ ...data, quickBills: bills }); setQuickModal({ open: false })
  }
  const deleteQuick = (id: string) => onUpdate({ ...data, quickBills: data.quickBills.filter(b => b.id !== id) })
  const fireQuickBill = (bill: QuickBill) => {
    const today = new Date().toISOString().split('T')[0]
    const tx: Transaction = { id: generateId(), type: 'spend', company: bill.company || bill.label, categoryId: bill.categoryId, itemId: bill.itemId, amount: bill.amount, date: today, notes: bill.notes, month: today.slice(0, 7) }
    onUpdate({ ...data, transactions: [...data.transactions, tx] })
  }

  const openAddRecur  = () => { setRName(''); setRCompany(''); setRCatId(''); setRItemId(''); setRAmount(''); setRNotes(''); setRFreq('monthly'); setRDueDate('1'); setRDueMonth('1'); setRActive(true); setRecurModal({ open: true }) }
  const openEditRecur = (bill: RecurringBill) => {
    setRName(bill.name); setRCompany(bill.company); setRCatId(bill.categoryId ?? ''); setRItemId(bill.itemId ?? '')
    setRAmount(String(bill.amount)); setRNotes(bill.notes ?? ''); setRFreq(bill.frequency)
    setRDueDate(String(bill.dueDate)); setRDueMonth(String(bill.dueMonth ?? 1)); setRActive(bill.active)
    setRecurModal({ open: true, bill })
  }
  const saveRecur = () => {
    if (!rName.trim() || !rAmount) return
    const amount = parseFloat(rAmount)
    if (isNaN(amount)) return
    const bill: RecurringBill = { id: recurModal.bill?.id ?? generateId(), name: rName, company: rCompany, categoryId: rCatId || undefined, itemId: rItemId || undefined, amount, notes: rNotes || undefined, frequency: rFreq, dueDate: parseInt(rDueDate), dueMonth: parseInt(rDueMonth), active: rActive }
    const bills = recurModal.bill ? data.recurringBills.map(b => b.id === bill.id ? bill : b) : [...data.recurringBills, bill]
    onUpdate({ ...data, recurringBills: bills }); setRecurModal({ open: false })
  }
  const deleteRecur      = (id: string)  => onUpdate({ ...data, recurringBills: data.recurringBills.filter(b => b.id !== id) })
  const toggleRecurActive = (id: string) => onUpdate({ ...data, recurringBills: data.recurringBills.map(b => b.id === id ? { ...b, active: !b.active } : b) })
  const fireRecur = (bill: RecurringBill) => {
    const today = new Date().toISOString().split('T')[0]
    const tx: Transaction = { id: generateId(), type: 'spend', company: bill.company || bill.name, categoryId: bill.categoryId, itemId: bill.itemId, amount: bill.amount, date: today, notes: bill.notes, month: today.slice(0, 7) }
    const ledger = [...data.autoRunLedger, { billId: bill.id, date: today, transactionId: tx.id }]
    onUpdate({ ...data, transactions: [...data.transactions, tx], autoRunLedger: ledger })
  }

  const getCategoryLabel = (catId?: string, itemId?: string) => {
    if (!catId) return 'Uncategorized'
    const cat  = data.categories.find(c => c.id === catId)
    if (!cat) return 'Unknown'
    const item = cat.items.find(i => i.id === itemId)
    return item ? `${cat.name} › ${item.name}` : cat.name
  }

  const cardStyle: React.CSSProperties = { background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }

  return (
    <div className="pb-28">
      <div className="h-3" />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4">
        <h1 className="text-xl font-bold text-white mb-4">Transactions</h1>

        {/* Sub-tab switcher */}
        <div className="flex rounded-2xl p-1 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {([['all','Transactions'],['quick','Quick Bills'],['recurring','Recurring']] as [SubTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setSubTab(id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={subTab === id
                ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }
                : { color: 'var(--muted-foreground)' }
              }>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transactions Tab ────────────────────────────── */}
      {subTab === 'all' && (
        <div className="px-5">
          <div className="flex gap-2 mb-4">
            <button onClick={() => openAddTx(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.22)', color: '#fb7185' }}>
              <ArrowUpRight className="w-4 h-4" /> Add Expense
            </button>
            <button onClick={() => openAddTx(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>
              <ArrowDownLeft className="w-4 h-4" /> Add Income
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                style={inputStyle} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                </button>
              )}
            </div>
            <div className="relative">
              <select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}
                className="appearance-none rounded-2xl pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                style={selectStyle}>
                <option value="all">All</option>
                <option value="spend">Expenses</option>
                <option value="income">Income</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <Filter className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="text-white font-semibold">No transactions found</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Add one with the buttons above</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {filteredTx.map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}
                    className="rounded-2xl p-3.5 flex items-center gap-3" style={cardStyle}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)' }}>
                      {tx.type === 'income'
                        ? <ArrowDownLeft className="w-5 h-5" style={{ color: '#10b981' }} />
                        : <ArrowUpRight  className="w-5 h-5" style={{ color: '#f43f5e' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{tx.company}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{getCategoryLabel(tx.categoryId, tx.itemId)}</p>
                      {tx.notes && <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{tx.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: tx.type === 'income' ? '#34d399' : '#fb7185' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, cur)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(tx.date)}</p>
                    </div>
                    <div className="flex gap-1 ml-1">
                      <button onClick={() => openEditTx(tx)} className="p-1.5 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTx(tx.id)} className="p-1.5 rounded-lg" style={{ color: '#f43f5e' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Bills Tab ─────────────────────────────── */}
      {subTab === 'quick' && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Tap a bill to instantly log it</p>
            <button onClick={openAddQuick}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {data.quickBills.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <Zap className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="text-white font-semibold">No quick bills yet</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Create presets for common expenses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.quickBills.map((bill, i) => (
                <motion.div key={bill.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-3.5 flex items-center gap-3" style={cardStyle}>
                  <button onClick={() => fireQuickBill(bill)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}>
                    <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{bill.label}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{bill.company} · {getCategoryLabel(bill.categoryId, bill.itemId)}</p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(bill.amount, cur)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEditQuick(bill)} className="p-1.5 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteQuick(bill.id)} className="p-1.5 rounded-lg" style={{ color: '#f43f5e' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recurring Tab ──────────────────────────────── */}
      {subTab === 'recurring' && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Subscriptions & standing bills</p>
            <button onClick={openAddRecur}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {data.recurringBills.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <RotateCcw className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="text-white font-semibold">No recurring bills</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Set up subscriptions and recurring payments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recurringBills.map((bill, i) => {
                const monthlyEq = bill.frequency === 'yearly' ? bill.amount / 12 : bill.frequency === 'weekly' ? bill.amount * 4.33 : bill.amount
                return (
                  <motion.div key={bill.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-3.5" style={cardStyle}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: bill.active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)' }}>
                        <RotateCcw className="w-5 h-5" style={{ color: bill.active ? '#818cf8' : '#475569' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{bill.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {bill.company} · {bill.frequency}
                          {bill.frequency === 'monthly' && ` (day ${bill.dueDate})`}
                          {bill.frequency === 'yearly'  && ` (${MONTHS[bill.dueMonth! - 1]} ${bill.dueDate})`}
                          {bill.frequency === 'weekly'  && ` (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][bill.dueDate] ?? ''})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(bill.amount, cur)}</p>
                        {bill.frequency !== 'monthly' && (
                          <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(monthlyEq, cur)}/mo</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => toggleRecurActive(bill.id)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        style={bill.active
                          ? { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }
                          : { background: 'var(--surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                        }>
                        {bill.active ? 'Active' : 'Paused'}
                      </button>
                      <button onClick={() => fireRecur(bill)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                        <Zap className="w-3.5 h-3.5" /> Run
                      </button>
                      <button onClick={() => openEditRecur(bill)} className="p-1.5 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteRecur(bill.id)} className="p-1.5 rounded-lg" style={{ color: '#f43f5e' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Transaction Modal ───────────────────────────── */}
      <Modal open={txModal.open} onClose={() => setTxModal({ open: false })} title={txModal.tx ? 'Edit Transaction' : `Add ${txType === 'income' ? 'Income' : 'Expense'}`}>
        <div className="space-y-4">
          <div className="flex rounded-2xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {(['spend', 'income'] as const).map(t => (
              <button key={t} onClick={() => setTxType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={txType === t ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--muted-foreground)' }}>
                {t === 'spend' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
          <LabeledInput label="Company / Location" value={txCompany} onChange={setTxCompany} placeholder="e.g. Walmart" />
          <LabeledSelect label="Category" value={txCatId} onChange={v => { setTxCatId(v); setTxItemId('') }}
            options={[{ value: '', label: 'No category' }, ...data.categories.map(c => ({ value: c.id, label: c.name }))]} />
          {selectedCatItems.length > 0 && (
            <LabeledSelect label="Item" value={txItemId} onChange={setTxItemId}
              options={[{ value: '', label: 'No item' }, ...selectedCatItems.map(i => ({ value: i.id, label: i.name }))]} />
          )}
          <AmountInput label="Amount" currency={cur} value={txAmount} onChange={setTxAmount} />
          <LabeledInput label="Date" type="date" value={txDate} onChange={setTxDate} />
          <LabeledInput label="Notes (optional)" value={txNotes} onChange={setTxNotes} placeholder="Optional note..." />
          <button onClick={saveTx} disabled={!txCompany.trim() || !txAmount}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {txModal.tx ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </Modal>

      {/* ── Quick Bill Modal ────────────────────────────── */}
      <Modal open={quickModal.open} onClose={() => setQuickModal({ open: false })} title={quickModal.bill ? 'Edit Quick Bill' : 'Add Quick Bill'}>
        <div className="space-y-4">
          <LabeledInput label="Label" value={qLabel} onChange={setQLabel} placeholder="e.g. Morning Coffee" />
          <LabeledInput label="Company / Store" value={qCompany} onChange={setQCompany} placeholder="e.g. Starbucks" />
          <LabeledSelect label="Category" value={qCatId} onChange={v => { setQCatId(v); setQItemId('') }}
            options={[{ value: '', label: 'No category' }, ...data.categories.map(c => ({ value: c.id, label: c.name }))]} />
          {qSelectedCatItems.length > 0 && (
            <LabeledSelect label="Item" value={qItemId} onChange={setQItemId}
              options={[{ value: '', label: 'No item' }, ...qSelectedCatItems.map(i => ({ value: i.id, label: i.name }))]} />
          )}
          <AmountInput label="Amount" currency={cur} value={qAmount} onChange={setQAmount} />
          <LabeledInput label="Notes (optional)" value={qNotes} onChange={setQNotes} placeholder="Optional note..." />
          <button onClick={saveQuick} disabled={!qLabel.trim() || !qAmount}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {quickModal.bill ? 'Save Changes' : 'Add Quick Bill'}
          </button>
        </div>
      </Modal>

      {/* ── Recurring Modal ─────────────────────────────── */}
      <Modal open={recurModal.open} onClose={() => setRecurModal({ open: false })} title={recurModal.bill ? 'Edit Recurring Bill' : 'Add Recurring Bill'} maxWidth="max-w-sm">
        <div className="space-y-4">
          <LabeledInput label="Name" value={rName} onChange={setRName} placeholder="e.g. Netflix" />
          <LabeledInput label="Company" value={rCompany} onChange={setRCompany} placeholder="e.g. Netflix Inc." />
          <LabeledSelect label="Category" value={rCatId} onChange={v => { setRCatId(v); setRItemId('') }}
            options={[{ value: '', label: 'No category' }, ...data.categories.map(c => ({ value: c.id, label: c.name }))]} />
          {rSelectedCatItems.length > 0 && (
            <LabeledSelect label="Item" value={rItemId} onChange={setRItemId}
              options={[{ value: '', label: 'No item' }, ...rSelectedCatItems.map(i => ({ value: i.id, label: i.name }))]} />
          )}
          <AmountInput label="Amount" currency={cur} value={rAmount} onChange={setRAmount} />
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map(f => (
                <button key={f} onClick={() => setRFreq(f)}
                  className="py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={rFreq === f
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                  }>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {rFreq === 'weekly' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">Day of Week</label>
              <div className="grid grid-cols-7 gap-1">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <button key={i} onClick={() => setRDueDate(String(i))}
                    className="py-2 rounded-xl text-xs font-bold transition-all"
                    style={rDueDate === String(i)
                      ? { background: 'var(--primary)', color: '#fff' }
                      : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                    }>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(rFreq === 'monthly' || rFreq === 'yearly') && (
            <LabeledInput label="Day of Month" type="number" value={rDueDate} onChange={setRDueDate} />
          )}
          {rFreq === 'yearly' && (
            <LabeledSelect label="Month" value={rDueMonth} onChange={setRDueMonth}
              options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} />
          )}
          <LabeledInput label="Notes (optional)" value={rNotes} onChange={setRNotes} placeholder="Optional note..." />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Active</span>
            <button onClick={() => setRActive(!rActive)}
              className="w-12 h-6 rounded-full transition-colors duration-200 relative"
              style={{ background: rActive ? 'var(--primary)' : 'var(--surface-3)' }}>
              <motion.div animate={{ x: rActive ? 24 : 2 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
          <button onClick={saveRecur} disabled={!rName.trim() || !rAmount}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {recurModal.bill ? 'Save Changes' : 'Add Recurring Bill'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

/* ── Small helpers ─────────────────────────────────────────── */
function LabeledInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#f1f5f9' }} />
    </div>
  )
}

function LabeledSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#f1f5f9' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function AmountInput({ label, currency, value, onChange }: {
  label: string; currency: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {currency === 'USD' ? '$' : currency}
        </span>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00" min="0" step="0.01"
          className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#f1f5f9' }} />
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
