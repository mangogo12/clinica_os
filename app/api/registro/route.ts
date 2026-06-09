import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const {
    nomeUsuario,
    email,
    senha,
    celular,
    perfil,
    area,
    nomeClinica,
    subdominio,
  } = await req.json()

  if (!email || !senha || !nomeClinica || !subdominio) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // 1. Criar usuário via admin (email já confirmado, sem e-mail de verificação)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: nomeUsuario },
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Erro ao criar conta.'
    const status = msg.includes('already registered') ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }

  const usuarioId = authData.user.id

  // 2. Garantir que o subdomínio é único
  const { data: existing } = await supabase
    .from('clinicas')
    .select('id')
    .eq('subdominio', subdominio)
    .maybeSingle()

  const subdominioFinal = existing
    ? subdominio + '-' + Math.random().toString(36).substring(2, 5)
    : subdominio

  // 3. Criar a clínica com trial de 3 dias (armazenado em configuracoes)
  const trialExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: clinica, error: errClinica } = await supabase
    .from('clinicas')
    .insert({
      nome: nomeClinica,
      subdominio: subdominioFinal,
      plano: 'starter',
      status: 'ativo',
      email,
      configuracoes: { perfil_proprietario: perfil, area, trial_expires_at: trialExpires },
    })
    .select('id')
    .single()

  if (errClinica || !clinica) {
    // Rollback: remover usuário criado
    await supabase.auth.admin.deleteUser(usuarioId)
    return NextResponse.json({ error: 'Erro ao criar clínica: ' + errClinica?.message }, { status: 500 })
  }

  // 4. Atualizar perfil com celular e nome
  await supabase
    .from('perfis_usuario')
    .update({ telefone: celular, nome_completo: nomeUsuario })
    .eq('id', usuarioId)

  // 5. Criar vínculo admin
  const { error: errMembro } = await supabase
    .from('membros_clinica')
    .insert({
      clinica_id: clinica.id,
      usuario_id: usuarioId,
      papel: 'admin',
      status: 'ativo',
    })

  if (errMembro) {
    await supabase.auth.admin.deleteUser(usuarioId)
    return NextResponse.json({ error: 'Erro ao vincular usuário: ' + errMembro.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, clinicaId: clinica.id, subdominio: subdominioFinal }, { status: 201 })
}
