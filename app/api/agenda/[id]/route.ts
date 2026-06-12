import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sincronizarStatusPaciente } from '@/lib/agenda'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (typeof body.status === 'string') update.status = body.status
  if (typeof body.data_hora_inicio === 'string') update.data_hora_inicio = body.data_hora_inicio
  if (typeof body.data_hora_fim === 'string') update.data_hora_fim = body.data_hora_fim
  if (typeof body.profissional_id === 'string') update.profissional_id = body.profissional_id
  if (typeof body.servico_id === 'string') update.servico_id = body.servico_id
  if ('observacoes' in body) update.observacoes = body.observacoes || null

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('agendamentos')
    .update(update)
    .eq('id', id)
    .eq('clinica_id', clinicaId)
    .select(`
      id, data_hora_inicio, data_hora_fim, status, observacoes,
      paciente:pacientes(id, nome, telefone),
      profissional:profissionais(id, nome, especialidade),
      servico:servicos(id, nome, duracao_minutos, preco)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pacienteId = Array.isArray(data.paciente) ? data.paciente[0]?.id : (data.paciente as { id?: string } | null)?.id
  if (typeof update.status === 'string' && pacienteId) {
    await sincronizarStatusPaciente(admin, clinicaId, pacienteId, update.status)
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { id } = await params
  const admin = await createAdminClient()

  const { data: agendamento } = await admin
    .from('agendamentos')
    .select('paciente_id, status')
    .eq('id', id)
    .eq('clinica_id', clinicaId)
    .single()

  const { error } = await admin
    .from('agendamentos')
    .delete()
    .eq('id', id)
    .eq('clinica_id', clinicaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ATIVOS = ['agendado', 'confirmado', 'em_atendimento']
  if (agendamento && ATIVOS.includes(agendamento.status)) {
    const { count } = await admin
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .eq('paciente_id', agendamento.paciente_id)
      .in('status', ATIVOS)

    if (!count) {
      await admin
        .from('pacientes')
        .update({ status: 'aguardando' })
        .eq('id', agendamento.paciente_id)
        .eq('clinica_id', clinicaId)
        .in('status', ATIVOS)
    }
  }

  return NextResponse.json({ ok: true })
}
