import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient, type Membro } from '@/components/configuracoes/ConfiguracoesClient'

export const metadata = { title: 'ConfiguraÃ§Ãµes â€” ClinicaOS' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const [{ data: clinica }, { data: membrosClinica }] = await Promise.all([
    supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .single(),
    supabase
      .from('membros_clinica')
      .select('id, usuario_id, papel, status')
      .eq('clinica_id', clinicaId)
      .order('criado_em'),
  ])

  const usuarioIds = (membrosClinica ?? []).map(m => m.usuario_id)
  const { data: perfis } = usuarioIds.length
    ? await supabase
        .from('perfis_usuario')
        .select('id, nome_completo, email, avatar_url')
        .in('id', usuarioIds)
    : { data: [] }

  const membros: Membro[] = (membrosClinica ?? []).map(m => ({
    id: m.id,
    papel: m.papel,
    status: m.status,
    perfil: perfis?.find(p => p.id === m.usuario_id) ?? null,
  }))

  return <ConfiguracoesClient clinica={clinica as Record<string, unknown> | null} membros={membros} />
}

