'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiJson, apiFetch } from '@/lib/api'
import { Job, FormField } from '@/types'
import FormBuilder from '@/components/FormBuilder'
import { ExternalLink, Users, Loader2, Copy, Check, AlertTriangle } from 'lucide-react'
import { statusColor, timeAgo } from '@/lib/utils'

const JOB_TYPES = ['Full-time','Part-time','Contract','Internship','Freelance']
const LOCATIONS = ['Remote','Hybrid','On-site']
const STATUSES: Job['status'][] = ['active','draft','closed']

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Editable state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [status, setStatus] = useState<Job['status']>('active')
  const [fields, setFields] = useState<FormField[]>([])

  useEffect(() => {
    apiJson<Job>(`/api/jobs/${id}`).then(j => {
      setJob(j)
      setTitle(j.title)
      setDescription(j.description)
      setRequirements(Array.isArray(j.requirements) ? j.requirements.join('\n') : '')
      setLocation(j.location ?? '')
      setJobType(j.job_type ?? '')
      setSalaryRange(j.salary_range ?? '')
      setStatus(j.status)
      setFields(j.form_schema?.fields ?? [])
      setLoading(false)
    }).catch(() => { setError('Job not found'); setLoading(false) })
  }, [id])

  const publicUrl = job ? `${process.env.NEXT_PUBLIC_API_URL?.replace(':8000', ':3000') || 'http://localhost:3000'}/apply/${job.slug}` : ''

  function copyUrl() {
    navigator.clipboard.writeText(publicUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiJson(`/api/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title, description,
          requirements: requirements.split('\n').filter(Boolean),
          location: location || null,
          job_type: jobType || null,
          salary_range: salaryRange || null,
          status,
          form_schema: { fields },
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-64" /><div className="h-64 bg-slate-100 rounded" /></div></div>
  if (!job && error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="text-sm text-slate-400 mb-1 cursor-pointer hover:underline" onClick={() => router.push('/dashboard')}>
            Dashboard /
          </p>
          <h1 className="font-display text-3xl font-semibold">{job?.title}</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Posted {job && timeAgo(job.created_at)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => router.push(`/dashboard/candidates/${id}`)} className="btn-secondary gap-1">
            <Users className="w-4 h-4" /> Candidates
          </button>
          <a href={`/apply/${job?.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost gap-1">
            <ExternalLink className="w-4 h-4" /> View post
          </a>
        </div>
      </div>

      {/* Public URL banner */}
      {job?.status === 'active' && (
        <div className="border border-amber/30 bg-amber-light rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-mono text-amber-dark uppercase tracking-widest mb-1">Public application link</p>
            <p className="text-sm font-mono text-slate-700 truncate max-w-md">{publicUrl}</p>
          </div>
          <button onClick={copyUrl} className="btn-amber shrink-0 text-xs px-3 py-1.5">
            {copiedUrl ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Job details</h2>
            <div className="flex items-center gap-2">
              <label className="label mb-0">Status</label>
              <select className="field py-1.5 text-xs w-auto" value={status} onChange={e => setStatus(e.target.value as Job['status'])}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Job title</label>
            <input className="field" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field min-h-[200px] resize-y" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="label">Requirements <span className="text-slate-400 normal-case font-normal">(one per line)</span></label>
            <textarea className="field min-h-[100px] resize-y font-mono text-xs" value={requirements} onChange={e => setRequirements(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Location</label>
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
              <input className="field" placeholder="e.g. ₦300k – ₦500k/mo" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-5">
            <h2 className="font-semibold mb-1">Application form</h2>
            <p className="text-sm text-slate-500">Changes here apply to new submissions only.</p>
          </div>
          <FormBuilder fields={fields} onChange={setFields} />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center justify-between pb-8">
          <button type="button" className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => router.push('/dashboard')}>
            ← Back
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved
              ? <><Check className="w-4 h-4" /> Saved!</>
              : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
