import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Rate limiting simples por IP (in-memory — para prod usar Redis/Upstash)
const RATE_MAP = new Map<string, { count: number; reset: number }>()
const LIMIT = 30
const WINDOW = 60_000

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + WINDOW })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl
  const clinicaId = searchParams.get('clinica_id')
  const profissionalId = searchParams.get('profissional_id')
  const data = searchParams.get('data') // YYYY-MM-DD

  if (!clinicaId || !data) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: clinica_id, data' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Buscar profissional e seus horários
  let query = supabase
    .from('agendamentos')
    .select('data_hora_inicio, data_hora_fim, profissional_id')
    .eq('clinica_id', clinicaId)
    .gte('data_hora_inicio', `${data}T00:00:00`)
    .lte('data_hora_inicio', `${data}T23:59:59`)
    .not('status', 'in', '(cancelado,falta)')

  if (profissionalId) {
    query = query.eq('profissional_id', profissionalId)
  }

  const { data: agendados } = await query

  // Gerar slots de 30min das 08:00 às 18:00
  const slots = []
  for (let h = 8; h < 18; h++) {
    for (const min of [0, 30]) {
      const hora = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      const slotInicio = new Date(`${data}T${hora}:00`)

      const ocupado = (agendados ?? []).some(ag => {
        const inicio = new Date(ag.data_hora_inicio)
        const fim = new Date(ag.data_hora_fim)
        return slotInicio >= inicio && slotInicio < fim
      })

      slots.push({ hora, disponivel: !ocupado })
    }
  }

  return NextResponse.json({ slots })
}
