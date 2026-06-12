import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sincronizarStatusPaciente } from '@/lib/agenda'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json([], { status: 200 })

  const inicio = req.nextUrl.searchParams.get('inicio')
  const fim = req.nextUrl.searchParams.get('fim')
  if (!inicio || !fim) return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data } = await admin
    .from('agendamentos')
    .select(`
      id, data_hora_inicio, data_hora_fim, status, observacoes,
      paciente:pacientes(id, nome, telefone),
      profissional:profissionais(id, nome, especialidade),
      servico:servicos(id, nome, duracao_minutos, preco)
    `)
    .eq('clinica_id', clinicaId)
    .gte('data_hora_inicio', inicio)
    .lte('data_hora_inicio', fim)
    .order('data_hora_inicio')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { paciente_id, profissional_id, servico_id, data_hora_inicio, data_hora_fim, observacoes } = await req.json()

  if (!paciente_id || !profissional_id || !servico_id || !data_hora_inicio || !data_hora_fim) {
    return NextResponse.json({ error: 'Dados incompletos para o agendamento.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('agendamentos')
    .insert({
      clinica_id: clinicaId,
      paciente_id,
      profissional_id,
      servico_id,
      data_hora_inicio,
      data_hora_fim,
      observacoes: observacoes || null,
      origem: 'dashboard',
    })
    .select(`
      id, data_hora_inicio, data_hora_fim, status, observacoes,
      paciente:pacientes(id, nome, telefone),
      profissional:profissionais(id, nome, especialidade),
      servico:servicos(id, nome, duracao_minutos, preco)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sincronizarStatusPaciente(admin, clinicaId, paciente_id, data.status)

  return NextResponse.json(data, { status: 201 })
}
