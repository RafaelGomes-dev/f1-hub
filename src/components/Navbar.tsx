'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flag, Trophy, Users, Newspaper } from 'lucide-react'

const links = [
  { href: '/',          label: 'Calendário', icon: Flag      },
  { href: '/standings', label: 'Classificação', icon: Trophy    },
  { href: '/drivers',   label: 'Pilotos',    icon: Users     },
  { href: '/news',      label: 'Notícias',   icon: Newspaper },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-zinc-900 border-b border-red-600 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-8 h-16">
        <Link href="/" className="text-red-500 font-bold text-2xl tracking-wider">
          F1<span className="text-white">Central</span>
        </Link>
        <div className="flex gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${pathname === href
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}