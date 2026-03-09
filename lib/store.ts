export const STORAGE_KEY = 'budget-tracker-v5'

export type Group = 'Essential' | 'Need' | 'Want'

export interface BudgetItem {
  id: string
  name: string
  budget: number
  order: number
}

export interface Category {
  id: string
  name: string
  group: Group
  items: BudgetItem[]
  order: number
}

export interface MonthlyBudgetItem {
  itemId: string
  budget: number
}

export interface Transaction {
  id: string
  type: 'spend' | 'income'
  company: string
  categoryId?: string
  itemId?: string
  amount: number
  date: string
  notes?: string
  month: string // YYYY-MM
}

export interface QuickBill {
  id: string
  label: string
  company: string
  categoryId?: string
  itemId?: string
  amount: number
  notes?: string
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface RecurringBill {
  id: string
  name: string
  company: string
  categoryId?: string
  itemId?: string
  amount: number
  notes?: string
  frequency: RecurringFrequency
  dueDate: number   // day of month (1-31) or day-of-week (0-6) for weekly
  dueMonth?: number // 1-12 for yearly
  active: boolean
}

export interface AutoRunEntry {
  billId: string
  date: string
  transactionId: string
}

export interface StudentLoan {
  totalLoan: number
  termStart: string   // YYYY-MM
  termEnd: string     // YYYY-MM
  leftoverTarget: number
}

export interface SavingsVault {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  color: string
}

export interface SavingsTransaction {
  id: string
  vaultId: string
  type: 'deposit' | 'withdraw'
  amount: number
  date: string
  note?: string
}

export interface MonthlyMeta {
  startOfMonthBalance: number
}

export interface AppData {
  theme: 'dark' | 'light'
  currency: string
  startOfMonthBalance: number
  groups: Group[]
  categories: Category[]
  monthlyBudgets: Record<string, MonthlyBudgetItem[]>
  monthlyMeta: Record<string, MonthlyMeta>
  transactions: Transaction[]
  quickBills: QuickBill[]
  recurringBills: RecurringBill[]
  autoRunLedger: AutoRunEntry[]
  studentLoan: StudentLoan
  savingsVaults: SavingsVault[]
  savingsTransactions: SavingsTransaction[]
}

export const defaultData: AppData = {
  theme: 'dark',
  currency: 'USD',
  startOfMonthBalance: 0,
  groups: ['Essential', 'Need', 'Want'],
  categories: [],
  monthlyBudgets: {},
  monthlyMeta: {},
  transactions: [],
  quickBills: [],
  recurringBills: [],
  autoRunLedger: [],
  studentLoan: {
    totalLoan: 0,
    termStart: '',
    termEnd: '',
    leftoverTarget: 0,
  },
  savingsVaults: [],
  savingsTransactions: [],
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultData }
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed }
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$',
    AUD: 'A$', CHF: 'Fr', CNY: '¥', INR: '₹', MXN: 'MX$',
    BRL: 'R$', KRW: '₩', SGD: 'S$', NZD: 'NZ$', HKD: 'HK$',
  }
  const sym = symbols[currency] ?? currency + ' '
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const VAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
]

export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF',
  'CNY', 'INR', 'MXN', 'BRL', 'KRW', 'SGD', 'NZD', 'HKD',
]
