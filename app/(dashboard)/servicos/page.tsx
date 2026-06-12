import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { ServicosClient } from '@/components/servicos/ServicosClient'

export const metadata = { title: 'Serviços — ClinicaOS' }
export const dynamic = 'force-dynamic'

export default async function ServicosPage() {
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  const admin = await createAdminClient()

  const [{ data: servicos, error }, { data: profissionais }, { data: vinculos }] = await Promise.all([
    admin
      .from('servicos')
      .select('id, nome, descricao, duracao_minutos, preco, ativo, popular')
      .eq('clinica_id', clinicaId)
      .order('nome'),
    admin
      .from('profissionais')
      .select('id, nome, especialidade')
      .eq('clinica_id', clinicaId)
      .eq('status', 'ativo')
      .order('nome'),
    admin
      .from('profissionais_servicos')
      .select('profissional_id, servico_id')
      .eq('clinica_id', clinicaId),
  ])

  if (error) console.error('[servicos]', clinicaId, error.message)

  return (
    <ServicosClient
      servicos={servicos ?? []}
      profissionais={profissionais ?? []}
      vinculos={vinculos ?? []}
      clinicaId={clinicaId}
    />
  )
}
