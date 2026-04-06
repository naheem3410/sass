import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dot-grid flex flex-col">
      <nav className="px-6 py-5">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          HireFlow
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </div>
    </div>
  )
}
