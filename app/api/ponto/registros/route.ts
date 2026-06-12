import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const PERFIS_AUTORIZADOS = ['admin', 'financeiro', 'medico_admin']

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não selecionada.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: membro } = await admin
    .from('membros_clinica')
    .select('papel')
    .eq('clinica_id', clinicaId)
    .eq('usuario_id', user.id)
    .eq('status', 'ativo')
    .maybeSingle()

  if (!membro || !PERFIS_AUTORIZADOS.includes(membro.papel)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const limite = Math.min(Number(req.nextUrl.searchParams.get('limite') ?? '30'), 100)

  const { data: registros } = await admin
    .from('registros_ponto')
    .select('id, usuario_id, tipo, registrado_em')
    .eq('clinica_id', clinicaId)
    .order('registrado_em', { ascending: false })
    .limit(limite)

  const usuarioIds = Array.from(new Set((registros ?? []).map(r => r.usuario_id)))

  let perfis: { id: string; nome_completo: string; avatar_url: string | null }[] = []
  if (usuarioIds.length) {
    const { data } = await admin
      .from('perfis_usuario')
      .select('id, nome_completo, avatar_url')
      .in('id', usuarioIds)
    perfis = data ?? []
  }

  const perfilMap = new Map(perfis.map(p => [p.id, p]))

  const data = (registros ?? []).map(r => ({
    id: r.id,
    tipo: r.tipo,
    registrado_em: r.registrado_em,
    usuario: perfilMap.get(r.usuario_id) ?? null,
  }))

  return NextResponse.json(data)
}
