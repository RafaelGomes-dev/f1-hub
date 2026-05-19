'use client'
import { useRouter } from 'next/navigation'

export default function YearSelector({
  selectedYear,
  years,
  basePath = '/standings',
  currentYear,
}: {
  selectedYear: number
  years: number[]
  basePath?: string
  currentYear: number
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1.5 text-xs mb-8">
      <span className="text-zinc-600">Ver temporada:</span>
      {years.map((year, i) => (
        <span key={year} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-zinc-700">·</span>}
          <button
            onClick={() => router.push(year === currentYear ? basePath : `${basePath}?year=${year}`)}
            className={`transition-colors ${
              year === selectedYear
                ? 'text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {year}
          </button>
        </span>
      ))}
    </div>
  )
}
