export const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'United States': '🇺🇸',
  'Italy': '🇮🇹',
  'Monaco': '🇲🇨',
  'Canada': '🇨🇦',
  'Spain': '🇪🇸',
  'Austria': '🇦🇹',
  'United Kingdom': '🇬🇧',
  'Great Britain': '🇬🇧',
  'Hungary': '🇭🇺',
  'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱',
  'Singapore': '🇸🇬',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'UAE': '🇦🇪',
  'Qatar': '🇶🇦',
  'Azerbaijan': '🇦🇿',
  'Portugal': '🇵🇹',
  'France': '🇫🇷',
  'Russia': '🇷🇺',
}

export const TEAM_COLORS: Record<string, string> = {
  // Short names
  'Red Bull Racing': '#3671C6',
  'Haas F1 Team': '#B6BABD',
  // Full names as returned by f1api.dev
  'Mercedes Formula 1 Team': '#27F4D2',
  'Scuderia Ferrari': '#E8002D',
  'McLaren Formula 1 Team': '#FF8000',
  'Alpine F1 Team': '#FF87BC',
  'BWT Alpine F1 Team': '#FF87BC',
  'Williams Racing': '#64C4FF',
  'Williams F1 Team': '#64C4FF',
  'Visa Cash App RB Formula One Team': '#6692FF',
  'RB F1 Team': '#6692FF',
  'RB': '#6692FF',
  'Stake F1 Team Kick Sauber': '#52E252',
  'Kick Sauber': '#52E252',
  'Aston Martin Aramco F1 Team': '#229971',
  'Aston Martin Aramco Formula One Team': '#229971',
  'Aston Martin F1 Team': '#229971',
}

export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? '#71717a'
}

export async function fetchDriverHeadshots(year = 2026): Promise<Record<string, string>> {
  try {
    const sessionsRes = await fetch(
      `https://api.openf1.org/v1/sessions?session_type=Race&year=${year}`,
      { next: { revalidate: 3600 } }
    )
    const sessions = await sessionsRes.json()
    const latestRace = Array.isArray(sessions) && sessions.length > 0
      ? sessions[sessions.length - 1]
      : null

    const sessionKey = latestRace?.session_key ?? 'latest'
    const driversRes = await fetch(
      `https://api.openf1.org/v1/drivers?session_key=${sessionKey}`,
      { next: { revalidate: 3600 } }
    )
    const drivers = await driversRes.json()

    const map: Record<string, string> = {}
    if (Array.isArray(drivers)) {
      for (const d of drivers) {
        if (d.driver_number && d.headshot_url) {
          map[String(d.driver_number)] = d.headshot_url
        }
      }
    }
    return map
  } catch {
    return {}
  }
}
