import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const { nome, cpf, telefone } = await req.json()
  if (!nome || !telefone) return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 })

  // Verificar se CPF já existe nessa clínica
  if (cpf) {
    const { data: existing } = await supabase
      .from('pacientes')
      .select('id, nome')
      .eq('clinica_id', clinicaId)
      .eq('cpf', cpf)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ id: existing.id, nome: existing.nome, cpf, jaExistia: true }, { status: 200 })
    }
  }

  const { data, error } = await supabase
    .from('pacientes')
    .insert({ clinica_id: clinicaId, nome, cpf: cpf || null, telefone, fonte: 'cadastro_manual' })
    .select('id, nome, cpf')
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

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const cpf = req.nextUrl.searchParams.get('cpf')
  let query = supabase.from('pacientes').select('id, nome, cpf, telefone').eq('clinica_id', clinicaId)

  if (cpf) query = query.ilike('cpf', `%${cpf.replace(/\D/g, '')}%`)

  const { data } = await query.limit(5)
  return NextResponse.json(data ?? [])
}
