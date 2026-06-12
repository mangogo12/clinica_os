import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const SLOT_MINUTOS = 30

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { searchParams } = req.nextUrl
  const profissionalId = searchParams.get('profissional_id')
  const data = searchParams.get('data')
  const servicoId = searchParams.get('servico_id')

  if (!profissionalId || !data) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: profissional_id, data' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: profissional } = await admin
    .from('profissionais')
    .select('horario_inicio, horario_fim, dias_atendimento')
    .eq('id', profissionalId)
    .eq('clinica_id', clinicaId)
    .single()

  if (!profissional) {
    return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
  }

  const diaSemana = new Date(`${data}T00:00:00`).getDay()
  if (!profissional.dias_atendimento?.includes(diaSemana)) {
    return NextResponse.json({ slots: [], diaIndisponivel: true })
  }

  let duracao = 30
  if (servicoId) {
    const { data: servico } = await admin
      .from('servicos')
      .select('duracao_minutos')
      .eq('id', servicoId)
      .eq('clinica_id', clinicaId)
      .single()
    if (servico?.duracao_minutos) duracao = servico.duracao_minutos
  }

  const { data: agendados } = await admin
    .from('agendamentos')
    .select('data_hora_inicio, data_hora_fim')
    .eq('clinica_id', clinicaId)
    .eq('profissional_id', profissionalId)
    .gte('data_hora_inicio', `${data}T00:00:00`)
    .lte('data_hora_inicio', `${data}T23:59:59`)
    .not('status', 'in', '(cancelado,falta)')

  const inicioMin = paraMinutos(profissional.horario_inicio.substring(0, 5))
  const fimMin = paraMinutos(profissional.horario_fim.substring(0, 5))

  const slots: { hora: string; disponivel: boolean }[] = []
  for (let m = inicioMin; m + duracao <= fimMin; m += SLOT_MINUTOS) {
    const slotInicio = new Date(`${data}T${paraHora(m)}:00`)
    const slotFim = new Date(slotInicio.getTime() + duracao * 60000)

    const ocupado = (agendados ?? []).some(ag => {
      const agInicio = new Date(ag.data_hora_inicio)
      const agFim = new Date(ag.data_hora_fim)
      return slotInicio < agFim && slotFim > agInicio
    })

    slots.push({ hora: paraHora(m), disponivel: !ocupado })
  }

  return NextResponse.json({ slots, diaIndisponivel: false })
}
