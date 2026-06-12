import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { STATUS_AGENDAMENTO_VALUES } from '@/lib/utils'

const SELECT = 'id, nome, cpf, email, telefone, status, fonte, ultima_consulta, criado_em, profissional_responsavel:profissionais(id, nome)'

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
  if (typeof body.nome === 'string') update.nome = body.nome.trim()
  if ('cpf' in body) update.cpf = body.cpf || null
  if (typeof body.telefone === 'string') update.telefone = body.telefone
  if ('email' in body) update.email = body.email || null
  if (typeof body.status === 'string') update.status = body.status
  if ('cep' in body) update.cep = body.cep || null
  if ('logradouro' in body) update.logradouro = body.logradouro || null
  if ('numero' in body) update.numero = body.numero || null
  if ('complemento' in body) update.complemento = body.complemento || null
  if ('bairro' in body) update.bairro = body.bairro || null
  if ('cidade' in body) update.cidade = body.cidade || null
  if ('estado' in body) update.estado = body.estado || null

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('pacientes')
    .update(update)
    .eq('id', id)
    .eq('clinica_id', clinicaId)
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (typeof update.status === 'string' && (STATUS_AGENDAMENTO_VALUES as readonly string[]).includes(update.status)) {
    const { data: agendamento } = await admin
      .from('agendamentos')
      .select('id')
      .eq('paciente_id', id)
      .eq('clinica_id', clinicaId)
      .order('data_hora_inicio', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (agendamento) {
      await admin
        .from('agendamentos')
        .update({ status: update.status })
        .eq('id', agendamento.id)
        .eq('clinica_id', clinicaId)
    }
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

  const { error } = await admin
    .from('pacientes')
    .delete()
    .eq('id', id)
    .eq('clinica_id', clinicaId)

  if (error) return NextResponse.json({ error: 'Não é possível excluir: este paciente possui agendamentos vinculados.' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
