import Link from 'next/link'
import { fetchDriverHeadshots, getTeamColor } from '@/lib/f1Images'

const CURRENT_YEAR = new Date().getFullYear()

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

async function getDriverRaceResults(id: string) {
  try {
    const res = await fetch(`https://f1api.dev/api/current/drivers/${id}`, {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.results ?? []) as any[]
  } catch {
    return []
  }
}

async function getCareerHistory(id: string) {
  const pastYears = [1, 2, 3].map(n => CURRENT_YEAR - n)
  const results = await Promise.allSettled(
    pastYears.map(async year => {
      const res = await fetch(`https://f1api.dev/api/${year}/drivers-championship`, {
        next: { revalidate: 86400 },
      })
      const data = await res.json()
      const entry = (data?.drivers_championship ?? []).find((d: any) => d.driverId === id)
      if (!entry) return null
      return {
        year,
        position: entry.position,
        points: entry.points,
        wins: entry.wins,
        teamName: entry.team?.teamName ?? '',
      }
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<NonNullable<any>> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value)
    .sort((a, b) => b.year - a.year)
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
    const res = await fetch('https://f1api.dev/api/current', { next: { revalidate: 300 } })
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

function positionColor(pos: any, retired: any): string {
  if (retired || pos === 'NC' || pos === null) return 'text-red-400'
  const n = Number(pos)
  if (n === 1) return 'text-yellow-400'
  if (n === 2) return 'text-zinc-300'
  if (n === 3) return 'text-amber-500'
  if (n <= 10) return 'text-white'
  return 'text-zinc-400'
}

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getChampionshipEntry(id)

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Classificação
        </Link>
        <p className="text-zinc-400 mt-8">Piloto não encontrado.</p>
      </div>
    )
  }

  const driver = entry.driver ?? null
  if (!driver) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Classificação
        </Link>
        <p className="text-zinc-400 mt-8">Dados do piloto indisponíveis.</p>
      </div>
    )
  }

  const [raceResults, allRaces, careerHistory, teammate, headshots] = await Promise.all([
    getDriverRaceResults(id),
    getAllRaces(),
    getCareerHistory(id),
    getTeammate(id, entry.team?.teamName ?? ''),
    fetchDriverHeadshots(),
  ])

  const today = new Date()
  const pastRaces = allRaces.filter(
    (r: any) => r.schedule?.race?.date && new Date(r.schedule.race.date) < today
  )
  const fastestLapRounds = new Set(
    pastRaces.filter((r: any) => r.fast_lap?.fast_lap_driver_id === id).map((r: any) => r.round)
  )

  const podiums = raceResults.filter(r => {
    const pos = Number(r.result?.finishingPosition)
    return !isNaN(pos) && pos <= 3
  }).length
  const poles = raceResults.filter(r => Number(r.result?.gridPosition) === 1).length
  const pointsDiff = teammate ? Number(entry.points) - Number(teammate.points) : null
  const teamColor = getTeamColor(entry.team?.teamName ?? '')
  const headshot = headshots[String(driver.number)]
  const teammateHeadshot = teammate ? headshots[String(teammate.driver?.number)] : null

  const maxRacePts = Math.max(...raceResults.map(r => Number(r.result?.pointsObtained ?? 0)), 1)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/standings" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Classificação
      </Link>

      {/* Header */}
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
          <p className="text-zinc-400 mt-1">{driver.nationality} · #{driver.number}</p>
          {driver.birthday && (
            <p className="text-zinc-500 text-sm mt-1">Nascido em {parseBirthday(driver.birthday)}</p>
          )}
          <p className="text-sm mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
            <span className="text-zinc-400">{entry.team?.teamName}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <StatCard value={`${entry.position}°`} label="Campeonato" color="text-red-400" />
        <StatCard value={entry.points} label="Pontos" color="text-white" />
        <StatCard value={entry.wins} label="Vitórias" color="text-yellow-400" />
        <StatCard value={podiums} label="Pódios" color="text-amber-500" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value={poles} label="Poles" color="text-sky-400" small />
        <StatCard value={fastestLapRounds.size} label="Voltas rápidas" color="text-purple-400" small />
        <StatCard
          value={raceResults.length > 0 ? (Number(entry.points) / raceResults.length).toFixed(1) : '—'}
          label="Pts / corrida"
          color="text-zinc-300"
          small
        />
      </div>

      {/* Points per race chart */}
      {raceResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Pontos por corrida</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 px-4 pt-4 pb-3">
            <div className="flex items-end gap-1 h-14">
              {raceResults.map((r: any, i: number) => {
                const pts = Number(r.result?.pointsObtained ?? 0)
                const heightPct = pts > 0 ? Math.max(10, (pts / maxRacePts) * 100) : 3
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: pts > 0 ? '#ef4444' : '#3f3f46',
                    }}
                    title={`R${r.race.round}: ${pts} pts`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-zinc-700">
              <span>R1</span>
              <span>R{raceResults.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Race results */}
      {raceResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Temporada {CURRENT_YEAR}</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {raceResults.map((r: any) => {
              const pos = r.result?.finishingPosition
              const grid = r.result?.gridPosition
              const pts = Number(r.result?.pointsObtained ?? 0)
              const retired = r.result?.retired
              const posNum = Number(pos)
              const gridNum = Number(grid)
              const diff = (!retired && pos !== 'NC' && pos !== null && pos !== undefined && !isNaN(posNum) && !isNaN(gridNum)) ? gridNum - posNum : null
              const isFL = fastestLapRounds.has(r.race.round)
              const sprint = r.sprintResult
              const displayPos = retired ? 'DNF' : (pos === 'NC' ? 'NC' : pos !== null ? `${pos}°` : '—')

              return (
                <div key={r.race.round} className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  {/* Position */}
                  <span className={`w-10 text-center text-sm font-bold flex-shrink-0 ${positionColor(pos, retired)}`}>
                    {displayPos}
                  </span>

                  {/* Race info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/race/${r.race.round}`} className="text-sm font-medium hover:text-red-400 transition-colors line-clamp-1">
                      {r.race.name.replace(/^Formula 1\s+/i, '').replace(/\s+\d{4}$/, '')}
                    </Link>
                    <div className="text-xs text-zinc-600 mt-0.5">
                      {r.race.circuit?.country} · R{r.race.round}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1 flex-shrink-0">
                    {isFL && (
                      <span className="text-xs bg-purple-400/10 text-purple-400 border border-purple-400/20 px-1.5 py-0.5 rounded-full">VR</span>
                    )}
                    {sprint && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                        S{sprint.finishingPosition === 'NC' ? 'NC' : `${sprint.finishingPosition}°`}
                      </span>
                    )}
                  </div>

                  {/* Grid → Finish diff */}
                  {diff !== null && (
                    <span className={`text-xs font-mono w-7 text-right flex-shrink-0 ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                    </span>
                  )}

                  {/* Points */}
                  <span className={`text-sm font-mono w-8 text-right flex-shrink-0 ${pts > 0 ? 'text-white' : 'text-zinc-600'}`}>
                    {pts > 0 ? `+${pts}` : '–'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-zinc-700 mt-2 text-right">Grid → chegada · pontos</p>
        </div>
      )}

      {/* Career history */}
      {careerHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Temporadas anteriores</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {careerHistory.map(({ year, position, points, wins, teamName }) => {
              const color = getTeamColor(teamName)
              return (
                <div key={year} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0">
                  <span className="text-zinc-500 text-sm font-mono w-10 flex-shrink-0">{year}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-zinc-400 flex-1 truncate">{teamName}</span>
                  <span className={`text-sm font-bold w-8 text-center flex-shrink-0 ${position === 1 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                    {position}°
                  </span>
                  <span className="text-sm text-zinc-500 w-16 text-right flex-shrink-0">{points} pts</span>
                  <span className="text-xs text-zinc-600 w-14 text-right flex-shrink-0">{wins} {wins === 1 ? 'vitória' : 'vitórias'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Teammate */}
      {teammate && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Companheiro de equipe</h2>
          <Link
            href={`/standings/driver/${teammate.driverId}`}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-4 hover:border-red-600/50 transition-colors"
          >
            {teammateHeadshot ? (
              <img src={teammateHeadshot} alt="" className="w-12 h-12 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0" />
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
    </div>
  )
}

function StatCard({ value, label, color, small }: { value: any; label: string; color: string; small?: boolean }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
      <div className={`font-bold ${small ? 'text-2xl' : 'text-3xl'} ${color}`}>{value}</div>
      <div className="text-zinc-500 text-xs mt-1">{label}</div>
    </div>
  )
}
