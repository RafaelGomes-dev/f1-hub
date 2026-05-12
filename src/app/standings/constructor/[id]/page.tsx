async function getConstructorEntry(id: string) {
  try {
    const res = await fetch('https://f1api.dev/api/current/constructors-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.constructors_championship ?? []).find((c: any) => c.teamId === id) ?? null
  } catch {
    return null
  }
}

async function getConstructorRaces(id: string) {
  try {
    const res = await fetch(
      `https://api.jolpi.ca/ergast/f1/2026/constructors/${id}/results/?format=json&limit=30`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return (data?.MRData?.RaceTable?.Races ?? []) as any[]
  } catch {
    return []
  }
}

export default async function ConstructorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [entry, races] = await Promise.all([
    getConstructorEntry(id),
    getConstructorRaces(id),
  ])

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Voltar para Standings
        </a>
        <p className="text-zinc-400 mt-8">Equipe não encontrada.</p>
      </div>
    )
  }

  const team = entry.team
  const wins = races.filter((r: any) =>
    r.Results?.some((res: any) => res.position === '1')
  )

  // collect points per race (sum of both drivers)
  const racesSummary = races.map((r: any) => {
    const results: any[] = r.Results ?? []
    const totalPts = results.reduce((acc: number, res: any) => acc + Number(res.points ?? 0), 0)
    const best = results.reduce((best: any, res: any) =>
      !best || Number(res.position) < Number(best.position) ? res : best, null)
    return { race: r, totalPts, best, results }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Voltar para Standings
      </a>

      <div className="mt-4 mb-8">
        <h1 className="text-4xl font-bold text-red-500">{team.teamName}</h1>
        <p className="text-zinc-400 mt-1">{team.country}</p>
        <p className="text-zinc-500 text-sm mt-1">
          Desde {team.firstAppareance} · {team.constructorsChampionships} campeonatos de construtores
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{entry.position}°</div>
          <div className="text-zinc-500 text-xs mt-1">Campeonato</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <div className="text-3xl font-bold text-white">{entry.points}</div>
          <div className="text-zinc-500 text-xs mt-1">Pontos</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{entry.wins}</div>
          <div className="text-zinc-500 text-xs mt-1">Vitórias</div>
        </div>
      </div>

      {wins.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Vitórias em 2026</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {wins.map((race: any) => {
              const winner = race.Results?.find((r: any) => r.position === '1')
              return (
                <div key={race.round} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0">
                  <div className="text-yellow-400 font-bold text-lg">1°</div>
                  <div className="flex-1">
                    <div className="font-semibold">{race.raceName}</div>
                    <div className="text-xs text-zinc-500">
                      {winner ? `${winner.Driver?.givenName} ${winner.Driver?.familyName}` : ''} · {race.Circuit?.circuitName}
                    </div>
                  </div>
                  <div className="text-zinc-500 text-sm">
                    {new Date(race.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {racesSummary.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Resultados 2026</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {racesSummary.map(({ race, totalPts, results }) => (
              <div key={race.round} className="px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex-1 text-sm font-medium">{race.raceName}</span>
                  <span className="text-red-400 font-semibold text-sm">{totalPts} pts</span>
                </div>
                <div className="flex gap-4">
                  {results.map((res: any) => {
                    const pos = Number(res.position)
                    return (
                      <span key={res.Driver?.driverId} className={`text-xs
                        ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-zinc-300' : pos === 3 ? 'text-amber-600' : 'text-zinc-500'}`}>
                        {res.Driver?.familyName} {pos}°
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
