import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import {
  DashboardsClient,
  type DashboardsData,
  type Periodo,
  type SeriePonto,
  type StatusCount,
  type BarDatum,
  type NomeTotalDatum,
  type ProfissionalStat,
} from '@/components/dashboards/DashboardsClient'
import { statusAgendamentoLabel, STATUS_AGENDAMENTO_VALUES, CATEGORIA_FINANCEIRA_LABELS, FONTE_PACIENTE_LABELS } from '@/lib/utils'

export const metadata = { title: 'Dashboards — ClinicaOS' }
export const dynamic = 'force-dynamic'

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const STATUS_AGENDAMENTO_ORDEM = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'falta'] as const

const STATUS_COR: Record<string, string> = {
  agendado: '#1D4ED8',
  confirmado: '#027A48',
  em_atendimento: '#B45309',
  concluido: '#12B76A',
  cancelado: '#EF4444',
  falta: '#6B7280',
}

const STATUS_PACIENTE_LEGADO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  alta: 'Alta',
  em_tratamento: 'Em Tratamento',
  aguardando: 'Aguardando',
}

const STATUS_PACIENTE_LEGADO_COR: Record<string, string> = {
  ativo: '#12B76A',
  inativo: '#9CA3AF',
  alta: '#1D4ED8',
  em_tratamento: '#B45309',
  aguardando: '#6B7280',
}

function labelStatusPaciente(status: string): string {
  if ((STATUS_AGENDAMENTO_VALUES as readonly string[]).includes(status)) return statusAgendamentoLabel(status)
  return STATUS_PACIENTE_LEGADO_LABELS[status] ?? status
}

function corStatusPaciente(status: string): string {
  return STATUS_COR[status] ?? STATUS_PACIENTE_LEGADO_COR[status] ?? '#6B7280'
}

interface Bucket { label: string; inicio: Date; fim: Date }

function gerarBuckets(periodo: Periodo, hoje: Date): Bucket[] {
  const buckets: Bucket[] = []

  if (periodo === '12m') {
    for (let i = 11; i >= 0; i--) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1)
      buckets.push({ label: MESES_ABREV[inicio.getMonth()], inicio, fim })
    }
  } else if (periodo === '90d') {
    for (let i = 12; i >= 0; i--) {
      const fim = new Date(hoje)
      fim.setHours(0, 0, 0, 0)
      fim.setDate(fim.getDate() - i * 7 + 1)
      const inicio = new Date(fim)
      inicio.setDate(fim.getDate() - 7)
      buckets.push({ label: `${String(inicio.getDate()).padStart(2, '0')}/${String(inicio.getMonth() + 1).padStart(2, '0')}`, inicio, fim })
    }
  } else {
    const dias = periodo === '7d' ? 7 : 30
    for (let i = dias - 1; i >= 0; i--) {
      const inicio = new Date(hoje)
      inicio.setHours(0, 0, 0, 0)
      inicio.setDate(inicio.getDate() - i)
      const fim = new Date(inicio)
      fim.setDate(inicio.getDate() + 1)
      buckets.push({ label: `${String(inicio.getDate()).padStart(2, '0')}/${String(inicio.getMonth() + 1).padStart(2, '0')}`, inicio, fim })
    }
  }

  return buckets
}

function bucketIndex(buckets: Bucket[], date: Date): number {
  for (let i = 0; i < buckets.length; i++) {
    if (date >= buckets[i].inicio && date < buckets[i].fim) return i
  }
  return -1
}

interface TransacaoRow { valor: number | string; tipo: string; status: string; data_transacao: string; categoria: string }
interface AgendamentoRow { id: string; data_hora_inicio: string; status: string; profissional: { id: string; nome: string } | null }
interface PacienteRow { id: string; criado_em: string; status: string; fonte: string }
interface ProfissionalRow { id: string; nome: string; especialidade: string }

