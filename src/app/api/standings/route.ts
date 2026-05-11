import { NextResponse } from 'next/server'
import { getDriverStandings, getConstructorStandings } from '@/lib/ergast'

export async function GET() {
  try {
    const [drivers, constructors] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings()
    ])
    return NextResponse.json({ drivers, constructors })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar standings' }, { status: 500 })
  }
}