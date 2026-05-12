'use client'
import { useState } from 'react'

export default function StandingsTabs({ drivers, constructors }: { drivers: any[], constructors: any[] }) {
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
                    {drivers.map((entry: any, i: number) => (
                        <div key={entry.driverId}
                            className={`flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors
                ${i < 3 ? 'bg-zinc-800/30' : ''}`}>
                            <span className={`w-8 text-center font-bold text-lg
                ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                                {entry.position ?? i + 1}
                            </span>
                            <div className="flex-1">
                                <a href={`/standings/driver/${entry.driverId}`} className="font-semibold hover:text-red-400 transition-colors">
                                    {entry.driver?.name} {entry.driver?.surname}
                                </a>
                                <div className="text-xs text-zinc-500 mt-0.5">{entry.team?.teamName}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-red-400 font-bold text-xl">{entry.points}</div>
                                <div className="text-xs text-zinc-600">pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'constructors' && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800 text-sm font-semibold text-zinc-400">
                        Campeonato de Construtoras
                    </div>
                    {constructors.map((entry: any, i: number) => (
                        <div key={entry.teamId}
                            className={`flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors
                ${i < 3 ? 'bg-zinc-800/30' : ''}`}>
                            <span className={`w-8 text-center font-bold text-lg
                ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                                {entry.position ?? i + 1}
                            </span>
                            <div className="flex-1">
                                <a href={`/standings/constructor/${entry.teamId}`} className="font-semibold hover:text-red-400 transition-colors">
                                    {entry.team?.teamName}
                                </a>
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