import StandingsTabs from '@/components/StandingsTabs'

async function getDriverStandings() {
  const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
    next: { revalidate: 300 }
  })
  const data = await res.json()
  return data?.drivers_championship ?? []
}

async function getConstructorStandings() {
  const res = await fetch('https://f1api.dev/api/current/constructors-championship', {
    next: { revalidate: 300 }
  })
  const data = await res.json()
  return data?.constructors_championship ?? []
}

export default async function StandingsPage() {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings()
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Standings</h1>
      <p className="text-zinc-500 text-sm mb-8">Campeonato Mundial de Fórmula 1 · 2026</p>
      <StandingsTabs drivers={drivers} constructors={constructors} />
    </div>
  )
}
