import Link from 'next/link'
import { COUNTRY_FLAGS, getTeamColor } from '@/lib/f1Images'

async function getCurrentRace(round: number) {
  try {
    const res = await fetch('https://f1api.dev/api/current', { next: { revalidate: 300 } })
    const data = await res.json()
    return (data?.races ?? []).find((r: any) => Number(r.round) === round) ?? null
  } catch {
    return null
  }
}

async function getPastWinnersAtCircuit(circuitId: string, currentYear: number) {
  const years = [1, 2, 3, 4, 5].map(n => currentYear - n)

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

export default async function RacePage({ params }: { params: Promise<{ round: string }> }) {
  const { round: roundParam } = await params
  const round = parseInt(roundParam)

  if (isNaN(round)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
          ← Calendário
        </Link>
        <p className="text-zinc-400 mt-8">Corrida não encontrada.</p>
      </div>
    )
  }

  const race = await getCurrentRace(round)

  if (!race) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
          ← Calendário
        </Link>
        <p className="text-zinc-400 mt-8">Corrida não encontrada.</p>
      </div>
    )
  }

  const today = new Date()
  const currentYear = today.getFullYear()
  const raceDate = race.schedule?.race?.date ? new Date(race.schedule.race.date) : null
  const isCompleted = !!race.winner
  const daysLeft = raceDate && raceDate > today
    ? Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const pastWinners = race.circuit?.circuitId
    ? await getPastWinnersAtCircuit(race.circuit.circuitId, currentYear)
    : []

  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? '🏁'
  const teamColor = race.teamWinner ? getTeamColor(race.teamWinner.teamName) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        ← Calendário
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8">
        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
          <span>{flag} {race.circuit?.country}</span>
          <span>·</span>
          <span>Round {race.round}</span>
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

      {/* Resultado ou Agenda */}
      {isCompleted ? (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Resultado {currentYear}</h2>
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
            {pastWinners.map(({ year, winner, team }) => {
              const color = team ? getTeamColor(team.teamName) : '#71717a'
              return (
                <div
                  key={year}
                  className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-zinc-600 text-sm font-mono w-10 flex-shrink-0">{year}</span>
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
