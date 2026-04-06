'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiJson, apiFetch } from '@/lib/api'
import { Candidate, Job, ScoreBreakdown } from '@/types'
import { scoreColor, scoreBarColor, statusColor, statusLabel, timeAgo } from '@/lib/utils'
import {
  AlertTriangle, ChevronDown, ChevronUp, Download,
  Mail, Phone, Loader2, Users
} from 'lucide-react'

const PIPELINE_STATUSES = ['new','shortlisted','interview','rejected','hired']

export default function CandidatesPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [advancing, setAdvancing] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      apiJson<Job>(`/api/jobs/${jobId}`),
      apiJson<{ candidates: Candidate[] }>(`/api/jobs/${jobId}/candidates`).then(d => d.candidates),
    ]).then(([j, c]) => {
      setJob(j)
      setCandidates(c)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [jobId])

  async function advanceStatus(candidateId: number, status: string) {
    setAdvancing(candidateId)
    try {
      await apiJson(`/api/jobs/${jobId}/candidates/${candidateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: status as Candidate['status'] } : c))
    } finally {
      setAdvancing(null)
    }
  }

  async function downloadDoc(candidateId: number, name: string) {
    const res = await apiFetch(`/api/applications/${candidateId}/document`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CV-${name.replace(/\s+/g, '-')}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.status === filter)

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-56" />
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-slate-400 mb-1 cursor-pointer hover:underline" onClick={() => router.push('/dashboard')}>
            Dashboard /
          </p>
          <h1 className="font-display text-3xl font-semibold">{job?.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} · ranked by AI score
          </p>
        </div>
        <button onClick={() => router.push(`/dashboard/jobs/${jobId}`)} className="btn-secondary text-sm">
          Edit job
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['all', ...PIPELINE_STATUSES, 'needs_review'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filter === s
                ? 'bg-ink text-paper'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {s === 'all' ? `All (${candidates.length})` : `${statusLabel(s)} (${candidates.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Candidates list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-medium mb-1">No candidates yet</p>
          <p className="text-sm text-slate-400">Share the public job link to start receiving applications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((candidate, idx) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              rank={candidates.indexOf(candidate) + 1}
              isExpanded={expanded === candidate.id}
              onToggle={() => setExpanded(expanded === candidate.id ? null : candidate.id)}
              onAdvance={(status) => advanceStatus(candidate.id, status)}
              onDownload={() => downloadDoc(candidate.id, candidate.candidate_name)}
              advancing={advancing === candidate.id}
              job={job}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono font-medium">{Math.round(value)}</span>
      </div>
      <div className="score-bar-track">
        <div className={`h-full rounded-full transition-all ${scoreBarColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function CandidateCard({
  candidate, rank, isExpanded, onToggle, onAdvance, onDownload, advancing, job
}: {
  candidate: Candidate
  rank: number
  isExpanded: boolean
  onToggle: () => void
  onAdvance: (status: string) => void
  onDownload: () => void
  advancing: boolean
  job: Job | null
}) {
  const bd: ScoreBreakdown | null = typeof candidate.score_breakdown === 'string'
    ? JSON.parse(candidate.score_breakdown)
    : candidate.score_breakdown

  const formResponses: Record<string, unknown> = typeof candidate.form_responses === 'string'
    ? JSON.parse(candidate.form_responses)
    : (candidate.form_responses ?? {})

  const formFields = job?.form_schema?.fields ?? []

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
      isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={onToggle}>
        {/* Rank */}
        <span className="font-mono text-sm text-slate-300 w-6 text-right shrink-0">#{rank}</span>

        {/* Score badge */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display text-lg font-semibold ${
          candidate.ai_score != null ? scoreColor(candidate.ai_score) : 'bg-slate-100 text-slate-400'
        }`}>
          {candidate.ai_score != null ? Math.round(candidate.ai_score) : '—'}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium truncate">{candidate.candidate_name}</p>
            {candidate.status === 'needs_review' && (
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ${statusColor(candidate.status)}`}>
              {statusLabel(candidate.status)}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">
            {candidate.candidate_email} · applied {timeAgo(candidate.applied_at)}
          </p>
          {candidate.score_summary && !isExpanded && (
            <p className="text-xs text-slate-500 mt-1 truncate">{candidate.score_summary}</p>
          )}
        </div>

        {/* Score bars (compact) */}
        {bd && !isExpanded && (
          <div className="hidden md:flex gap-3 shrink-0">
            {[
              { label: 'Skills', val: bd.skills_match },
              { label: 'Exp', val: bd.experience_relevance },
              { label: 'Edu', val: bd.education_fit },
            ].map(({ label, val }) => (
              <div key={label} className="w-14">
                <p className="text-xs text-slate-400 font-mono mb-1 text-center">{label}</p>
                <div className="score-bar-track">
                  <div className={`h-full rounded-full ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="shrink-0 text-slate-300">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-6 bg-slate-50/50">
          {/* AI Summary */}
          {candidate.score_summary && (
            <div>
              <p className="label">AI recruiter summary</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg border border-slate-100 px-4 py-3">
                {candidate.score_summary}
              </p>
            </div>
          )}

          {/* needs_review notice */}
          {candidate.status === 'needs_review' && (
            <div className="flex items-start gap-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Document could not be processed</p>
                <p className="text-orange-600 text-xs mt-0.5">Please request a re-upload or review the CV manually below.</p>
              </div>
            </div>
          )}

          {/* Score breakdown */}
          {bd && (
            <div>
              <p className="label mb-3">Score breakdown</p>
              <div className="grid grid-cols-3 gap-4">
                <ScoreBar label="Skills match" value={bd.skills_match} />
                <ScoreBar label="Experience" value={bd.experience_relevance} />
                <ScoreBar label="Education fit" value={bd.education_fit} />
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="label mb-2">Contact</p>
            <div className="flex items-center gap-4 text-sm">
              <a href={`mailto:${candidate.candidate_email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-ink">
                <Mail className="w-4 h-4" /> {candidate.candidate_email}
              </a>
              {candidate.candidate_phone && (
                <a href={`tel:${candidate.candidate_phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-ink">
                  <Phone className="w-4 h-4" /> {candidate.candidate_phone}
                </a>
              )}
            </div>
          </div>

          {/* Form responses */}
          {formFields.length > 0 && Object.keys(formResponses).length > 0 && (
            <div>
              <p className="label mb-3">Application responses</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {formFields.map(field => {
                  const val = formResponses[field.id]
                  if (val == null || val === '') return null
                  return (
                    <div key={field.id} className="bg-white rounded-lg border border-slate-100 px-4 py-3">
                      <p className="text-xs font-mono text-slate-400 mb-1">{field.label}</p>
                      <p className="text-sm text-slate-700">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button onClick={onDownload} className="btn-secondary text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download CV
            </button>

            <div className="flex items-center gap-2">
              {advancing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              {PIPELINE_STATUSES.filter(s => s !== candidate.status).map(s => (
                <button
                  key={s}
                  onClick={() => onAdvance(s)}
                  disabled={advancing}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 ${
                    s === 'hired' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' :
                    s === 'rejected' ? 'border-red-200 text-red-600 hover:bg-red-50' :
                    s === 'interview' ? 'border-indigo-200 text-indigo-700 hover:bg-indigo-50' :
                    s === 'shortlisted' ? 'border-violet-200 text-violet-700 hover:bg-violet-50' :
                    'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  → {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
