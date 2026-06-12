import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { clinicaId, nome, email, senha, telefone, cpf, crm, rqe, endereco, foto_url, especialidade, emailJaExiste, servicoIds } = await req.json()

  if (!clinicaId || !nome || !email || !crm) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  let usuarioId: string

  if (emailJaExiste) {
    // Buscar usuário existente pelo e-mail na tabela perfis_usuario
    const { data: perfil } = await supabase
      .from('perfis_usuario')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!perfil) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }
    usuarioId = perfil.id
  } else {
    if (!senha || senha.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: nome },
    })
    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Erro ao criar usuário.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    usuarioId = authData.user.id

    await supabase.from('perfis_usuario').upsert({
      id: usuarioId,
      nome_completo: nome,
      email,
      telefone: telefone ?? null,
    })
  }

  // Verificar se já é membro dessa clínica
  const { data: membroExistente } = await supabase
    .from('membros_clinica')
    .select('id')
    .eq('clinica_id', clinicaId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  let membroId: string

  if (membroExistente) {
    membroId = membroExistente.id
  } else {
    const { data: novoMembro, error: errMembro } = await supabase
      .from('membros_clinica')
      .insert({ clinica_id: clinicaId, usuario_id: usuarioId, papel: 'medico', status: 'ativo' })
      .select('id')
      .single()

    if (errMembro || !novoMembro) {
      return NextResponse.json({ error: 'Erro ao vincular profissional: ' + errMembro?.message }, { status: 500 })
    }
    membroId = novoMembro.id
  }

  // Insert base (colunas que sempre existem no schema original)
  const { data: profissional, error: errProf } = await supabase
    .from('profissionais')
    .insert({
      clinica_id: clinicaId,
      membro_id: membroId,
      nome,
      especialidade: especialidade ?? 'Clínica Geral',
      registro_profissional: crm ?? null,
      foto_url: foto_url ?? null,
      status: 'ativo',
    })
    .select('id')
    .single()

  if (errProf || !profissional) {
    return NextResponse.json({ error: 'Erro ao cadastrar profissional: ' + errProf?.message }, { status: 500 })
  }

  // Tenta salvar campos extras — silencioso se colunas ainda não existem (rodar ALTER TABLE)
  await supabase
    .from('profissionais')
    .update({ cpf: cpf ?? null, email, telefone: telefone ?? null, rqe: rqe ?? null, endereco: endereco ?? null, usuario_id: usuarioId })
    .eq('id', profissional.id)

  // Vincular serviços que este profissional realiza
  if (Array.isArray(servicoIds) && servicoIds.length > 0) {
    await supabase.from('profissionais_servicos').insert(
      servicoIds.map((servicoId: string) => ({
        clinica_id: clinicaId,
        profissional_id: profissional.id,
        servico_id: servicoId,
      }))
    )
  }

  return NextResponse.json({
    id: membroId,
    papel: 'medico',
    statusMembro: 'ativo',
    nome,
    email,
    telefone: telefone ?? null,
    avatarUrl: foto_url ?? null,
    profissional: {
      id: profissional.id,
      especialidade: especialidade ?? 'Clínica Geral',
      registroProfissional: crm ?? null,
      status: 'ativo',
    },
  }, { status: 201 })
}
