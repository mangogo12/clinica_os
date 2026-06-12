import type { SupabaseClient } from '@supabase/supabase-js'

// Status manuais do funil de CRM que não devem ser sobrescritos pela sincronização automática.
const STATUS_MANUAIS_CRM = ['ativo', 'inativo', 'alta', 'em_tratamento']

/**
 * Espelha o status do agendamento no paciente vinculado, para que ambos sempre
 * mostrem o mesmo valor, sem sobrescrever status manuais do CRM (ativo, inativo, alta, em_tratamento).
 */
export async function sincronizarStatusPaciente(admin: SupabaseClient, clinicaId: string, pacienteId: string, statusAgendamento: string) {
  await admin
    .from('pacientes')
    .update({ status: statusAgendamento })
    .eq('id', pacienteId)
    .eq('clinica_id', clinicaId)
    .not('status', 'in', `(${STATUS_MANUAIS_CRM.join(',')})`)
}

/**
 * Marca como "concluido" os agendamentos cujo horário de término já passou
 * e espelha o mesmo status no paciente vinculado.
 */
export async function reconciliarAtendimentos(admin: SupabaseClient, clinicaId: string) {
  const agora = new Date().toISOString()

  const { data: concluidos } = await admin
    .from('agendamentos')
    .update({ status: 'concluido' })
    .eq('clinica_id', clinicaId)
    .in('status', ['agendado', 'confirmado'])
    .lte('data_hora_fim', agora)
    .select('paciente_id')

  if (!concluidos || concluidos.length === 0) return

  const pacienteIds = Array.from(new Set(concluidos.map(c => c.paciente_id as string)))

  await admin
    .from('pacientes')
    .update({ status: 'concluido' })
    .eq('clinica_id', clinicaId)
    .not('status', 'in', `(${STATUS_MANUAIS_CRM.join(',')})`)
    .in('id', pacienteIds)
}
