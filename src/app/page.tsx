import { getRaceSchedule } from '@/lib/ergast'
import { MapPin, Clock, Flag } from 'lucide-react'

export default async function HomePage() {
  const races = await getRaceSchedule()

  const today = new Date()
  const upcoming = races.filter((r: any) => new Date(r.date_end) >= today)
  const past = races.filter((r: any) => new Date(r.date_end) < today)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Calendário <span className="text-red-500">2026</span>
      </h1>
      <p className="text-zinc-400 mb-8">Todas as corridas da temporada</p>

      <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
        <Flag size={20} /> Próximas corridas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {upcoming.slice(0, 6).map((race: any) => (
          <RaceCard key={race.meeting_key} race={race} upcoming />
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-zinc-400">Corridas realizadas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...past].reverse().map((race: any) => (
          <RaceCard key={race.meeting_key} race={race} upcoming={false} />
        ))}
      </div>
    </div>
  )
}

function RaceCard({ race, upcoming }: { race: any; upcoming: boolean }) {
  const date = new Date(race.date_start)
  return (
    <div className={`rounded-xl border p-5 transition-all hover:scale-[1.02]
      ${upcoming
        ? 'bg-zinc-900 border-red-600/40 hover:border-red-500'
        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
      }`}>
      <h3 className="font-bold text-lg leading-tight mb-3">{race.meeting_name}</h3>
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
        <MapPin size={14} className="text-red-400" />
        {race.circuit_short_name}, {race.country_name}
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Clock size={14} className="text-red-400" />
        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
      {upcoming && (
        <div className="mt-3 inline-block bg-red-600/20 text-red-400 text-xs px-3 py-1 rounded-full border border-red-600/30">
          Em breve
        </div>
      )}
    </div>
  )
}