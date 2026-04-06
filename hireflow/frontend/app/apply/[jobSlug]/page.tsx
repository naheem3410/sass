'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { apiJson, apiUpload } from '@/lib/api'
import { Job } from '@/types'
import DynamicForm from '@/components/DynamicForm'
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle, MapPin, Clock, Banknote } from 'lucide-react'

type Stage = 'loading' | 'apply' | 'submitted' | 'error' | 'not_found' | 'closed'

const ACCEPTED = '.pdf,.docx,.doc,.txt,.md,.rtf,.odt'

export default function ApplyPage() {
  const { jobSlug } = useParams<{ jobSlug: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [stage, setStage] = useState<Stage>('loading')

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverNote, setCoverNote] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [extraFiles, setExtraFiles] = useState<Record<string, File | null>>({})
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiJson<Job>(`/api/public/jobs/${jobSlug}`)
      .then(j => {
        setJob(j)
        setStage(j.status === 'active' ? 'apply' : 'closed')
      })
      .catch(() => setStage('not_found'))
  }, [jobSlug])

  function handleFieldChange(id: string, value: unknown) {
    setFieldValues(prev => ({ ...prev, [id]: value }))
  }

  function buildFormResponses(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const field of (job?.form_schema?.fields ?? [])) {
      if (field.field_type !== 'file') {
        out[field.id] = fieldValues[field.id] ?? null
      }
    }
    return out
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cvFile) { setError('Please upload your CV or resume.'); return }
    setError('')
    setSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      if (phone) fd.append('phone', phone)
      if (coverNote) fd.append('cover_note', coverNote)
      fd.append('form_responses', JSON.stringify(buildFormResponses()))
      fd.append('cv', cvFile)

      // extra file fields
      for (const [fieldId, file] of Object.entries(extraFiles)) {
        if (file) fd.append(fieldId, file)
      }

      await apiUpload(`/api/applications/${jobSlug}`, fd)
      setStage('submitted')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'loading') return <FullPageSpinner />

  if (stage === 'not_found') return (
    <Shell>
      <div className="text-center py-20">
        <p className="font-display text-2xl font-semibold mb-2">Job not found</p>
        <p className="text-slate-500 text-sm">This link may be invalid or the job has been removed.</p>
      </div>
    </Shell>
  )

  if (stage === 'closed') return (
    <Shell>
      <div className="text-center py-20">
        <p className="font-display text-2xl font-semibold mb-2">This role is no longer open</p>
        <p className="text-slate-500 text-sm">The hiring team has closed applications for this position.</p>
      </div>
    </Shell>
  )

  if (stage === 'submitted') return (
    <Shell job={job}>
      <div className="card text-center py-16 animate-fade-up">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold mb-2">Application submitted!</h2>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          We've sent a verification email to <strong>{email}</strong>.
          Click the link in that email to confirm your application.
        </p>
        <p className="text-xs text-slate-400 font-mono mt-4">Check your spam folder if you don't see it.</p>
      </div>
    </Shell>
  )

  const fileFields = job?.form_schema?.fields?.filter(f => f.field_type === 'file') ?? []
  const otherFields = job?.form_schema?.fields?.filter(f => f.field_type !== 'file') ?? []
  const requirements: string[] = Array.isArray(job?.requirements) ? job.requirements as string[] : []

  return (
    <Shell job={job}>
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up">
        {/* Job meta */}
        <div className="card">
          <h1 className="font-display text-3xl font-semibold mb-2">{job?.title}</h1>
          {(job?.location || job?.job_type || job?.salary_range) && (
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
              {job?.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
              {job?.job_type && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.job_type}</span>}
              {job?.salary_range && <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" />{job.salary_range}</span>}
            </div>
          )}
          <div className="prose-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-4">
            {job?.description}
          </div>
          {requirements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-2">Requirements</p>
              <ul className="space-y-1">
                {requirements.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Personal info */}
        <div className="card space-y-4">
          <h2 className="font-semibold">Your details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name <span className="text-red-400">*</span></label>
              <input className="field" placeholder="Adaeze Okafor" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email address <span className="text-red-400">*</span></label>
              <input type="email" className="field" placeholder="adaeze@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Phone <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
            <input type="tel" className="field" placeholder="+234 800 000 0000" value={phone}
              onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        {/* CV Upload */}
        <div className="card">
          <h2 className="font-semibold mb-4">CV / Resume <span className="text-red-400">*</span></h2>
          <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
            onChange={e => setCvFile(e.target.files?.[0] ?? null)} />

          {cvFile ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cvFile.name}</p>
                <p className="text-xs text-emerald-600 font-mono">{(cvFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={() => setCvFile(null)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-slate-400 hover:bg-slate-50 transition-all">
              <Upload className="w-8 h-8 text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload your CV</p>
                <p className="text-xs text-slate-400 font-mono mt-1">PDF, DOCX, TXT, MD, RTF, ODT · Max 10 MB</p>
              </div>
            </button>
          )}
        </div>

        {/* Extra file fields */}
        {fileFields.map(field => (
          <div key={field.id} className="card">
            <h2 className="font-semibold mb-4">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </h2>
            <input type="file" accept={ACCEPTED} required={field.required}
              onChange={e => setExtraFiles(prev => ({ ...prev, [field.id]: e.target.files?.[0] ?? null }))}
              className="field py-2" />
          </div>
        ))}

        {/* Cover note */}
        <div className="card">
          <label className="label mb-3">Cover note <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
          <textarea className="field min-h-[120px] resize-y"
            placeholder="Why are you interested in this role? What makes you a great fit?"
            value={coverNote} onChange={e => setCoverNote(e.target.value)} />
        </div>

        {/* Dynamic extra fields */}
        {otherFields.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-5">Application questions</h2>
            <DynamicForm
              fields={otherFields}
              values={fieldValues}
              onChange={handleFieldChange}
              disabled={submitting}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Submit */}
        <div className="pb-12">
          <button type="submit" className="btn-primary w-full text-base py-3.5" disabled={submitting}>
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting application…</>
              : 'Submit application →'
            }
          </button>
          <p className="text-xs text-slate-400 text-center mt-3 font-mono">
            You'll receive a verification email after submitting.
          </p>
        </div>
      </form>
    </Shell>
  )
}

function Shell({ children, job }: { children: React.ReactNode; job?: Job | null }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-slate-200 px-6 py-4 bg-paper/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-display text-xl font-semibold">HireFlow</span>
          {job && <p className="text-xs font-mono text-slate-400 truncate ml-4">{job.title}</p>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-10">{children}</div>
    </div>
  )
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  )
}
