import Link from 'next/link'
import { fetchDriverHeadshots, getTeamColor } from '@/lib/f1Images'

const CURRENT_YEAR = new Date().getFullYear()
const CAREER_YEARS = [0, 1, 2, 3].map(n => CURRENT_YEAR - n)

async function getChampionshipEntry(driverId: string) {
  try {
    const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return (data?.drivers_championship ?? []).find((d: any) => d.driverId === driverId) ?? null
  } catch {
    return null
  }
}

async function getCareerSeasons(driverId: string) {
  const results = await Promise.allSettled(
    CAREER_YEARS.map(async year => {
      const slug = year === CURRENT_YEAR ? 'current' : String(year)
      const res = await fetch(`https://f1api.dev/api/${slug}/drivers-championship`, {
        next: { revalidate: 3600 },
      })
      const data = await res.json()
      const entry = (data?.drivers_championship ?? []).find((d: any) => d.driverId === driverId)
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

async function getWikiBio(wikipediaUrl: string): Promise<{ extract: string; description: string } | null> {
  try {
    const title = wikipediaUrl.split('/wiki/')[1]
    if (!title) return null
    const res = await fetch(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      extract: data.extract ?? '',
      description: data.description ?? '',
    }
  } catch {
    return null
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

function parseBirthday(birthday: string): string {
  if (!birthday) return ''
  const d = new Date(birthday)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Split bio into sentences and limit
function limitSentences(text: string, max: number): string {
  const sentences: string[] = []
  let buf = ''
  for (let i = 0; i < text.length; i++) {
    buf += text[i]
    if (text[i] === '.' && text[i + 1] === ' ' && sentences.length < max - 1) {
      sentences.push(buf.trim())
      buf = ''
    }
  }
  if (buf.trim()) sentences.push(buf.trim())
  return sentences.slice(0, max).join(' ')
}

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const entry = await getChampionshipEntry(id)

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/drivers" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
          ← Pilotos
        </Link>
        <p className="text-zinc-400 mt-8">Piloto não encontrado.</p>
      </div>
    )
  }

  const driver = entry.driver
  const teamColor = getTeamColor(entry.team?.teamName ?? '')

  const [careerSeasons, wikiBio, headshots] = await Promise.all([
    getCareerSeasons(id),
    driver?.url ? getWikiBio(driver.url) : Promise.resolve(null),
    fetchDriverHeadshots(),
  ])

  const headshot = headshots[String(driver?.number)]
  const age = calcAge(driver?.birthday)
  const bio = wikiBio?.extract ? limitSentences(wikiBio.extract, 4) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/drivers" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
        ← Pilotos
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-start gap-5">
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
          <div className="flex-1">
            <h1 className="text-4xl font-bold leading-tight">
              {driver?.name} <span className="text-red-500">{driver?.surname}</span>
            </h1>
            <p className="text-zinc-400 mt-1 flex items-center gap-2">
              <span>{driver?.nationality}</span>
              {age && <><span className="text-zinc-700">·</span><span>{age} anos</span></>}
              <span className="text-zinc-700">·</span>
              <span>#{driver?.number}</span>
            </p>
            {driver?.birthday && (
              <p className="text-zinc-600 text-sm mt-1">Nascido em {parseBirthday(driver.birthday)}</p>
            )}
            <p className="text-sm mt-2 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
              <span className="text-zinc-400">{entry.team?.teamName}</span>
            </p>
          </div>

          {/* Championship number */}
          <div
            className="text-right flex-shrink-0 hidden sm:block"
            style={{ color: teamColor }}
          >
            <div className="text-6xl font-black opacity-40 leading-none">{driver?.number}</div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Sobre</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <p className="text-zinc-300 text-sm leading-relaxed">{bio}</p>
            {driver?.url && (
              <a
                href={driver.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-3 inline-block"
              >
                Ver na Wikipédia →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Career seasons */}
      {careerSeasons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Histórico no campeonato</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {careerSeasons.map(({ year, position, points, wins, teamName }) => {
              const color = getTeamColor(teamName)
              const isChamp = position === 1
              return (
                <div
                  key={year}
                  className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-zinc-500 text-sm font-mono w-10 flex-shrink-0">{year}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-zinc-400 flex-1 truncate">{teamName}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isChamp && (
                      <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                        Campeão
                      </span>
                    )}
                    <span className={`text-sm font-bold w-8 text-right ${isChamp ? 'text-yellow-400' : 'text-zinc-300'}`}>
                      {position}°
                    </span>
                    <span className="text-sm text-zinc-500 w-16 text-right">{points} pts</span>
                    <span className="text-xs text-zinc-600 w-16 text-right">
                      {wins} {wins === 1 ? 'vitória' : 'vitórias'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Link to season stats */}
      <Link
        href={`/standings/driver/${id}`}
        className="flex items-center justify-between bg-zinc-900 rounded-xl border border-zinc-800 px-5 py-4 hover:border-red-600/40 transition-colors group"
      >
        <div>
          <div className="text-sm font-semibold text-white">Temporada {CURRENT_YEAR}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Resultados corrida por corrida, pódios, poles e mais</div>
        </div>
        <span className="text-zinc-600 group-hover:text-red-400 transition-colors">→</span>
      </Link>
    </div>
  )
}
