import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AgendaClient, type AgItem } from '@/components/agenda/AgendaClient'

export const metadata = { title: 'Agenda â€” ClinicaOS' }

export default async function AgendaPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(fimSemana.getDate() + 6)

  const [{ data: agendamentos }, { data: profissionais }, { data: servicos }, { data: pacientes }] = await Promise.all([
    supabase
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

    supabase.from('profissionais').select('id, nome, especialidade').eq('clinica_id', clinicaId).eq('status', 'ativo'),
    supabase.from('servicos').select('id, nome, duracao_minutos, preco').eq('clinica_id', clinicaId).eq('ativo', true),
    supabase.from('pacientes').select('id, nome, telefone, cpf').eq('clinica_id', clinicaId).order('nome').limit(200),
  ])

  return (
    <AgendaClient
      agendamentos={(agendamentos ?? []) as unknown as AgItem[]}
      profissionais={profissionais ?? []}
      servicos={servicos ?? []}
      pacientes={pacientes ?? []}
      clinicaId={clinicaId}
    />
  )
}

