import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verificar sessão do usuário
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { nomeClinica, subdominio, perfil, area } = await req.json()

  if (!nomeClinica || !subdominio) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Garantir subdomínio único
  const { data: existing } = await supabase
    .from('clinicas')
    .select('id')
    .eq('subdominio', subdominio)
    .maybeSingle()

  const subdominioFinal = existing
    ? subdominio + '-' + Math.random().toString(36).substring(2, 5)
    : subdominio

  // Criar clínica com trial de 3 dias (armazenado em configuracoes)
  const trialExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: clinica, error: errClinica } = await supabase
    .from('clinicas')
    .insert({
      nome: nomeClinica,
      subdominio: subdominioFinal,
      plano: 'starter',
      status: 'ativo',
      email: user.email,
      configuracoes: { perfil_proprietario: perfil ?? '', area: area ?? '', trial_expires_at: trialExpires },
    })
    .select('id')
    .single()

  if (errClinica || !clinica) {
    return NextResponse.json({ error: 'Erro ao criar clínica: ' + errClinica?.message }, { status: 500 })
  }

  // Vincular usuário como admin
  const { error: errMembro } = await supabase
    .from('membros_clinica')
    .insert({
      clinica_id: clinica.id,
      usuario_id: user.id,
      papel: 'admin',
      status: 'ativo',
    })

  if (errMembro) {
    return NextResponse.json({ error: 'Erro ao vincular usuário: ' + errMembro.message }, { status: 500 })
  }

  return NextResponse.json({ clinicaId: clinica.id, subdominio: subdominioFinal }, { status: 201 })
}
