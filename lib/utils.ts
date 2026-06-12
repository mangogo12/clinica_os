import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export const STATUS_AGENDAMENTO_VALUES = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'falta'] as const

export function statusAgendamentoLabel(status: string): string {
  const map: Record<string, string> = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_atendimento: 'Em Curso',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    falta: 'Falta',
  }
  return map[status] ?? status
}

export function statusAgendamentoBadge(status: string): string {
  const map: Record<string, string> = {
    agendado: 'badge-info',
    confirmado: 'badge-success',
    em_atendimento: 'badge-warning',
    concluido: 'badge-success',
    cancelado: 'badge-danger',
    falta: 'badge-neutral',
  }
  return map[status] ?? 'badge-neutral'
}

export const CATEGORIA_FINANCEIRA_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  exame: 'Exame',
  procedimento: 'Procedimento',
  convenio: 'Convênio',
  aluguel: 'Aluguel',
  salario: 'Salário',
  material: 'Material',
  marketing: 'Marketing',
  outros: 'Outros',
}

export const FONTE_PACIENTE_LABELS: Record<string, string> = {
  agendamento_publico: 'Agend. Público',
  cadastro_manual: 'Cadastro Manual',
  indicacao: 'Indicação',
  convenio: 'Convênio',
}

export function statusPacienteBadge(status: string): string {
  const map: Record<string, string> = {
    ativo: 'badge-success',
    inativo: 'badge-neutral',
    alta: 'badge-info',
    em_tratamento: 'badge-warning',
    aguardando: 'badge-neutral',
    marcado: 'badge-info',
    atendido: 'badge-success',
  }
  return map[status] ?? 'badge-neutral'
}
