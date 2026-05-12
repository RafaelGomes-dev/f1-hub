const BASE = 'https://api.openf1.org/v1'

export async function getRaceSchedule() {
  const res = await fetch(`${BASE}/meetings?year=2026`)
  const data = await res.json()
  return data
}

export async function getDriverStandings() {
  const res = await fetch(`${BASE}/drivers?session_key=latest`)
  const data = await res.json()
  return data
}

export async function getConstructorStandings() {
  const res = await fetch(`${BASE}/teams?session_key=latest`)
  const data = await res.json()
  return data ?? []
}

export async function getDrivers() {
  const res = await fetch(`${BASE}/drivers?session_key=latest`)
  const data = await res.json()
  return data
}

export async function getRealStandings() {
  const res = await fetch('https://f1api.dev/api/current/drivers-championship', {
    next: { revalidate: 300 }
  })
  const data = await res.json()
  return data
}