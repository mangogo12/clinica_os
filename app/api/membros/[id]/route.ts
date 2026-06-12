import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { id } = await params
  const body = await req.json()
  const admin = await createAdminClient()

  const { data: profissional } = await admin
    .from('profissionais')
    .select('id')
    .eq('membro_id', id)
    .eq('clinica_id', clinicaId)
    .maybeSingle()

  const membroUpdate: Record<string, unknown> = {}
  if (typeof body.papel === 'string') membroUpdate.papel = body.papel
  if (typeof body.status === 'string' && !profissional) membroUpdate.status = body.status

  if (Object.keys(membroUpdate).length > 0) {
    const { error } = await admin
      .from('membros_clinica')
      .update(membroUpdate)
      .eq('id', id)
      .eq('clinica_id', clinicaId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: membro, error: errMembro } = await admin
    .from('membros_clinica')
    .select('id, usuario_id, papel, status')
    .eq('id', id)
    .eq('clinica_id', clinicaId)
    .single()

  if (errMembro || !membro) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })

  if (profissional) {
    const profUpdate: Record<string, unknown> = {}
    if (typeof body.nome === 'string') profUpdate.nome = body.nome.trim()
    if (typeof body.especialidade === 'string') profUpdate.especialidade = body.especialidade
    if ('registroProfissional' in body) profUpdate.registro_profissional = body.registroProfissional || null
    if (typeof body.status === 'string') profUpdate.status = body.status

    if (Object.keys(profUpdate).length > 0) {
      const { error } = await admin.from('profissionais').update(profUpdate).eq('id', profissional.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (typeof body.nome === 'string') {
    await admin.from('perfis_usuario').update({ nome_completo: body.nome.trim() }).eq('id', membro.usuario_id)
  }

  const { data: perfil } = await admin
    .from('perfis_usuario')
    .select('id, nome_completo, email, telefone, avatar_url')
    .eq('id', membro.usuario_id)
    .single()

  const { data: profissionalFinal } = await admin
    .from('profissionais')
    .select('id, nome, especialidade, registro_profissional, foto_url, status')
    .eq('membro_id', id)
    .maybeSingle()

  return NextResponse.json({
    id: membro.id,
    papel: membro.papel,
    statusMembro: membro.status,
    nome: profissionalFinal?.nome ?? perfil?.nome_completo ?? 'Sem nome',
    email: perfil?.email ?? '',
    telefone: perfil?.telefone ?? null,
    avatarUrl: profissionalFinal?.foto_url ?? perfil?.avatar_url ?? null,
    profissional: profissionalFinal ? {
      id: profissionalFinal.id,
      especialidade: profissionalFinal.especialidade,
      registroProfissional: profissionalFinal.registro_profissional,
      status: profissionalFinal.status,
    } : null,
  })
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

  const { data: profissional } = await admin
    .from('profissionais')
    .select('id')
    .eq('membro_id', id)
    .eq('clinica_id', clinicaId)
    .maybeSingle()

  if (profissional) {
    const { error: errProf } = await admin.from('profissionais').delete().eq('id', profissional.id)
    if (errProf) return NextResponse.json({ error: 'Não é possível remover: este profissional possui agendamentos vinculados.' }, { status: 409 })
  }

  const { error } = await admin
    .from('membros_clinica')
    .delete()
    .eq('id', id)
    .eq('clinica_id', clinicaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
