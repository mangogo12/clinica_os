import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ClientesClient, type Paciente } from '@/components/clientes/ClientesClient'
import { registrarAuditoria } from '@/lib/auditoria'

export const metadata = { title: 'Clientes â€” ClinicaOS' }

export default async function ClientesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const { data: pacientes } = await supabase
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

  return <ClientesClient pacientes={(pacientes ?? []) as unknown as Paciente[]} clinicaId={clinicaId} />
}

