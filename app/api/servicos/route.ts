import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const { nome, descricao, duracao_minutos, preco, profissionalIds } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('servicos')
    .insert({
      clinica_id: clinicaId,
      nome: nome.trim(),
      descricao: descricao || null,
      duracao_minutos: duracao_minutos ?? 30,
      preco: preco ?? 0,
      ativo: true,
    })
    .select('id, nome, descricao, duracao_minutos, preco, ativo, popular')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(profissionalIds) && profissionalIds.length > 0) {
    await admin.from('profissionais_servicos').insert(
      profissionalIds.map((profissionalId: string) => ({
        clinica_id: clinicaId,
        profissional_id: profissionalId,
        servico_id: data.id,
      }))
    )
  }

  return NextResponse.json(data, { status: 201 })
}
