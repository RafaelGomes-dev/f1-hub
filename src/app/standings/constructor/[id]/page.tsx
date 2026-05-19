import Link from 'next/link'
import { fetchDriverHeadshots, getTeamColor } from '@/lib/f1Images'

const CURRENT_YEAR = new Date().getFullYear()

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

async function getTeamDrivers(teamName: string) {
  try {
    const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.drivers_championship ?? []).filter(
      (d: any) => d.team?.teamName === teamName
    ) as any[]
  } catch {
    return []
  }
}

async function getAllRaces() {
  try {
    const res = await fetch('https://f1api.dev/api/current', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.races ?? []) as any[]
  } catch {
    return []
  }
}

export default async function ConstructorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getConstructorEntry(id)

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Classificação
        </a>
        <p className="text-zinc-400 mt-8">Equipe não encontrada.</p>
      </div>
    )
  }

  const team = entry.team ?? null

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Classificação
        </a>
        <p className="text-zinc-400 mt-8">Dados da equipe indisponíveis.</p>
      </div>
    )
  }

  const [allRaces, teamDrivers, headshots] = await Promise.all([
    getAllRaces(),
    getTeamDrivers(team.teamName),
    fetchDriverHeadshots(),
  ])

  const today = new Date()
  const pastRaces = allRaces.filter(
    (r: any) => r.schedule?.race?.date && new Date(r.schedule.race.date) < today
  )
  const fastestLaps = pastRaces.filter((r: any) => r.fast_lap?.fast_lap_team_id === id)
  const teamColor = getTeamColor(team.teamName)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Classificação
      </a>

      <div className="mt-4 mb-8 flex items-start gap-4">
        <div
          className="w-1.5 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: teamColor }}
        />
        <div>
          <h1 className="text-4xl font-bold" style={{ color: teamColor }}>{team.teamName}</h1>
          <p className="text-zinc-400 mt-1">{team.country}</p>
          <p className="text-zinc-500 text-sm mt-1">
            Na F1 desde {team.firstAppareance}
            {team.constructorsChampionships ? ` · ${team.constructorsChampionships}× construtores` : ''}
            {team.driversChampionships ? ` · ${team.driversChampionships}× pilotos` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
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
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{fastestLaps.length}</div>
          <div className="text-zinc-500 text-xs mt-1">Voltas rápidas</div>
        </div>
      </div>

      {teamDrivers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Pilotos {CURRENT_YEAR}</h2>
          <div className="grid grid-cols-2 gap-3">
            {teamDrivers.map((d: any) => {
              const headshot = headshots[String(d.driver?.number)]
              return (
                <Link
                  key={d.driverId}
                  href={`/standings/driver/${d.driverId}`}
                  className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-red-600/50 transition-colors block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {headshot ? (
                      <img
                        src={headshot}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold">{d.driver?.name} {d.driver?.surname}</div>
                      <div className="text-zinc-500 text-sm mt-0.5">
                        #{d.driver?.number}{d.driver?.nationality ? ` · ${d.driver.nationality}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className={`font-bold text-lg ${Number(d.position) <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {d.position}°
                      </div>
                      <div className="text-zinc-600 text-xs">Campeonato</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-white">{d.points}</div>
                      <div className="text-zinc-600 text-xs">Pontos</div>
                    </div>
                    {d.wins > 0 && (
                      <div>
                        <div className="font-bold text-lg text-yellow-400">{d.wins}</div>
                        <div className="text-zinc-600 text-xs">Vitórias</div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {pastRaces.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Temporada {CURRENT_YEAR}</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {pastRaces.map((race: any) => {
              const isWin = race.teamWinner?.teamId === id
              const isFL = race.fast_lap?.fast_lap_team_id === id
              const winnerDriver = isWin ? race.winner : null
              return (
                <div key={race.round} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <span className={`w-7 text-center font-bold text-sm ${isWin ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    {isWin ? '1°' : '–'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{race.raceName}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {race.circuit?.country} · R{race.round}
                      {winnerDriver && ` · ${winnerDriver.name} ${winnerDriver.surname}`}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    {isWin && (
                      <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                        VITÓRIA
                      </span>
                    )}
                    {isFL && (
                      <span className="text-xs bg-purple-400/10 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded-full">
                        VR
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 text-sm">
                    {new Date(race.schedule.race.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
