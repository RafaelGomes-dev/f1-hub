import Link from 'next/link'
import { fetchDriverHeadshots, getTeamColor } from '@/lib/f1Images'

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

async function getTeammate(driverId: string, teamName: string) {
  if (!teamName) return null
  try {
    const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    const drivers = (data?.drivers_championship ?? []) as any[]
    return drivers.find(
      (d: any) => d.driverId !== driverId && d.team?.teamName === teamName
    ) ?? null
  } catch {
    return null
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

function parseBirthday(birthday: string): string {
  if (!birthday) return ''
  if (birthday.includes('/')) {
    const [day, month, year] = birthday.split('/')
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('pt-BR')
  }
  return new Date(birthday).toLocaleDateString('pt-BR')
}

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getChampionshipEntry(id)

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

  const driver = entry.driver ?? null

  if (!driver) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Voltar para Standings
        </a>
        <p className="text-zinc-400 mt-8">Dados do piloto indisponíveis.</p>
      </div>
    )
  }

  const [allRaces, teammate, headshots] = await Promise.all([
    getAllRaces(),
    getTeammate(id, entry.team?.teamName ?? ''),
    fetchDriverHeadshots(),
  ])

  const today = new Date()
  const pastRaces = allRaces.filter(
    (r: any) => r.schedule?.race?.date && new Date(r.schedule.race.date) < today
  )
  const fastestLaps = pastRaces.filter((r: any) => r.fast_lap?.fast_lap_driver_id === id)
  const pointsDiff = teammate ? Number(entry.points) - Number(teammate.points) : null
  const teamColor = getTeamColor(entry.team?.teamName ?? '')
  const headshot = headshots[String(driver.number)]
  const teammateHeadshot = teammate ? headshots[String(teammate.driver?.number)] : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Voltar para Standings
      </a>

      <div className="mt-4 mb-8 flex items-start gap-5">
        {headshot ? (
          <img
            src={headshot}
            alt=""
            className="w-24 h-24 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0 border-2"
            style={{ borderColor: `${teamColor}60` }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full bg-zinc-800 flex-shrink-0 border-2"
            style={{ borderColor: `${teamColor}60` }}
          />
        )}
        <div>
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
          <p className="text-sm mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
            <span className="text-zinc-400">{entry.team?.teamName}</span>
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

      {teammate && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Companheiro de Equipe</h2>
          <Link
            href={`/standings/driver/${teammate.driverId}`}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-4 hover:border-red-600/50 transition-colors"
          >
            {teammateHeadshot ? (
              <img
                src={teammateHeadshot}
                alt=""
                className="w-12 h-12 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{teammate.driver?.name} {teammate.driver?.surname}</div>
              <div className="text-zinc-500 text-sm mt-0.5">#{teammate.driver?.number} · {teammate.driver?.nationality}</div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <div className="font-bold text-red-400">{teammate.position}°</div>
                <div className="text-zinc-600 text-xs">Campeonato</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white">{teammate.points}</div>
                <div className="text-zinc-600 text-xs">Pontos</div>
              </div>
              {pointsDiff !== null && pointsDiff !== 0 && (
                <div className={`text-sm font-bold px-2 py-1 rounded ${pointsDiff > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {pointsDiff > 0 ? `+${pointsDiff}` : pointsDiff}
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {pastRaces.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Temporada 2026</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {pastRaces.map((race: any) => {
              const isWin = race.winner?.driverId === id
              const isFL = race.fast_lap?.fast_lap_driver_id === id
              return (
                <div key={race.round} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <span className={`w-7 text-center font-bold text-sm ${isWin ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    {isWin ? '1°' : '–'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{race.raceName}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {race.circuit?.country} · Round {race.round}
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
