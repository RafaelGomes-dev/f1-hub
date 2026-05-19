import Link from 'next/link'
import { fetchDriverHeadshots, getTeamColor } from '@/lib/f1Images'

async function getDrivers() {
  try {
    const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.drivers_championship ?? []) as any[]
  } catch {
    return []
  }
}

function calcAge(birthday: string): number | null {
  if (!birthday) return null
  const birth = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return isNaN(age) ? null : age
}

// Group drivers by team
function groupByTeam(drivers: any[]) {
  const map = new Map<string, any[]>()
  for (const d of drivers) {
    const teamId = d.teamId
    if (!map.has(teamId)) map.set(teamId, [])
    map.get(teamId)!.push(d)
  }
  // Sort each team's drivers by championship position
  for (const [, arr] of map) arr.sort((a, b) => a.position - b.position)
  // Sort teams by best driver position
  return [...map.values()].sort((a, b) => a[0].position - b[0].position)
}

export default async function DriversPage() {
  const [drivers, headshots] = await Promise.all([
    getDrivers(),
    fetchDriverHeadshots(),
  ])

  const teams = groupByTeam(drivers)
  const year = new Date().getFullYear()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">
        Pilotos <span className="text-red-500">{year}</span>
      </h1>
      <p className="text-zinc-500 text-sm mb-8">
        {drivers.length} pilotos · {teams.length} equipes
      </p>

      <div className="flex flex-col gap-4">
        {teams.map(teamDrivers => {
          const team = teamDrivers[0].team
          const teamColor = getTeamColor(team.teamName)

          return (
            <div key={team.teamId} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Team header */}
              <div
                className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3"
                style={{ borderLeftColor: teamColor, borderLeftWidth: '3px' }}
              >
                <span className="text-sm font-semibold text-zinc-300">{team.teamName}</span>
                <span className="text-xs text-zinc-600 ml-auto">{team.country}</span>
              </div>

              {/* Drivers */}
              <div className="divide-y divide-zinc-800">
                {teamDrivers.map((entry: any) => {
                  const driver = entry.driver
                  const headshot = headshots[String(driver.number)]
                  const age = calcAge(driver.birthday)

                  return (
                    <Link
                      key={entry.driverId}
                      href={`/drivers/${entry.driverId}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Headshot */}
                      {headshot ? (
                        <img
                          src={headshot}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover object-top bg-zinc-800 flex-shrink-0"
                          style={{ borderColor: `${teamColor}50`, borderWidth: '2px' }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0"
                          style={{ borderColor: `${teamColor}50`, borderWidth: '2px' }}
                        />
                      )}

                      {/* Name + info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">
                          {driver.name}{' '}
                          <span className="text-red-400">{driver.surname}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                          <span>{driver.nationality}</span>
                          {age && <><span className="text-zinc-700">·</span><span>{age} anos</span></>}
                        </div>
                      </div>

                      {/* Number */}
                      <span
                        className="text-2xl font-black tabular-nums flex-shrink-0 opacity-60"
                        style={{ color: teamColor }}
                      >
                        {driver.number}
                      </span>

                      {/* Stats */}
                      <div className="flex gap-5 flex-shrink-0 text-right">
                        <div>
                          <div className="text-sm font-bold text-red-400">{entry.position}°</div>
                          <div className="text-xs text-zinc-600">Camp.</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{entry.points}</div>
                          <div className="text-xs text-zinc-600">Pts</div>
                        </div>
                        {entry.wins > 0 && (
                          <div>
                            <div className="text-sm font-bold text-yellow-400">{entry.wins}</div>
                            <div className="text-xs text-zinc-600">{entry.wins === 1 ? 'Vitória' : 'Vitórias'}</div>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
