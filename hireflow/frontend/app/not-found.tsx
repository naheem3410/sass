import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center text-center px-4">
      <p className="font-mono text-7xl font-medium text-slate-200 mb-4">404</p>
      <h1 className="font-display text-3xl font-semibold mb-2">Page not found</h1>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/" className="btn-primary">Go home</Link>
    </div>
  )
}
