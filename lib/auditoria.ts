import type { AcaoAuditoria } from '@/types'

interface AuditoriaParams {
  clinicaId: string
  usuarioId: string | null
  acao: AcaoAuditoria
  tabela?: string
  registroId?: string
  detalhes?: Record<string, unknown>
  ipAddress?: string
}

export async function registrarAuditoria(params: AuditoriaParams) {
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabase = await createAdminClient()
    await supabase.from('auditoria').insert({
      clinica_id: params.clinicaId,
      usuario_id: params.usuarioId,
      acao: params.acao,
      tabela: params.tabela ?? null,
      registro_id: params.registroId ?? null,
      detalhes: params.detalhes ?? null,
      ip_address: params.ipAddress ?? null,
    })
  } catch {
    // Auditoria não deve quebrar o fluxo principal
  }
}
