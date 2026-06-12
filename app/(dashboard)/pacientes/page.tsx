import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PacientesClient, type Paciente } from '@/components/pacientes/PacientesClient'
import { registrarAuditoria } from '@/lib/auditoria'
import { reconciliarAtendimentos } from '@/lib/agenda'

export const metadata = { title: 'Pacientes — ClinicaOS' }
export const dynamic = 'force-dynamic'

export default async function PacientesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()

  await reconciliarAtendimentos(admin, clinicaId)

  const { data: pacientes } = await admin
    .from('pacientes')
    .select(`
      id, nome, cpf, email, telefone, status, fonte,
      ultima_consulta, criado_em,
      profissional_responsavel:profissionais(id, nome)
    `)
    .eq('clinica_id', clinicaId)
    .order('nome')

  await registrarAuditoria({
    clinicaId,
    usuarioId: user?.id ?? null,
    acao: 'visualizar_paciente',
    tabela: 'pacientes',
    detalhes: { count: pacientes?.length },
  })

  return <PacientesClient pacientes={(pacientes ?? []) as unknown as Paciente[]} clinicaId={clinicaId} />
}
