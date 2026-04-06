'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { Company, FormField, JobDescriptionSuggestion } from '@/types'
import FormBuilder from '@/components/FormBuilder'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'

const JOB_TYPES = ['Full-time','Part-time','Contract','Internship','Freelance']
const LOCATIONS = ['Remote','Hybrid','On-site']

export default function NewJobPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)

  // Core fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [fields, setFields] = useState<FormField[]>([])

  // AI suggestion
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<JobDescriptionSuggestion | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Submit
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<Company>('/api/companies/me').then(setCompany).catch(() => null)
  }, [])

  async function handleSuggest() {
    if (!title.trim() || !company) return
    setSuggesting(true)
    setSuggestion(null)
    try {
      const data = await apiJson<JobDescriptionSuggestion>('/api/jobs/suggest-description', {
        method: 'POST',
        body: JSON.stringify({ job_title: title, company_id: company.id }),
      })
      setSuggestion(data)
    } catch {
      // silently fail suggestion — user can still write manually
    } finally {
      setSuggesting(false)
    }
  }

  function applySuggestion() {
    if (!suggestion) return
    const lines = [
      suggestion.summary,
      '',
      'Responsibilities:',
      ...suggestion.responsibilities.map(r => `• ${r}`),
      '',
      'Requirements:',
      ...suggestion.required_qualifications.map(r => `• ${r}`),
      '',
      'What we offer:',
      ...suggestion.what_we_offer.map(r => `• ${r}`),
    ]
    setDescription(lines.join('\n'))
    setRequirements(suggestion.required_qualifications.join('\n'))
    setSuggestion(null)
  }

  function copySection(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedSection(key)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError('Job description is required.'); return }
    setSaving(true)
    setError('')
    try {
      const data = await apiJson<{ job_id: number; slug: string; url: string }>('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          requirements: requirements.split('\n').filter(Boolean),
          location: location || null,
          job_type: jobType || null,
          salary_range: salaryRange || null,
          form_schema: { fields },
        }),
      })
      router.push(`/dashboard/jobs/${data.job_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-slate-400 mb-1">
          <span className="hover:underline cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
          {' / '}New job
        </p>
        <h1 className="font-display text-3xl font-semibold">Post a new job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-5">
          <h2 className="font-semibold">Job details</h2>

          <div>
            <label className="label">Job title <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input className="field flex-1" placeholder="e.g. Senior Product Designer" value={title}
                onChange={e => setTitle(e.target.value)} required />
              <button type="button" onClick={handleSuggest}
                disabled={!title.trim() || !company || suggesting}
                className="btn-amber shrink-0 whitespace-nowrap">
                {suggesting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</>
                  : <><Sparkles className="w-4 h-4" /> AI suggest</>}
              </button>
            </div>
          </div>

          {/* AI suggestion panel */}
          {suggestion && (
            <div className="border border-amber/40 bg-amber-light rounded-xl p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-amber-dark uppercase tracking-widest">AI suggestion</p>
                <div className="flex gap-2">
                  <button type="button" onClick={applySuggestion} className="btn-amber text-xs px-3 py-1.5">
                    Apply all
                  </button>
                  <button type="button" onClick={() => setSuggestion(null)} className="btn-ghost text-xs px-2 py-1.5">
                    Dismiss
                  </button>
                </div>
              </div>
              {[
                { key: 'summary', label: 'Summary', text: suggestion.summary },
                { key: 'responsibilities', label: 'Responsibilities', text: suggestion.responsibilities.join('\n') },
                { key: 'requirements', label: 'Requirements', text: suggestion.required_qualifications.join('\n') },
                { key: 'offers', label: 'What we offer', text: suggestion.what_we_offer.join('\n') },
              ].map(({ key, label, text }) => (
                <div key={key} className="bg-white/70 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-mono font-medium text-slate-600">{label}</p>
                    <button type="button" onClick={() => copySection(text, key)} className="text-slate-400 hover:text-ink p-1">
                      {copiedSection === key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="label">Description <span className="text-red-400">*</span></label>
            <textarea className="field min-h-[200px] resize-y" placeholder="Describe the role, responsibilities, and what great looks like…"
              value={description} onChange={e => setDescription(e.target.value)} required />
          </div>

          <div>
            <label className="label">Requirements <span className="text-slate-400 normal-case font-normal">(one per line)</span></label>
            <textarea className="field min-h-[100px] resize-y font-mono text-xs"
              placeholder={"3+ years experience in product design\nProficiency in Figma\nStrong communication skills"}
              value={requirements} onChange={e => setRequirements(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Location type</label>
              <select className="field" value={location} onChange={e => setLocation(e.target.value)}>
                <option value="">Any</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job type</label>
              <select className="field" value={jobType} onChange={e => setJobType(e.target.value)}>
                <option value="">Any</option>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Salary range</label>
              <input className="field" placeholder="e.g. ₦300k – ₦500k/mo" value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Application form builder */}
        <div className="card">
          <div className="mb-5">
            <h2 className="font-semibold mb-1">Application form</h2>
            <p className="text-sm text-slate-500">
              Candidates will always upload their CV. Add any extra fields you need below.
            </p>
          </div>
          <FormBuilder fields={fields} onChange={setFields} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : 'Publish job →'}
          </button>
        </div>
      </form>
    </div>
  )
}
