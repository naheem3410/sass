'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await apiJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="card shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-slate-500">Start hiring in minutes. No credit card required.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Work email</label>
            <input type="email" className="field" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="field" placeholder="At least 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" className="field" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-4 leading-relaxed">
          By signing up you agree to our terms of service and privacy policy.
        </p>
        <p className="text-sm text-center text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-ink font-medium underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
