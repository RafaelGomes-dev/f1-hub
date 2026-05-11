import { NextResponse } from 'next/server'
import { getRaceSchedule } from '@/lib/ergast'

export async function GET() {
  try {
    const races = await getRaceSchedule()
    return NextResponse.json({ races })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar corridas' }, { status: 500 })
  }
}