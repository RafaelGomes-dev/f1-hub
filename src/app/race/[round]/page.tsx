import Link from 'next/link'
import { COUNTRY_FLAGS, getTeamColor } from '@/lib/f1Images'

const CURRENT_YEAR = new Date().getFullYear()

async function getRace(round: number, year: number) {
  try {
    const slug = year === CURRENT_YEAR ? 'current' : String(year)
    const res = await fetch(`https://f1api.dev/api/${slug}`, { next: { revalidate: 300 } })
    const data = await res.json()
    return (data?.races ?? []).find((r: any) => Number(r.round) === round) ?? null
  } catch {
    return null
  }
}

// Maps f1api.dev circuitId → bacinger/f1-circuits GeoJSON feature id
// Some IDs changed between seasons (2023 vs 2024+), so both are kept
const CIRCUIT_GEOJSON_ID: Record<string, string> = {
  albert_park: 'au-1953',
  bahrain: 'bh-2002',
  shanghai: 'cn-2004',
  catalunya: 'es-1991',      // 2023
  montmelo: 'es-1991',       // 2024+
  monaco: 'mc-1929',
  villeneuve: 'ca-1978',     // 2023
  gilles_villeneuve: 'ca-1978', // 2024+
  ricard: 'fr-1969',
  red_bull_ring: 'at-1969',
  silverstone: 'gb-1948',
  hockenheimring: 'de-1932',
  hungaroring: 'hu-1986',
  spa: 'be-1925',
  monza: 'it-1922',
  marina_bay: 'sg-2008',
  sochi: 'ru-2014',
  suzuka: 'jp-1962',
  americas: 'us-2012',       // 2023
  austin: 'us-2012',         // 2024+
  rodriguez: 'mx-1962',      // 2023
  hermanos_rodriguez: 'mx-1962', // 2024+
  interlagos: 'br-1940',
  yas_marina: 'ae-2009',
  imola: 'it-1953',
  nurburgring: 'de-1927',
  portimao: 'pt-2008',
  mugello: 'it-1914',
  sepang: 'my-1999',
  istanbul: 'tr-2005',
  zandvoort: 'nl-1948',
  jeddah: 'sa-2021',
  miami: 'us-2022',
  lusail: 'qa-2004',
  madring: 'es-2026',
  baku: 'az-2016',
  vegas: 'us-2023',
  indianapolis: 'us-1909',
}

