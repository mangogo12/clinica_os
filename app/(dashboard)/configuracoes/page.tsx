import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient, type Membro } from '@/components/configuracoes/ConfiguracoesClient'

export const metadata = { title: 'ConfiguraÃ§Ãµes â€” ClinicaOS' }

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const [{ data: clinica }, { data: membros }] = await Promise.all([
    supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinicaId)
      .single(),
    supabase
      .from('membros_clinica')
      .select(`
        id, papel, status,
        perfil:perfis_usuario(id, nome_completo, email, avatar_url)
      `)
      .eq('clinica_id', clinicaId)
      .order('criado_em'),
  ])

  return <ConfiguracoesClient clinica={clinica as Record<string, unknown> | null} membros={(membros ?? []) as unknown as Membro[]} />
}

