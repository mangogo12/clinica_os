import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ entrada: null, saida: null })

  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('registros_ponto')
    .select('tipo, registrado_em')
    .eq('clinica_id', clinicaId)
    .eq('usuario_id', user.id)
    .gte('registrado_em', inicioDia.toISOString())
    .order('registrado_em')

  const registros = data ?? []
  const entrada = registros.find(r => r.tipo === 'entrada')?.registrado_em ?? null
  const saida = [...registros].reverse().find(r => r.tipo === 'saida')?.registrado_em ?? null

  return NextResponse.json({ entrada, saida })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { tipo } = await req.json()
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return NextResponse.json({ error: 'Tipo de registro inválido.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('registros_ponto')
    .insert({ clinica_id: clinicaId, usuario_id: user.id, tipo })
    .select('id, tipo, registrado_em')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