function coordsToSVG(coords: [number, number][]): string {
  if (coords.length < 3) return ''

  const lons = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const lonRange = maxLon - minLon || 1
  const latRange = maxLat - minLat || 1

  const viewW = 400, viewH = 300, pad = 20
  const scale = Math.min((viewW - pad * 2) / lonRange, (viewH - pad * 2) / latRange)
  const trackW = lonRange * scale, trackH = latRange * scale
  const ox = pad + ((viewW - pad * 2) - trackW) / 2
  const oy = pad + ((viewH - pad * 2) - trackH) / 2

  const pts = coords.map(([lon, lat]) => {
    const x = ox + (lon - minLon) * scale
    const y = oy + trackH - (lat - minLat) * scale
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" fill="none">
    <path d="M ${pts.join(' L ')} Z" stroke="#ef4444" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

type CircuitData = {
  svg: string
  length: number
  opened: number
  firstGP: number
  altitude: number | null
}

async function getCircuitData(circuitId: string): Promise<CircuitData | null> {
  const geoId = CIRCUIT_GEOJSON_ID[circuitId]
  if (!geoId) return null
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson',
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const feature = (data.features as any[]).find(f => f.properties?.id === geoId)
    if (!feature) return null
    const coords = feature.geometry?.coordinates as [number, number][] | undefined
    if (!coords?.length) return null
    const p = feature.properties
    return {
      svg: coordsToSVG(coords),
      length: p.length ?? 0,
      opened: p.opened ?? 0,
      firstGP: p.firstgp ?? 0,
      altitude: p.altitude ?? null,
    }
  } catch {
    return null
  }
}

async function getPastWinnersAtCircuit(circuitId: string, fromYear: number) {
  const years = [1, 2, 3, 4, 5].map(n => fromYear - n)

  const results = await Promise.allSettled(
    years.map(async year => {
      const res = await fetch(`https://f1api.dev/api/${year}`, { next: { revalidate: 3600 } })
      const data = await res.json()
      const race = (data?.races ?? []).find((r: any) => r.circuit?.circuitId === circuitId)
      if (!race?.winner) return null
      return {
        year,
        winner: race.winner,
        team: race.teamWinner,
        fastLap: race.fast_lap,
        raceName: race.raceName,
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<NonNullable<any>> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value)
}

export default async function RacePage({
  params,
  searchParams,
}: {
  params: Promise<{ round: string }>
  searchParams: Promise<{ year?: string }>
}) {
  const { round: roundParam } = await params
  const { year: yearParam } = await searchParams
  const round = parseInt(roundParam)
  const year = yearParam && !isNaN(Number(yearParam)) ? Number(yearParam) : CURRENT_YEAR
  const isPastSeason = year < CURRENT_YEAR
  const backLink = isPastSeason ? `/?year=${year}` : '/'

  if (isNaN(round)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={backLink} className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
          ← Calendário
        </Link>
        <p className="text-zinc-400 mt-8">Corrida não encontrada.</p>
      </div>
    )
  }

  const race = await getRace(round, year)

  if (!race) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={backLink} className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
          ← Calendário
        </Link>
        <p className="text-zinc-400 mt-8">Corrida não encontrada.</p>
      </div>
    )
  }

  const today = new Date()
  const raceDate = race.schedule?.race?.date ? new Date(race.schedule.race.date) : null
  const isCompleted = !!race.winner
  const daysLeft = raceDate && raceDate > today
    ? Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const [pastWinners, circuitData] = await Promise.all([
    race.circuit?.circuitId ? getPastWinnersAtCircuit(race.circuit.circuitId, year) : Promise.resolve([]),
    race.circuit?.circuitId ? getCircuitData(race.circuit.circuitId) : Promise.resolve(null),
  ])

  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? '🏁'
  const teamColor = race.teamWinner ? getTeamColor(race.teamWinner.teamName) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={backLink} className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Calendário {isPastSeason ? year : ''}
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8">
        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
          <span>{flag} {race.circuit?.country}</span>
          <span>·</span>
          <span>Rodada {race.round}</span>
          {isPastSeason && (
            <>
              <span>·</span>
              <span className="text-zinc-600">{year}</span>
            </>
          )}
          {race.schedule?.sprint?.date && (
            <>
              <span>·</span>
              <span className="text-yellow-500/80 text-xs border border-yellow-500/30 px-1.5 py-0.5 rounded">Sprint</span>
            </>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-1">{race.raceName}</h1>
        <p className="text-zinc-500 text-sm">
          {race.circuit?.circuitName}
          {race.circuit?.city ? ` — ${race.circuit.city}` : ''}
        </p>
        {daysLeft !== null && (
          <p className="mt-2 text-sm">
            <span className="text-red-400 font-bold text-lg">{daysLeft}</span>
            <span className="text-zinc-600 ml-1">{daysLeft === 1 ? 'dia' : 'dias'}</span>
          </p>
        )}
      </div>

      {/* Traçado + infos do circuito */}
      {circuitData && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Circuito</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex flex-col sm:flex-row">
            <div
              className="flex-1 p-5 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-800 [&_svg]:w-full [&_svg]:max-h-52 [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: circuitData.svg }}
            />
            <div className="sm:w-44 p-5 flex flex-col justify-center gap-5">
              {circuitData.length > 0 && (
                <CircuitStat label="Comprimento" value={`${(circuitData.length / 1000).toFixed(3)} km`} />
              )}
              {circuitData.firstGP > 0 && (
                <CircuitStat label="1º GP" value={String(circuitData.firstGP)} />
              )}
              {circuitData.opened > 0 && (
                <CircuitStat label="Inaugurado" value={String(circuitData.opened)} />
              )}
              {circuitData.altitude !== null && (
                <CircuitStat label="Altitude" value={`${circuitData.altitude} m`} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resultado ou Agenda */}
      {isCompleted ? (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Resultado {year}</h2>
          <div
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-5"
            style={teamColor ? { borderLeftColor: teamColor, borderLeftWidth: '3px' } : {}}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Vencedor</div>
                <Link
                  href={`/standings/driver/${race.winner.driverId}`}
                  className="text-xl font-bold hover:text-red-400 transition-colors"
                >
                  {race.winner.name} {race.winner.surname}
                </Link>
                {race.teamWinner && (
                  <div className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: teamColor ?? '#71717a' }}
                    />
                    <Link href={`/standings/constructor/${race.teamWinner.teamId}`} className="hover:text-white transition-colors">
                      {race.teamWinner.teamName}
                    </Link>
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-yellow-400">1°</div>
            </div>

            {race.fast_lap && (
              <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-sm text-zinc-500">
                <span className="text-purple-400 text-xs border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 rounded-full">VR</span>
                <span>{race.fast_lap.fast_lap_driver ?? 'Desconhecido'}</span>
                {race.fast_lap.fast_lap_time && (
                  <span className="text-zinc-600">· {race.fast_lap.fast_lap_time}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Agenda</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {[
              { label: 'Treino Livre 1', date: race.schedule?.fp1?.date },
              { label: 'Treino Livre 2', date: race.schedule?.fp2?.date },
              { label: 'Treino Livre 3', date: race.schedule?.fp3?.date },
              { label: 'Sprint Qualifying', date: race.schedule?.sprintQualifying?.date },
              { label: 'Sprint', date: race.schedule?.sprint?.date, highlight: true },
              { label: 'Classificação', date: race.schedule?.qualifying?.date },
              { label: 'Corrida', date: race.schedule?.race?.date, highlight: true },
            ]
              .filter(s => s.date)
              .map(session => (
                <div
                  key={session.label}
                  className={`flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 last:border-0 ${session.highlight ? 'bg-zinc-800/40' : ''}`}
                >
                  <span className={`text-sm ${session.highlight ? 'text-white font-medium' : 'text-zinc-400'}`}>
                    {session.label}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {new Date(session.date!).toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Últimas vitórias */}
      {pastWinners.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Últimas vitórias neste circuito
          </h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {pastWinners.map(({ year: winYear, winner, team }) => {
              const color = team ? getTeamColor(team.teamName) : '#71717a'
              return (
                <div
                  key={winYear}
                  className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-zinc-600 text-sm font-mono w-10 flex-shrink-0">{winYear}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/standings/driver/${winner.driverId}`}
                      className="text-sm font-medium hover:text-red-400 transition-colors"
                    >
                      {winner.name} {winner.surname}
                    </Link>
                    {team && (
                      <div className="text-xs text-zinc-600 mt-0.5">{team.teamName}</div>
                    )}
                  </div>
                  <span className="text-yellow-400 text-sm font-bold flex-shrink-0">1°</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CircuitStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-600 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
