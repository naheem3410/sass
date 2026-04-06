'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { Sparkles, Loader2, Check } from 'lucide-react'

const INDUSTRIES = ['Technology','Finance','Healthcare','Education','E-Commerce','Logistics','Media','Legal','Real Estate','Other']
const SIZES = ['1–10','11–50','51–200','201–500','500+']

type Step = 'generate' | 'refine'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('generate')

  // Step 1 fields
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // Step 2 fields
  const [description, setDescription] = useState('')
  const [tagline, setTagline] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenError('')
    setGenerating(true)
    try {
      const data = await apiJson<{ description: string; tagline: string }>(
        '/api/companies/generate-description',
        { method: 'POST', body: JSON.stringify({ name, website: website || null }) }
      )
      setDescription(data.description)
      setTagline(data.tagline)
      setStep('refine')
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      await apiJson('/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name, website: website || null, industry: industry || null, size: size || null, description, tagline: tagline || null }),
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save company')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen dot-grid">
      <nav className="px-6 py-5 border-b border-slate-200 bg-paper/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-display text-xl font-semibold">HireFlow</span>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className={`flex items-center gap-1 ${step === 'generate' ? 'text-ink font-medium' : 'text-emerald-600'}`}>
              {step === 'refine' ? <Check className="w-3 h-3" /> : '01'} Company info
            </span>
            <span className="text-slate-300">—</span>
            <span className={`flex items-center gap-1 ${step === 'refine' ? 'text-ink font-medium' : 'text-slate-300'}`}>
              02 Review & save
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {step === 'generate' && (
          <div className="animate-fade-up">
            <div className="mb-10">
              <p className="font-mono text-xs text-amber-dark uppercase tracking-widest mb-3">Step 1 of 2</p>
              <h1 className="font-display text-4xl font-semibold mb-3">Tell us about your company</h1>
              <p className="text-slate-500">We'll use AI to draft your hiring profile. You can edit everything before saving.</p>
            </div>

            <form onSubmit={handleGenerate} className="card space-y-5">
              <div>
                <label className="label">Company name <span className="text-red-400">*</span></label>
                <input className="field" placeholder="Acme Corp" value={name}
                  onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Website <span className="text-slate-300">(optional)</span></label>
                <input className="field" placeholder="https://acmecorp.com" value={website}
                  onChange={e => setWebsite(e.target.value)} />
              </div>

              {genError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{genError}</p>
              )}

              <button type="submit" className="btn-amber w-full" disabled={generating || !name.trim()}>
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI…</>
                  : <><Sparkles className="w-4 h-4" /> Generate company profile</>
                }
              </button>
            </form>
          </div>
        )}

        {step === 'refine' && (
          <div className="animate-fade-up">
            <div className="mb-10">
              <p className="font-mono text-xs text-amber-dark uppercase tracking-widest mb-3">Step 2 of 2</p>
              <h1 className="font-display text-4xl font-semibold mb-3">Review your profile</h1>
              <p className="text-slate-500">AI has drafted your description. Edit freely — this is what candidates will see.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="card space-y-5">
                <div>
                  <label className="label">Company name</label>
                  <input className="field" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tagline</label>
                  <input className="field" placeholder="A short memorable line" value={tagline}
                    onChange={e => setTagline(e.target.value)} />
                </div>
                <div>
                  <label className="label">Company description <span className="text-red-400">*</span></label>
                  <textarea className="field min-h-[120px] resize-y" value={description}
                    onChange={e => setDescription(e.target.value)} required />
                  <p className="text-xs text-slate-400 mt-1 font-mono">AI-generated — edit as needed</p>
                </div>
              </div>

              <div className="card space-y-5">
                <h3 className="font-medium text-sm">Optional details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Industry</label>
                    <select className="field" value={industry} onChange={e => setIndustry(e.target.value)}>
                      <option value="">Select…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Company size</label>
                    <select className="field" value={size} onChange={e => setSize(e.target.value)}>
                      <option value="">Select…</option>
                      {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{saveError}</p>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => setStep('generate')}>← Back</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving || !description.trim()}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save & go to dashboard →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
