'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Eye, EyeOff, Loader2, Chrome } from 'lucide-react'

interface AuthScreenProps {
  onAuth: (user: { name: string; email: string }) => void
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all required fields.'); return }
    if (mode === 'signup' && !name) { setError('Full name is required.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onAuth({ name: name || email.split('@')[0], email })
    }, 900)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--background)' }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.40)',
            }}
          >
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PocketBudget</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Smart budgeting, synced across devices
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-3xl p-6"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
          }}
        >
          {/* Segmented toggle */}
          <div
            className="flex rounded-2xl p-1 mb-6"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative"
                style={
                  mode === m
                    ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <motion.form
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all pr-12"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs px-3.5 py-2.5 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185' }}
              >
                {error}
              </motion.p>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.40)',
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => onAuth({ name: 'Demo User', email: 'demo@pocketbudget.app' })}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2.5 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <Chrome className="w-4 h-4" style={{ color: '#6366f1' }} />
              Continue with Google
            </button>
          </motion.form>
        </motion.div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--muted-foreground)' }}>
          Your data is stored locally on this device.
        </p>
      </div>
    </div>
  )
}
