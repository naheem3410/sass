# HireFlow Frontend

Next.js 14 App Router frontend for HireFlow — AI-powered hiring OS.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Fonts | Fraunces (display) · DM Mono · Sora (body) |
| Icons | Lucide React |
| Auth | HttpOnly cookies — zero localStorage |

---

## Quick start

```bash
cd frontend
npm install

# Configure API URL
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | — | Marketing landing page |
| `/register` | — | Business registration |
| `/login` | — | Business login |
| `/onboarding` | Cookie | Company setup + AI description generation |
| `/dashboard` | Cookie | Job list overview + stats |
| `/dashboard/jobs/new` | Cookie | Create job with form builder + AI JD suggestion |
| `/dashboard/jobs/[id]` | Cookie | Edit job, manage status, copy public link |
| `/dashboard/candidates/[jobId]` | Cookie | Ranked candidates, pipeline, CV download |
| `/apply/[jobSlug]` | — | Public candidate application form |
| `/apply/verify` | — | OTP verification (6-digit input) |

---

## Architecture

```
frontend/
├── app/
│   ├── layout.tsx             # Root layout — Google Fonts, body class
│   ├── globals.css            # Design tokens, dot-grid, utility classes
│   ├── page.tsx               # Landing page
│   ├── not-found.tsx
│   ├── (auth)/
│   │   ├── layout.tsx         # Auth shell (nav + centered card)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── onboarding/page.tsx    # 2-step: generate → refine → save
│   ├── dashboard/
│   │   ├── layout.tsx         # Sidebar navigation
│   │   ├── page.tsx           # Overview + job list
│   │   ├── jobs/
│   │   │   ├── page.tsx       # Redirects to /dashboard
│   │   │   ├── new/page.tsx   # Job creation with AI + form builder
│   │   │   └── [id]/page.tsx  # Job edit + public URL copy
│   │   └── candidates/
│   │       └── [jobId]/page.tsx  # Ranked candidates dashboard
│   └── apply/
│       ├── [jobSlug]/page.tsx # Public application form
│       └── verify/page.tsx   # OTP verification
├── components/
│   ├── FormBuilder.tsx        # Drag-reorder field editor (hiring manager)
│   └── DynamicForm.tsx        # Renders form_schema for candidates
├── lib/
│   ├── api.ts                 # apiFetch / apiUpload / apiJson — credentials:include
│   └── utils.ts               # timeAgo, scoreColor, statusLabel, generateFieldId
└── types/
    └── index.ts               # All TypeScript interfaces
```

---

## Design system

**Palette**
- `ink` `#0D0D0D` — primary text, buttons
- `paper` `#FAF9F6` — background
- `amber` `#E8A020` — accent, AI features, CTAs
- `slate-*` — supporting grays

**Typography**
- Display headings: `Fraunces` (old-style serif with optical sizes)
- Labels/code: `DM Mono`
- Body: `Sora`

**Key utility classes** (defined in `globals.css`)
- `.field` — form inputs with focus ring
- `.label` — mono uppercase field labels
- `.btn-primary` / `.btn-secondary` / `.btn-amber` / `.btn-ghost`
- `.card` — white bordered container
- `.dot-grid` — radial dot pattern background
- `.stagger` — auto-staggers children with `animation-delay`

---

## Auth notes

- Auth uses **HttpOnly cookies** set by the backend. The frontend never reads tokens.
- Every API call uses `credentials: 'include'` — handled by `lib/api.ts`.
- No `localStorage`, no `Authorization` headers, no token management anywhere.
- The backend sets the cookie on login/register and clears it on logout.
