'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getTeamColor } from '@/lib/f1Images'

export default function StandingsTabs({
  drivers,
  constructors,
  headshots,
}: {
  drivers: any[]
  constructors: any[]
  headshots: Record<string, string>
}) {
  const [tab, setTab] = useState<'drivers' | 'constructors'>('drivers')

  return (
    <>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('drivers')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors
            ${tab === 'drivers' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          🏆 Pilotos
        </button>
        <button
          onClick={() => setTab('constructors')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors
            ${tab === 'constructors' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          🏗️ Construtoras
        </button>
      </div>

      {tab === 'drivers' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 text-sm font-semibold text-zinc-400">
            Campeonato de Pilotos
          </div>
          {drivers.map((entry: any, i: number) => {
            const headshot = headshots[String(entry.driver?.number)]
            return (
              <div
                key={entry.driverId}
                className={`flex items-center gap-4 px-5 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors
                  ${i < 3 ? 'bg-zinc-800/30' : ''}`}
              >
                <span className={`w-8 text-center font-bold text-lg
                  ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                  {entry.position ?? i + 1}
                </span>
                {headshot ? (
                  <img
                    src={headshot}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/standings/driver/${entry.driverId}`} className="font-semibold hover:text-red-400 transition-colors">
                    {entry.driver?.name} {entry.driver?.surname}
                  </Link>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTeamColor(entry.team?.teamName ?? '') }}
                    />
                    {entry.team?.teamName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold text-xl">{entry.points}</div>
                  <div className="text-xs text-zinc-600">pts</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'constructors' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 text-sm font-semibold text-zinc-400">
            Campeonato de Construtoras
          </div>
          {constructors.map((entry: any, i: number) => (
            <div
              key={entry.teamId}
              className={`flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors
                ${i < 3 ? 'bg-zinc-800/30' : ''}`}
            >
              <span className={`w-8 text-center font-bold text-lg
                ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                {entry.position ?? i + 1}
              </span>
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${getTeamColor(entry.team?.teamName ?? '')}20`, border: `2px solid ${getTeamColor(entry.team?.teamName ?? '')}40` }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getTeamColor(entry.team?.teamName ?? '') }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/standings/constructor/${entry.teamId}`} className="font-semibold hover:text-red-400 transition-colors">
                  {entry.team?.teamName}
                </Link>
                <div className="text-xs text-zinc-500 mt-0.5">{entry.team?.country}</div>
              </div>
              <div className="text-right">
                <div className="text-red-400 font-bold text-xl">{entry.points}</div>
                <div className="text-xs text-zinc-600">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
