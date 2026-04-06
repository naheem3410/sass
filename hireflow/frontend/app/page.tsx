import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-display text-2xl font-semibold tracking-tight">HireFlow</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-light border border-amber/30 rounded-full text-xs font-mono text-amber-dark mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
              Built for Nigeria. Ready for the world.
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-semibold leading-[1.05] mb-6">
              Hire smarter,<br />
              <em className="not-italic text-amber">not harder.</em>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl">
              HireFlow is an AI-powered hiring OS. Post jobs, screen candidates,
              score CVs, and manage your pipeline — all from one place.
              No job board. No middleman. Just your link, your candidates.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/register" className="btn-amber text-base px-7 py-3">
                Start hiring free
              </Link>
              <Link href="#how" className="btn-ghost text-base">
                See how it works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-slate-200 bg-slate-50 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono text-slate-400 text-center tracking-widest uppercase">
            The complete hiring loop — post → screen → score → hire
          </p>
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="font-mono text-xs text-amber-dark uppercase tracking-widest mb-3">How it works</p>
          <h2 className="font-display text-4xl font-semibold">From post to hire in minutes.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              n: '01',
              title: 'Post with AI assist',
              body: 'Write your job description with AI — trained on your company context. Generate a public link and share it anywhere: LinkedIn, WhatsApp, email.',
            },
            {
              n: '02',
              title: 'Candidates apply',
              body: "Candidates apply via your link. No accounts needed. They verify their identity via email OTP. You collect exactly the data you need with a custom application form.",
            },
            {
              n: '03',
              title: 'AI scores & ranks',
              body: 'Every CV is extracted, parsed, and scored against your job description. You see a ranked list with strengths, gaps, and an AI summary for every candidate.',
            },
          ].map((step) => (
            <div key={step.n} className="card group hover:border-slate-300 transition-colors">
              <span className="font-mono text-3xl font-medium text-slate-200 group-hover:text-amber/40 transition-colors block mb-4">
                {step.n}
              </span>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-display text-4xl font-semibold">Everything you need. Nothing you don't.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ['AI Job Descriptions', 'Generate role-specific JDs using your company profile as context.'],
              ['Custom Application Forms', 'Build forms with 12 field types — text, select, file upload, and more.'],
              ['CV Parsing', 'Supports PDF, DOCX, TXT, MD, RTF, ODT. Automatic text extraction.'],
              ['AI Candidate Scoring', 'Every candidate scored 0–100 with breakdown across skills, experience, and education.'],
              ['Email Verification', 'Candidates verify identity via a secure link + time-limited OTP. No accounts.'],
              ['Pipeline Management', 'Move candidates from New → Shortlisted → Interview → Hired with one click.'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="border border-white/10 rounded-xl p-5 hover:border-amber/40 hover:bg-white/5 transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-amber mb-4 group-hover:scale-125 transition-transform" />
                <h3 className="font-medium mb-1.5">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-5xl font-semibold mb-4">
          Ready to hire?
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Create your free account. Your first job post is live in under 5 minutes.
        </p>
        <Link href="/register" className="btn-amber text-base px-8 py-3">
          Create free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="font-display font-semibold">HireFlow</span>
          <p className="text-xs text-slate-400 font-mono">© {new Date().getFullYear()} HireFlow. Lagos, Nigeria.</p>
        </div>
      </footer>
    </div>
  )
}
