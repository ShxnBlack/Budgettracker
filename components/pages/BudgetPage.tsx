'use client'
import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical,
  ShieldCheck, Heart, Sparkles
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { AppData, Category, BudgetItem, Group } from '@/lib/store'
import { formatCurrency, getCurrentMonth, generateId } from '@/lib/store'

interface BudgetPageProps {
  data: AppData
  onUpdate: (data: AppData) => void
}

const GROUP_ICONS = { Essential: ShieldCheck, Need: Heart, Want: Sparkles }

const GROUP_COLORS: Record<Group, { bg: string; text: string; border: string }> = {
  Essential: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.22)' },
  Need:      { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.22)' },
  Want:      { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.22)' },
}

export default function BudgetPage({ data, onUpdate }: BudgetPageProps) {
  const month = getCurrentMonth()
  const cur = data.currency

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [catModal, setCatModal]   = useState<{ open: boolean; cat?: Category }>({ open: false })
  const [itemModal, setItemModal] = useState<{ open: boolean; catId?: string; item?: BudgetItem }>({ open: false })
  const [catName, setCatName]   = useState('')
  const [catGroup, setCatGroup] = useState<Group>('Essential')
  const [itemName, setItemName]     = useState('')
  const [itemBudget, setItemBudget] = useState('')

  const toggleExpand = (id: string) => {
    const s = new Set(expandedCats)
    s.has(id) ? s.delete(id) : s.add(id)
    setExpandedCats(s)
  }

  const openAddCat  = () => { setCatName(''); setCatGroup('Essential'); setCatModal({ open: true }) }
  const openEditCat = (cat: Category) => { setCatName(cat.name); setCatGroup(cat.group); setCatModal({ open: true, cat }) }
  const saveCat = () => {
    if (!catName.trim()) return
    let cats = [...data.categories]
    if (catModal.cat) cats = cats.map(c => c.id === catModal.cat!.id ? { ...c, name: catName, group: catGroup } : c)
    else cats.push({ id: generateId(), name: catName, group: catGroup, items: [], order: cats.length })
    onUpdate({ ...data, categories: cats })
    setCatModal({ open: false })
  }
  const deleteCat = (id: string) => {
    onUpdate({ ...data, categories: data.categories.filter(c => c.id !== id), transactions: data.transactions.filter(t => t.categoryId !== id) })
  }

  const openAddItem  = (catId: string) => { setItemName(''); setItemBudget(''); setItemModal({ open: true, catId }) }
  const openEditItem = (catId: string, item: BudgetItem) => { setItemName(item.name); setItemBudget(String(item.budget)); setItemModal({ open: true, catId, item }) }
  const saveItem = () => {
    if (!itemName.trim() || !itemBudget) return
    const budget = parseFloat(itemBudget)
    if (isNaN(budget)) return
    let cats = [...data.categories]
    const catIdx = cats.findIndex(c => c.id === itemModal.catId)
    if (catIdx === -1) return
    if (itemModal.item) {
      cats[catIdx] = { ...cats[catIdx], items: cats[catIdx].items.map(i => i.id === itemModal.item!.id ? { ...i, name: itemName, budget } : i) }
    } else {
      cats[catIdx] = { ...cats[catIdx], items: [...cats[catIdx].items, { id: generateId(), name: itemName, budget, order: cats[catIdx].items.length }] }
    }
    onUpdate({ ...data, categories: cats })
    setItemModal({ open: false })
  }
  const deleteItem = (catId: string, itemId: string) => {
    const cats = data.categories.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
    onUpdate({ ...data, categories: cats })
  }

  const getSpent = (catId: string, itemId?: string) =>
    data.transactions.filter(t => t.month === month && t.type === 'spend' && t.categoryId === catId && (!itemId || t.itemId === itemId)).reduce((s, t) => s + t.amount, 0)

  const reorderCats  = (newOrder: Category[])  => onUpdate({ ...data, categories: newOrder.map((c, i) => ({ ...c, order: i })) })
  const reorderItems = (catId: string, items: BudgetItem[]) => {
    const cats = data.categories.map(c => c.id === catId ? { ...c, items: items.map((it, i) => ({ ...it, order: i })) } : c)
    onUpdate({ ...data, categories: cats })
  }

  const totalBudget = data.categories.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.budget, 0), 0)
  const totalSpent  = data.categories.reduce((s, c) => s + getSpent(c.id), 0)
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const overallOver = totalBudget > 0 && totalSpent > totalBudget

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: '#f1f5f9',
  } as React.CSSProperties

  return (
    <div className="pb-28">
      <div className="h-3" />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Budget</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={openAddCat}
          className="flex items-center gap-1.5 text-sm font-bold text-white px-3.5 py-2.5 rounded-2xl"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          <Plus className="w-4 h-4" /> Category
        </button>
      </div>

      {/* ── Monthly Summary ─────────────────────────────── */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Monthly Budget</span>
            <span className="text-sm font-bold" style={{ color: overallOver ? '#f43f5e' : '#818cf8' }}>
              {formatCurrency(totalSpent, cur)} / {formatCurrency(totalBudget, cur)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{ background: overallOver ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #818cf8)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {totalBudget > 0 ? `${Math.round(overallPct)}% used` : 'No budget set'}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {formatCurrency(Math.max(totalBudget - totalSpent, 0), cur)} remaining
            </span>
          </div>
        </div>
      </div>

      {/* ── Categories ──────────────────────────────────── */}
      {data.categories.length === 0 ? (
        <div className="px-5 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <Plus className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p className="text-white font-semibold mb-1">No categories yet</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Add a category to start budgeting</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={data.categories} onReorder={reorderCats} className="px-5 space-y-3">
          {data.categories.map(cat => {
            const catSpent  = getSpent(cat.id)
            const catBudget = cat.items.reduce((s, i) => s + i.budget, 0)
            const pct       = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 100) : 0
            const over      = catBudget > 0 && catSpent > catBudget
            const expanded  = expandedCats.has(cat.id)
            const GroupIcon = GROUP_ICONS[cat.group]
            const gc        = GROUP_COLORS[cat.group]

            return (
              <Reorder.Item key={cat.id} value={cat}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.28)' }}
                >
                  {/* Category header */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab touch-none" style={{ color: 'var(--muted-foreground)' }}>
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: gc.bg, border: `1px solid ${gc.border}` }}>
                        <GroupIcon className="w-4 h-4" style={{ color: gc.text }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-bold text-white">{cat.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold" style={{ color: over ? '#f43f5e' : '#818cf8' }}>
                              {formatCurrency(catSpent, cur)}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/ {formatCurrency(catBudget, cur)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.45 }}
                            className="h-full rounded-full"
                            style={{ background: over ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #818cf8)' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: gc.bg, color: gc.text, border: `1px solid ${gc.border}` }}>
                          {cat.group}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{cat.items.length} items</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[
                          { onClick: () => openAddItem(cat.id),  icon: Plus,     color: '#818cf8', hoverBg: 'rgba(99,102,241,0.12)' },
                          { onClick: () => openEditCat(cat),     icon: Edit2,    color: 'var(--muted-foreground)', hoverBg: 'var(--surface-2)' },
                          { onClick: () => deleteCat(cat.id),    icon: Trash2,   color: '#f43f5e', hoverBg: 'rgba(244,63,94,0.10)' },
                          { onClick: () => toggleExpand(cat.id), icon: expanded ? ChevronUp : ChevronDown, color: 'var(--muted-foreground)', hoverBg: 'var(--surface-2)' },
                        ].map(({ onClick, icon: Ic, color }, idx) => (
                          <button key={idx} onClick={onClick}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color }}>
                            <Ic className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <Reorder.Group axis="y" values={cat.items} onReorder={(items) => reorderItems(cat.id, items)} className="p-2.5 space-y-1.5">
                          {cat.items.map(item => {
                            const itemSpent = getSpent(cat.id, item.id)
                            const itemPct   = item.budget > 0 ? Math.min((itemSpent / item.budget) * 100, 100) : 0
                            const itemOver  = item.budget > 0 && itemSpent > item.budget
                            const remaining = Math.max(item.budget - itemSpent, 0)

                            return (
                              <Reorder.Item key={item.id} value={item}>
                                <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-3.5 h-3.5 cursor-grab touch-none flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                          <button onClick={() => openEditItem(cat.id, item)} className="p-1 rounded" style={{ color: 'var(--muted-foreground)' }}>
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => deleteItem(cat.id, item.id)} className="p-1 rounded" style={{ color: '#f43f5e' }}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                      {/* Budget / Spent / Remaining row */}
                                      <div className="flex items-center gap-2 mb-1.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                        <span>Budget <strong className="text-white">{formatCurrency(item.budget, cur)}</strong></span>
                                        <span className="opacity-40">·</span>
                                        <span style={{ color: itemOver ? '#fb7185' : 'inherit' }}>Spent <strong style={{ color: itemOver ? '#fb7185' : '#818cf8' }}>{formatCurrency(itemSpent, cur)}</strong></span>
                                        <span className="opacity-40">·</span>
                                        <span>Left <strong style={{ color: '#34d399' }}>{formatCurrency(remaining, cur)}</strong></span>
                                      </div>
                                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${itemPct}%` }}
                                          transition={{ duration: 0.4 }}
                                          className="h-full rounded-full"
                                          style={{ background: itemOver ? '#f43f5e' : 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Reorder.Item>
                            )
                          })}
                        </Reorder.Group>
                        {cat.items.length === 0 && (
                          <div className="px-4 py-3 text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                            No items. Tap + to add one.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      )}

      {/* ── Category Modal ────────────────────────────── */}
      <Modal open={catModal.open} onClose={() => setCatModal({ open: false })} title={catModal.cat ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Category Name</label>
            <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Groceries"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Group</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Essential', 'Need', 'Want'] as Group[]).map(g => {
                const Icon = GROUP_ICONS[g]
                const gc2  = GROUP_COLORS[g]
                const sel  = catGroup === g
                return (
                  <button key={g} onClick={() => setCatGroup(g)}
                    className="py-3 px-2 rounded-2xl text-sm font-semibold transition-all flex flex-col items-center gap-1.5"
                    style={sel
                      ? { background: gc2.bg, border: `1px solid ${gc2.border}`, color: gc2.text }
                      : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                    }>
                    <Icon className="w-4 h-4" />
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
          <button onClick={saveCat} disabled={!catName.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {catModal.cat ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </Modal>

      {/* ── Item Modal ────────────────────────────────── */}
      <Modal open={itemModal.open} onClose={() => setItemModal({ open: false })} title={itemModal.item ? 'Edit Item' : 'Add Budget Item'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Item Name</label>
            <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Rent, Netflix, Fuel"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {data.currency === 'USD' ? '$' : data.currency}
              </span>
              <input type="number" value={itemBudget} onChange={e => setItemBudget(e.target.value)} placeholder="0.00" min="0" step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                style={inputStyle} />
            </div>
          </div>
          <button onClick={saveItem} disabled={!itemName.trim() || !itemBudget}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            {itemModal.item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
