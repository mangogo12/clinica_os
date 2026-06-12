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
  const update: Record<string, unknown> = {}
  if (typeof body.nome === 'string') update.nome = body.nome.trim()
  if ('descricao' in body) update.descricao = body.descricao || null
  if (typeof body.duracao_minutos === 'number') update.duracao_minutos = body.duracao_minutos
  if (typeof body.preco === 'number') update.preco = body.preco
  if (typeof body.ativo === 'boolean') update.ativo = body.ativo

  const admin = await createAdminClient()

  let data, error
  if (Object.keys(update).length > 0) {
    ({ data, error } = await admin
      .from('servicos')
      .update(update)
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select('id, nome, descricao, duracao_minutos, preco, ativo, popular')
      .single())
  } else {
    ({ data, error } = await admin
      .from('servicos')
      .select('id, nome, descricao, duracao_minutos, preco, ativo, popular')
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(body.profissionalIds)) {
    await admin.from('profissionais_servicos').delete().eq('servico_id', id).eq('clinica_id', clinicaId)
    if (body.profissionalIds.length > 0) {
      await admin.from('profissionais_servicos').insert(
        body.profissionalIds.map((profissionalId: string) => ({
          clinica_id: clinicaId,
          profissional_id: profissionalId,
          servico_id: id,
        }))
      )
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
    .from('servicos')
    .delete()
    .eq('id', id)
    .eq('clinica_id', clinicaId)

  if (error) return NextResponse.json({ error: 'Não é possível excluir: este serviço já possui agendamentos vinculados.' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
