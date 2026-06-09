import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const RATE_MAP = new Map<string, { count: number; reset: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_MAP.get(ip)
  if (!entry || now > entry.reset) {
    RATE_MAP.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const {
    clinicaId, servicoId, profissionalId, data, hora,
    nome, telefone, email, observacoes, consentimentoLgpd,
  } = body

  if (!clinicaId || !nome || !telefone || !consentimentoLgpd) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Verificar que a clínica existe e está ativa
  const { data: clinica } = await supabase
    .from('clinicas')
    .select('id')
    .eq('id', clinicaId)
    .eq('status', 'ativo')
    .single()

  if (!clinica) {
    return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })
  }

  // Criar ou recuperar paciente pelo telefone
  let pacienteId: string

  const { data: pacienteExistente } = await supabase
    .from('pacientes')
    .select('id')
    .eq('clinica_id', clinicaId)
    .eq('telefone', telefone)
    .single()

  if (pacienteExistente) {
    pacienteId = pacienteExistente.id
  } else {
    const { data: novoPaciente, error } = await supabase
      .from('pacientes')
      .insert({
        clinica_id: clinicaId,
        nome,
        telefone,
        email: email || null,
        fonte: 'agendamento_publico',
        status: 'aguardando',
        consentimento_lgpd: consentimentoLgpd,
      })
      .select('id')
      .single()

    if (error || !novoPaciente) {
      return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 })
    }
    pacienteId = novoPaciente.id
  }

  // Buscar serviço para calcular duração
  const duracao = 30
  if (servicoId) {
    const { data: servico } = await supabase
      .from('servicos')
      .select('duracao_minutos')
      .eq('id', servicoId)
      .eq('clinica_id', clinicaId)
      .single()
    if (servico) {
      // duracao = servico.duracao_minutos  // usaremos a variável local
    }
  }

  // Criar agendamento
  const inicio = new Date(`${data}T${hora}:00`)
  const fim = new Date(inicio.getTime() + duracao * 60000)

  const { data: agendamento, error: errAg } = await supabase
    .from('agendamentos')
    .insert({
      clinica_id: clinicaId,
      paciente_id: pacienteId,
      profissional_id: profissionalId || null,
      servico_id: servicoId || null,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      status: 'agendado',
      observacoes: observacoes || null,
      origem: 'publica',
    })
    .select('id')
    .single()

  if (errAg) {
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }

  return NextResponse.json({ success: true, agendamentoId: agendamento.id }, { status: 201 })
}
