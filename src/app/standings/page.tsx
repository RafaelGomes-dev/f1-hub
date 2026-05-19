import StandingsTabs from '@/components/StandingsTabs'
import YearSelector from '@/components/YearSelector'
import { fetchDriverHeadshots } from '@/lib/f1Images'

const CURRENT_YEAR = new Date().getFullYear()
const AVAILABLE_YEARS = [0, 1, 2, 3].map(n => CURRENT_YEAR - n)

async function getDriverStandings(year: number) {
  try {
    const slug = year === CURRENT_YEAR ? 'current' : String(year)
    const res = await fetch(`https://f1api.dev/api/${slug}/drivers-championship`, {
      next: { revalidate: 300 }
    })
    const data = await res.json()
    return data?.drivers_championship ?? []
  } catch {
    return []
  }
}

async function getConstructorStandings(year: number) {
  try {
    const slug = year === CURRENT_YEAR ? 'current' : String(year)
    const res = await fetch(`https://f1api.dev/api/${slug}/constructors-championship`, {
      next: { revalidate: 300 }
    })
    const data = await res.json()
    return data?.constructors_championship ?? []
  } catch {
    return []
  }
}

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const year = yearParam && AVAILABLE_YEARS.includes(Number(yearParam))
    ? Number(yearParam)
    : CURRENT_YEAR

  const [drivers, constructors, headshots] = await Promise.all([
    getDriverStandings(year),
    getConstructorStandings(year),
    fetchDriverHeadshots(year),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Classificação</h1>
      <p className="text-zinc-500 text-sm mb-4">Campeonato Mundial de Fórmula 1</p>
      <YearSelector selectedYear={year} years={AVAILABLE_YEARS} currentYear={CURRENT_YEAR} />
      <StandingsTabs drivers={drivers} constructors={constructors} headshots={headshots} />
    </div>
  )
}
