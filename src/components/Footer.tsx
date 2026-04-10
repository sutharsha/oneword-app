import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
      <div className="flex items-center justify-center gap-4">
        <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
          Privacy
        </Link>
        <span className="text-zinc-700">·</span>
        <Link href="/terms" className="hover:text-zinc-300 transition-colors">
          Terms
        </Link>
        <span className="text-zinc-700">·</span>
        <span>© {new Date().getFullYear()} OneWord</span>
      </div>
    </footer>
  )
}
