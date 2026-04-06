'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { Job, Company } from '@/types'
import { Plus, ExternalLink, Users, Briefcase } from 'lucide-react'
import { timeAgo, statusColor } from '@/lib/utils'

export default function DashboardPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiJson<Company>('/api/companies/me').catch(() => null),
      apiJson<{ jobs: Job[] }>('/api/jobs').then(d => d.jobs).catch(() => []),
    ]).then(([c, j]) => {
      setCompany(c)
      setJobs(j)
      setLoading(false)
    })
  }, [])

  const activeJobs = jobs.filter(j => j.status === 'active')

  if (loading) return <DashSkeleton />

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">
            {company ? `${company.name}` : 'Dashboard'}
          </h1>
          {company?.tagline && <p className="text-slate-500 text-sm">{company.tagline}</p>}
        </div>
        <Link href="/dashboard/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total jobs', value: jobs.length, icon: Briefcase },
          { label: 'Active jobs', value: activeJobs.length, icon: Briefcase },
          { label: 'Draft jobs', value: jobs.filter(j => j.status === 'draft').length, icon: Briefcase },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="font-display text-4xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">All jobs</h2>
        <Link href="/dashboard/jobs/new" className="btn-ghost text-xs">+ Post a job</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-medium mb-1">No jobs yet</p>
          <p className="text-sm text-slate-400 mb-5">Create your first job post and start receiving applications.</p>
          <Link href="/dashboard/jobs/new" className="btn-primary">Create job post</Link>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {jobs.map(job => (
            <div key={job.id} className="card flex items-center justify-between gap-4 py-4 hover:border-slate-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-medium hover:underline truncate">
                    {job.title}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${statusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {[job.location, job.job_type].filter(Boolean).join(' · ')} · posted {timeAgo(job.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/candidates/${job.id}`} className="btn-ghost text-xs gap-1">
                  <Users className="w-3.5 h-3.5" /> Candidates
                </Link>
                <a
                  href={`/apply/${job.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View post
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DashSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mb-10" />
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[1,2,3].map(i => <div key={i} className="card h-24 bg-slate-100" />)}
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i => <div key={i} className="card h-16 bg-slate-100" />)}
      </div>
    </div>
  )
}