export default async function DashboardsPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams
  const periodo: Periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo) ? (sp.periodo as Periodo) : '30d'

  const admin = await createAdminClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  const hoje = new Date()
  const buckets = gerarBuckets(periodo, hoje)
  const inicioRange = buckets[0].inicio
  const fimRange = new Date(hoje)
  fimRange.setHours(23, 59, 59, 999)

  const inicioISO = inicioRange.toISOString()
  const fimISO = fimRange.toISOString()
  const inicioDateStr = inicioISO.split('T')[0]
  const fimDateStr = fimISO.split('T')[0]

  const [
    { data: transacoesData },
    { data: agendamentosData },
    { data: pacientesData },
    { count: totalPacientes },
    { data: profissionaisData },
  ] = await Promise.all([
    admin
      .from('transacoes')
      .select('valor, tipo, status, data_transacao, categoria')
      .eq('clinica_id', clinicaId)
      .gte('data_transacao', inicioDateStr)
      .lte('data_transacao', fimDateStr),

    admin
      .from('agendamentos')
      .select('id, data_hora_inicio, status, profissional:profissionais(id, nome)')
      .eq('clinica_id', clinicaId)
      .gte('data_hora_inicio', inicioISO)
      .lte('data_hora_inicio', fimISO),

    admin
      .from('pacientes')
      .select('id, criado_em, status, fonte')
      .eq('clinica_id', clinicaId)
      .gte('criado_em', inicioISO),

    admin
      .from('pacientes')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId),

    admin
      .from('profissionais')
      .select('id, nome, especialidade')
      .eq('clinica_id', clinicaId)
      .order('nome'),
  ])

  const transacoes = (transacoesData ?? []) as unknown as TransacaoRow[]
  const agendamentos = (agendamentosData ?? []) as unknown as AgendamentoRow[]
  const pacientes = (pacientesData ?? []) as unknown as PacienteRow[]
  const profissionaisLista = (profissionaisData ?? []) as unknown as ProfissionalRow[]

  // ---- Série temporal ----
  const serie: SeriePonto[] = buckets.map(b => ({ label: b.label, receitas: 0, despesas: 0, agendamentos: 0, pacientes: 0 }))

  let receitasTotal = 0
  let despesasTotal = 0
  const porCategoriaMap = new Map<string, number>()

  for (const t of transacoes) {
    if (t.status !== 'confirmado' && t.status !== 'pago') continue
    const valor = Number(t.valor)
    const idx = bucketIndex(buckets, new Date(`${t.data_transacao}T00:00:00`))
    if (t.tipo === 'entrada') {
      receitasTotal += valor
      if (idx >= 0) serie[idx].receitas += valor
      porCategoriaMap.set(t.categoria, (porCategoriaMap.get(t.categoria) ?? 0) + valor)
    } else {
      despesasTotal += valor
      if (idx >= 0) serie[idx].despesas += valor
    }
  }

  // ---- Agenda ----
  const statusCountMap = new Map<string, number>()
  const profMap = new Map<string, { nome: string; total: number; concluidos: number; cancelados: number }>()

  for (const ag of agendamentos) {
    const idx = bucketIndex(buckets, new Date(ag.data_hora_inicio))
    if (idx >= 0) serie[idx].agendamentos += 1
    statusCountMap.set(ag.status, (statusCountMap.get(ag.status) ?? 0) + 1)

    if (ag.profissional) {
      const entry = profMap.get(ag.profissional.id) ?? { nome: ag.profissional.nome, total: 0, concluidos: 0, cancelados: 0 }
      entry.total += 1
      if (ag.status === 'concluido') entry.concluidos += 1
      if (ag.status === 'cancelado' || ag.status === 'falta') entry.cancelados += 1
      profMap.set(ag.profissional.id, entry)
    }
  }

  // ---- Pacientes ----
  const pacStatusMap = new Map<string, number>()
  const pacFonteMap = new Map<string, number>()

  for (const p of pacientes) {
    const idx = bucketIndex(buckets, new Date(p.criado_em))
    if (idx >= 0) serie[idx].pacientes += 1
    pacStatusMap.set(p.status, (pacStatusMap.get(p.status) ?? 0) + 1)
    pacFonteMap.set(p.fonte, (pacFonteMap.get(p.fonte) ?? 0) + 1)
  }

  // ---- Montagem dos dados finais ----
  const porStatusAgenda: StatusCount[] = STATUS_AGENDAMENTO_ORDEM
    .map(status => ({ status, label: statusAgendamentoLabel(status), valor: statusCountMap.get(status) ?? 0, cor: STATUS_COR[status] }))
    .filter(s => s.valor > 0)

  const porProfissionalAgenda: NomeTotalDatum[] = Array.from(profMap.values())
    .map(({ nome, total }) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)

  const porCategoriaFinanceiro: BarDatum[] = Array.from(porCategoriaMap.entries())
    .map(([categoria, valor]) => ({ label: CATEGORIA_FINANCEIRA_LABELS[categoria] ?? categoria, valor }))
    .sort((a, b) => b.valor - a.valor)

  const porStatusPacientes: StatusCount[] = Array.from(pacStatusMap.entries())
    .map(([status, valor]) => ({ status, label: labelStatusPaciente(status), valor, cor: corStatusPaciente(status) }))
    .sort((a, b) => b.valor - a.valor)

  const porFontePacientes: BarDatum[] = Array.from(pacFonteMap.entries())
    .map(([fonte, valor]) => ({ label: FONTE_PACIENTE_LABELS[fonte] ?? fonte, valor }))
    .sort((a, b) => b.valor - a.valor)

  const profissionais: ProfissionalStat[] = profissionaisLista
    .map(p => {
      const stat = profMap.get(p.id)
      return {
        id: p.id,
        nome: p.nome,
        especialidade: p.especialidade,
        total: stat?.total ?? 0,
        concluidos: stat?.concluidos ?? 0,
        cancelados: stat?.cancelados ?? 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  const data: DashboardsData = {
    periodo,
    serie,
    financeiro: {
      receitas: receitasTotal,
      despesas: despesasTotal,
      porCategoria: porCategoriaFinanceiro,
    },
    agenda: {
      total: agendamentos.length,
      porStatus: porStatusAgenda,
      porProfissional: porProfissionalAgenda,
    },
    pacientes: {
      novos: pacientes.length,
      total: totalPacientes ?? 0,
      porStatus: porStatusPacientes,
      porFonte: porFontePacientes,
    },
    profissionais,
  }

  return <DashboardsClient data={data} />
}
