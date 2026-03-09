'use client'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AuthScreen from '@/components/AuthScreen'
import BottomNav, { type TabType } from '@/components/BottomNav'
import DashboardPage from '@/components/pages/DashboardPage'
import BudgetPage from '@/components/pages/BudgetPage'
import TransactionsPage from '@/components/pages/TransactionsPage'
import SavingsPage from '@/components/pages/SavingsPage'
import AnalyticsPage from '@/components/pages/AnalyticsPage'
import SettingsPage from '@/components/pages/SettingsPage'
import type { AppData } from '@/lib/store'
import { loadData, saveData, generateId } from '@/lib/store'

interface User {
  name: string
  email: string
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User>({ name: 'User', email: '' })
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [data, setData] = useState<AppData>(() => loadData())
  const [mounted, setMounted] = useState(false)

  // Mount + theme application
  useEffect(() => {
    setMounted(true)
    const stored = loadData()
    setData(stored)
    // Apply theme to DOM
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', stored.theme === 'dark')
    }
    // Check persisted auth
    const storedUser = sessionStorage.getItem('pb-user')
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser)
        setUser(u)
        setIsAuthenticated(true)
      } catch {}
    }
  }, [])

  // Process recurring bills on load
  useEffect(() => {
    if (!isAuthenticated || !mounted) return
    processRecurringBills(data, (updated) => {
      setData(updated)
      saveData(updated)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, mounted])

  const handleUpdate = useCallback((newData: AppData) => {
    setData(newData)
    saveData(newData)
    // Keep DOM in sync with theme
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newData.theme === 'dark')
    }
  }, [])

  const handleAuth = (u: User) => {
    setUser(u)
    setIsAuthenticated(true)
    sessionStorage.setItem('pb-user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('pb-user')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuth={handleAuth} />
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'dashboard' && (
            <DashboardPage
              data={data}
              onUpdate={handleUpdate}
              user={user}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetPage data={data} onUpdate={handleUpdate} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsPage data={data} onUpdate={handleUpdate} />
          )}
          {activeTab === 'savings' && (
            <SavingsPage data={data} onUpdate={handleUpdate} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPage data={data} />
          )}
          {activeTab === 'settings' && (
            <SettingsPage
              data={data}
              onUpdate={handleUpdate}
              onLogout={handleLogout}
              user={user}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

// Auto-process recurring bills
function processRecurringBills(
  data: AppData,
  onUpdate: (data: AppData) => void
) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayMonth = todayStr.slice(0, 7)
  const dayOfMonth = today.getDate()
  const dayOfWeek = today.getDay()
  const month = today.getMonth() + 1

  let changed = false
  let transactions = [...data.transactions]
  let ledger = [...data.autoRunLedger]

  for (const bill of data.recurringBills) {
    if (!bill.active) continue
    // Check if already run today
    const alreadyRan = ledger.some(e => e.billId === bill.id && e.date === todayStr)
    if (alreadyRan) continue

    let shouldRun = false
    if (bill.frequency === 'weekly' && bill.dueDate === dayOfWeek) shouldRun = true
    if (bill.frequency === 'monthly' && bill.dueDate === dayOfMonth) shouldRun = true
    if (bill.frequency === 'yearly' && bill.dueDate === dayOfMonth && bill.dueMonth === month) shouldRun = true

    if (shouldRun) {
      const tx = {
        id: generateId(),
        type: 'spend' as const,
        company: bill.company || bill.name,
        categoryId: bill.categoryId,
        itemId: bill.itemId,
        amount: bill.amount,
        date: todayStr,
        notes: `Auto: ${bill.name}`,
        month: todayMonth,
      }
      transactions.push(tx)
      ledger.push({ billId: bill.id, date: todayStr, transactionId: tx.id })
      changed = true
    }
  }

  if (changed) {
    onUpdate({ ...data, transactions, autoRunLedger: ledger })
  }
}
