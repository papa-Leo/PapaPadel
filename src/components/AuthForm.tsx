'use client'
// src/components/AuthForm.tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { X } from 'lucide-react'

export default function AuthForm({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else onClose()
    } else {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
      else setSuccess(true)
    }
    setLoading(false)
  }

  if (success) return (
    <div className="auth-success">
      <h2>Check your email!</h2>
      <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
      <button onClick={onClose} className="btn-confirm">Done</button>
    </div>
  )

  return (
    <div className="auth-form">
      <button className="modal-close" onClick={onClose}><X size={20} /></button>

      <div className="auth-tabs">
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign In</button>
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create Account</button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn-confirm" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
