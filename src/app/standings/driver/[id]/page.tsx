async function getChampionshipEntry(id: string) {
  try {
    const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.drivers_championship ?? []).find((d: any) => d.driverId === id) ?? null
  } catch {
    return null
  }
}

async function getDriverRaces(id: string) {
  try {
    const res = await fetch(
      `https://api.jolpi.ca/ergast/f1/2026/drivers/${id}/results/?format=json&limit=30`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return (data?.MRData?.RaceTable?.Races ?? []) as any[]
  } catch {
    return []
  }
}

function parseBirthday(birthday: string): string {
  if (!birthday) return ''
  // handles both DD/MM/YYYY and YYYY-MM-DD
  if (birthday.includes('/')) {
    const [day, month, year] = birthday.split('/')
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('pt-BR')
  }
  return new Date(birthday).toLocaleDateString('pt-BR')
}

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [entry, races] = await Promise.all([
    getChampionshipEntry(id),
    getDriverRaces(id),
  ])

  const driver = entry?.driver ?? null
  const wins = races.filter((r: any) => r.Results?.[0]?.position === '1')

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Voltar para Standings
        </a>
        <p className="text-zinc-400 mt-8">Piloto não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Voltar para Standings
      </a>

      <div className="mt-4 mb-8">
        <h1 className="text-4xl font-bold">
          {driver.name} <span className="text-red-500">{driver.surname}</span>
        </h1>
        <p className="text-zinc-400 mt-1">
          {driver.nationality} · #{driver.number}
        </p>
        {driver.birthday && (
          <p className="text-zinc-500 text-sm mt-1">
            Nascido em {parseBirthday(driver.birthday)}
          </p>
        )}
        <p className="text-zinc-400 text-sm mt-1">{entry.team?.teamName}</p>
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
            {wins.map((race: any) => (
              <div key={race.round} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0">
                <div className="text-yellow-400 font-bold text-lg">1°</div>
                <div className="flex-1">
                  <div className="font-semibold">{race.raceName}</div>
                  <div className="text-xs text-zinc-500">{race.Circuit?.circuitName}</div>
                </div>
                <div className="text-zinc-500 text-sm">
                  {new Date(race.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {races.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Resultados 2026</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {races.map((race: any) => {
              const pos = Number(race.Results?.[0]?.position)
              const pts = race.Results?.[0]?.points ?? '0'
              return (
                <div key={race.round} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <span className={`w-7 text-center font-bold text-sm
                    ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-zinc-300' : pos === 3 ? 'text-amber-600' : 'text-zinc-500'}`}>
                    {pos}°
                  </span>
                  <div className="flex-1 text-sm font-medium">{race.raceName}</div>
                  <div className="text-red-400 font-semibold text-sm">{pts} pts</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
