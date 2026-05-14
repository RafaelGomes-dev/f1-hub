import Link from 'next/link'
import { Flag } from 'lucide-react'
import { COUNTRY_FLAGS } from '@/lib/f1Images'

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

export default async function HomePage() {
  const races = await getAllRaces()
  const today = new Date()
  const year = today.getFullYear()

  const nextRace = races.find(
    (r: any) => r.schedule?.race?.date && new Date(r.schedule.race.date) >= today
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">
        Calendário <span className="text-red-500">{year}</span>
      </h1>
      <p className="text-zinc-500 text-sm mb-8">
        Temporada de Fórmula 1 · {races.length} corridas
      </p>

      {nextRace && <NextRaceCard race={nextRace} today={today} />}

      <h2 className="text-base font-semibold mb-3 text-zinc-400">Temporada completa</h2>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {races.map((race: any) => {
          const raceDate = race.schedule?.race?.date ? new Date(race.schedule.race.date) : null
          const isPast = !!raceDate && raceDate < today
          const isNext = !!nextRace && race.round === nextRace.round
          return (
            <RaceRow key={race.round} race={race} isPast={isPast} isNext={isNext} />
          )
        })}
      </div>
    </div>
  )
}

function NextRaceCard({ race, today }: { race: any; today: Date }) {
  const raceDate = new Date(race.schedule.race.date)
  const daysLeft = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? '🏁'

  return (
    <div className="bg-zinc-900 border border-red-600/40 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 text-xs text-red-400 font-semibold uppercase tracking-wider mb-4">
        <Flag size={11} />
        Próxima corrida · Round {race.round}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{race.raceName}</h2>
          <p className="text-zinc-500 text-sm">
            {flag} {race.circuit?.circuitName ?? race.circuit?.country}
            {race.circuit?.city ? ` — ${race.circuit.city}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-4xl font-bold text-red-400 leading-none">{daysLeft}</div>
          <div className="text-zinc-600 text-xs mt-1">{daysLeft === 1 ? 'dia' : 'dias'}</div>
        </div>
      </div>
      <div className="mt-5 flex gap-6 text-sm border-t border-zinc-800 pt-4 justify-between items-end">
        <div className="flex gap-6">
          {race.schedule?.fp1?.date && (
            <SessionDate label="Treino 1" date={race.schedule.fp1.date} />
          )}
          {race.schedule?.sprint?.date && (
            <SessionDate label="Sprint" date={race.schedule.sprint.date} highlight />
          )}
          {race.schedule?.qualifying?.date && (
            <SessionDate label="Classificação" date={race.schedule.qualifying.date} />
          )}
          <SessionDate label="Corrida" date={race.schedule.race.date} highlight />
        </div>
        <Link
          href={`/race/${race.round}`}
          className="text-xs text-zinc-500 hover:text-white transition-colors flex-shrink-0"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  )
}

function SessionDate({ label, date, highlight }: { label: string; date: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-zinc-600 text-xs mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${highlight ? 'text-white' : 'text-zinc-400'}`}>
        {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
      </div>
    </div>
  )
}

function RaceRow({ race, isPast, isNext }: { race: any; isPast: boolean; isNext: boolean }) {
  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? '🏁'
  const raceDate = race.schedule?.race?.date ? new Date(race.schedule.race.date) : null
  const winner = race.winner
  const hasSprint = !!race.schedule?.sprint?.date

  return (
    <Link
      href={`/race/${race.round}`}
      className={`flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 last:border-0 transition-colors
        ${isNext ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-zinc-800/40'}
        ${!isPast && !isNext ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <span className={`w-6 text-right text-xs font-mono flex-shrink-0
        ${isNext ? 'text-red-400 font-bold' : 'text-zinc-600'}`}>
        {race.round}
      </span>

      <span className="text-base flex-shrink-0">{flag}</span>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${isPast ? 'text-zinc-400' : 'text-white'}`}>
          {race.raceName}
        </span>
        {hasSprint && (
          <span className="ml-2 text-xs text-yellow-500/80 border border-yellow-500/30 px-1.5 py-0.5 rounded">
            Sprint
          </span>
        )}
        <div className="text-xs text-zinc-600 mt-0.5">
          {race.circuit?.city ? `${race.circuit.city}, ` : ''}{race.circuit?.country}
        </div>
      </div>

      <div className="text-right flex-shrink-0 min-w-[80px]">
        {isPast && winner ? (
          <>
            <div className="text-xs text-zinc-300 font-medium">{winner.name} {winner.surname}</div>
            <div className="text-xs text-zinc-600">
              {raceDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </div>
          </>
        ) : isNext ? (
          <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">
            Próxima
          </span>
        ) : (
          <div className="text-xs text-zinc-600">
            {raceDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </div>
    </Link>
  )
}
