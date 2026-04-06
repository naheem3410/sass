'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { CheckCircle, Loader2, AlertTriangle, Mail } from 'lucide-react'

type Stage = 'loading' | 'enter_otp' | 'verifying' | 'success' | 'error'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [stage, setStage] = useState<Stage>('loading')
  const [sessionToken, setSessionToken] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // On mount: hit the verify endpoint with the link token
  useEffect(() => {
    if (!token) { setStage('error'); setError('Missing verification token.'); return }
    apiJson<{ message: string; session_token: string }>(`/api/verify?token=${encodeURIComponent(token)}`)
      .then(data => {
        setSessionToken(data.session_token)
        setStage('enter_otp')
      })
      .catch(err => {
        setStage('error')
        setError(err instanceof Error ? err.message : 'Invalid or expired link.')
      })
  }, [token])

  // OTP digit input handlers
  function handleDigit(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
    // Auto-submit when all 6 digits entered
    if (next.every(d => d !== '') && digit) {
      submitOtp(next.join(''))
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      submitOtp(text)
    }
  }

  async function submitOtp(code: string) {
    setStage('verifying')
    setError('')
    try {
      await apiJson('/api/verify/otp', {
        method: 'POST',
        body: JSON.stringify({ session_token: sessionToken, otp: code }),
      })
      setStage('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Incorrect code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      setStage('enter_otp')
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  async function resendOtp() {
    setResending(true)
    setError('')
    try {
      await apiJson(`/api/verify/resend?token=${encodeURIComponent(token)}`)
      setResent(true)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => { setResent(false); inputRefs.current[0]?.focus() }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper dot-grid flex flex-col">
      <nav className="px-6 py-5 border-b border-slate-200 bg-paper/80 backdrop-blur-sm">
        <span className="font-display text-xl font-semibold">HireFlow</span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">

          {/* Loading */}
          {stage === 'loading' && (
            <div className="card text-center py-12 animate-fade-in">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Validating your link…</p>
            </div>
          )}

          {/* OTP entry */}
          {(stage === 'enter_otp' || stage === 'verifying') && (
            <div className="card animate-fade-up">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-amber-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-amber-dark" />
                </div>
                <h1 className="font-display text-2xl font-semibold mb-2">Check your email</h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We've sent a 6-digit verification code. Enter it below to confirm your application.
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigit(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    disabled={stage === 'verifying'}
                    className={`w-12 h-14 text-center text-xl font-display font-semibold border-2 rounded-xl
                      focus:outline-none focus:border-ink transition-all
                      ${digit ? 'border-ink bg-white' : 'border-slate-200 bg-slate-50'}
                      ${stage === 'verifying' ? 'opacity-50' : ''}
                    `}
                  />
                ))}
              </div>

              {stage === 'verifying' && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {resent && (
                <p className="text-sm text-emerald-600 text-center mb-4">
                  New code sent! Check your email.
                </p>
              )}

              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">Didn't receive it?</p>
                <button
                  onClick={resendOtp}
                  disabled={resending || stage === 'verifying'}
                  className="btn-ghost text-xs"
                >
                  {resending ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</> : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {stage === 'success' && (
            <div className="card text-center py-12 animate-fade-up">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-semibold mb-2">You're verified!</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Your application has been confirmed. The hiring team will be in touch if you're a great fit.
              </p>
              <p className="text-xs text-slate-400 font-mono mt-6">You can close this tab.</p>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="card text-center py-12 animate-fade-up">
              <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-semibold mb-2">Link invalid</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{error}</p>
              <p className="text-xs text-slate-400 font-mono mt-4">
                The link may have expired or already been used.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
