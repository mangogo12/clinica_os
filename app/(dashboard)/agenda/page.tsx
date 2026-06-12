import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { AgendaClient, type AgItem } from '@/components/agenda/AgendaClient'
import { reconciliarAtendimentos } from '@/lib/agenda'

export const metadata = { title: 'Agenda â€” ClinicaOS' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(fimSemana.getDate() + 6)

  const admin = await createAdminClient()

  await reconciliarAtendimentos(admin, clinicaId)

  const [{ data: agendamentos }, { data: profissionais }, { data: servicos }, { data: pacientes }, { data: profissionaisServicos }] = await Promise.all([
    admin
      .from('agendamentos')
      .select(`
        id, data_hora_inicio, data_hora_fim, status, observacoes,
        paciente:pacientes(id, nome, telefone),
        profissional:profissionais(id, nome, especialidade),
        servico:servicos(id, nome, duracao_minutos, preco)
      `)
      .eq('clinica_id', clinicaId)
      .gte('data_hora_inicio', inicioSemana.toISOString())
      .lte('data_hora_inicio', fimSemana.toISOString())
      .order('data_hora_inicio'),

    admin.from('profissionais').select('id, nome, especialidade').eq('clinica_id', clinicaId).eq('status', 'ativo'),
    admin.from('servicos').select('id, nome, duracao_minutos, preco').eq('clinica_id', clinicaId).eq('ativo', true),
    admin.from('pacientes').select('id, nome, telefone, cpf').eq('clinica_id', clinicaId).order('nome').limit(200),
    admin.from('profissionais_servicos').select('profissional_id, servico_id').eq('clinica_id', clinicaId),
  ])

  return (
    <AgendaClient
      agendamentos={(agendamentos ?? []) as unknown as AgItem[]}
      profissionais={profissionais ?? []}
      servicos={servicos ?? []}
      pacientes={pacientes ?? []}
      profissionaisServicos={profissionaisServicos ?? []}
      clinicaId={clinicaId}
    />
  )
}

