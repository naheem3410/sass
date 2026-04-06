// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  role: 'business' | 'candidate'
  created_at: string
}

// ── Company ───────────────────────────────────────────────────────────────────
export interface Company {
  id: number
  user_id: number
  name: string
  website: string | null
  industry: string | null
  size: string | null
  description: string
  tagline: string | null
  created_at: string
}

// ── Job form ──────────────────────────────────────────────────────────────────
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'phone'
  | 'date' | 'select' | 'radio' | 'checkbox' | 'boolean' | 'file' | 'range'

export interface FieldOption {
  label: string
  value: string
}

export interface FormField {
  id: string
  label: string
  field_type: FieldType
  required: boolean
  placeholder?: string
  options?: FieldOption[]
  min_value?: number
  max_value?: number
  max_length?: number
}

export interface JobFormSchema {
  fields: FormField[]
}

// ── Job ───────────────────────────────────────────────────────────────────────
export type JobStatus = 'active' | 'closed' | 'draft'

export interface Job {
  id: number
  company_id: number
  title: string
  description: string
  requirements: string[]
  location: string | null
  job_type: string | null
  salary_range: string | null
  form_schema: JobFormSchema
  slug: string
  status: JobStatus
  created_at: string
}

// ── Candidate / Application ───────────────────────────────────────────────────
export type ApplicationStatus =
  | 'pending_verification'
  | 'new'
  | 'needs_review'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'hired'

export interface ScoreBreakdown {
  skills_match: number
  experience_relevance: number
  education_fit: number
}

export interface Candidate {
  id: number
  candidate_name: string
  candidate_email: string
  candidate_phone: string | null
  ai_score: number | null
  score_breakdown: ScoreBreakdown | null
  score_summary: string | null
  status: ApplicationStatus
  form_responses: Record<string, unknown> | null
  cv_path: string | null
  applied_at: string
}

// ── AI outputs ────────────────────────────────────────────────────────────────
export interface JobDescriptionSuggestion {
  summary: string
  responsibilities: string[]
  required_qualifications: string[]
  preferred_qualifications: string[]
  what_we_offer: string[]
}
