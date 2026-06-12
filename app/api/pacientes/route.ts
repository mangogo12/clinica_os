import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { nome, cpf, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado } = await req.json()
  if (!nome || !telefone) return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 })

  const admin = await createAdminClient()

  if (cpf) {
    const { data: existing } = await admin
      .from('pacientes')
      .select('id, nome')
      .eq('clinica_id', clinicaId)
      .eq('cpf', cpf)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ id: existing.id, nome: existing.nome, cpf, jaExistia: true }, { status: 200 })
    }
  }

  const { data, error } = await admin
    .from('pacientes')
    .insert({
      clinica_id: clinicaId,
      nome,
      cpf: cpf || null,
      telefone,
      email: email || null,
      fonte: 'cadastro_manual',
      cep: cep || null,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
    })
    .select('id, nome, cpf, email, telefone, status, fonte, ultima_consulta, criado_em, profissional_responsavel:profissionais(id, nome)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, jaExistia: false }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json([], { status: 200 })

  const admin = await createAdminClient()
  const cpf = req.nextUrl.searchParams.get('cpf')
  let query = admin.from('pacientes').select('id, nome, cpf, telefone').eq('clinica_id', clinicaId)

  if (cpf) query = query.ilike('cpf', `%${cpf.replace(/\D/g, '')}%`)

  const { data } = await query.limit(5)
  return NextResponse.json(data ?? [])
}
