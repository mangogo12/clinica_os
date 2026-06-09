// ─── Core tenant ────────────────────────────────────────────────────────────

export type PlanoTipo = 'starter' | 'pro' | 'enterprise'
export type StatusClinica = 'ativo' | 'suspenso' | 'cancelado' | 'pendente'

export interface Clinica {
  id: string
  nome: string
  subdominio: string
  logo_url: string | null
  plano: PlanoTipo
  status: StatusClinica
  cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: Record<string, string> | null
  configuracoes: Record<string, unknown>
  criado_em: string
  atualizado_em: string
}

// ─── Auth / Users ─────────────────────────────────────────────────────────

export type Papel = 'admin' | 'atendente' | 'profissional' | 'financeiro'
export type StatusMembro = 'ativo' | 'inativo' | 'pendente'

export interface MembroClinica {
  id: string
  clinica_id: string
  usuario_id: string
  papel: Papel
  status: StatusMembro
  criado_em: string
  clinica?: Clinica
  perfil?: PerfilUsuario
}

export interface PerfilUsuario {
  id: string
  nome_completo: string
  email: string
  avatar_url: string | null
  telefone: string | null
  criado_em: string
}

// ─── Profissionais ────────────────────────────────────────────────────────

export type StatusProfissional = 'ativo' | 'inativo' | 'licenca_medica' | 'ferias'

export interface Profissional {
  id: string
  clinica_id: string
  membro_id: string | null
  nome: string
  especialidade: string
  registro_profissional: string | null
  foto_url: string | null
  status: StatusProfissional
  horario_inicio: string
  horario_fim: string
  dias_atendimento: number[]
  criado_em: string
  atualizado_em: string
}

// ─── Serviços ─────────────────────────────────────────────────────────────

export interface Servico {
  id: string
  clinica_id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  preco: number
  ativo: boolean
  icone: string | null
  popular: boolean
  criado_em: string
}

// ─── Clientes / Pacientes ─────────────────────────────────────────────────

export type StatusPaciente = 'ativo' | 'inativo' | 'alta' | 'em_tratamento' | 'aguardando'
export type FontePaciente = 'agendamento_publico' | 'cadastro_manual' | 'indicacao' | 'convenio'

export interface Paciente {
  id: string
  clinica_id: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string
  data_nascimento: string | null
  status: StatusPaciente
  fonte: FontePaciente
  profissional_responsavel_id: string | null
  ultima_consulta: string | null
  observacoes: string | null
  consentimento_lgpd: boolean
  criado_em: string
  atualizado_em: string
  profissional_responsavel?: Pick<Profissional, 'id' | 'nome'>
}

// ─── Agenda / Agendamentos ────────────────────────────────────────────────

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'falta'

export interface Agendamento {
  id: string
  clinica_id: string
  paciente_id: string
  profissional_id: string
  servico_id: string
  data_hora_inicio: string
  data_hora_fim: string
  status: StatusAgendamento
  observacoes: string | null
  origem: 'dashboard' | 'publica' | 'api'
  confirmado_em: string | null
  cancelado_em: string | null
  motivo_cancelamento: string | null
  criado_em: string
  atualizado_em: string
  paciente?: Pick<Paciente, 'id' | 'nome' | 'telefone' | 'email'>
  profissional?: Pick<Profissional, 'id' | 'nome' | 'especialidade'>
  servico?: Pick<Servico, 'id' | 'nome' | 'duracao_minutos' | 'preco'>
}

// ─── Financeiro ──────────────────────────────────────────────────────────

export type TipoTransacao = 'entrada' | 'saida'
export type StatusTransacao = 'confirmado' | 'pendente' | 'cancelado' | 'pago' | 'processando'
export type CategoriaFinanceira =
  | 'consulta'
  | 'exame'
  | 'procedimento'
  | 'convenio'
  | 'aluguel'
  | 'salario'
  | 'material'
  | 'marketing'
  | 'outros'

export interface Transacao {
  id: string
  clinica_id: string
  tipo: TipoTransacao
  descricao: string
  valor: number
  categoria: CategoriaFinanceira
  status: StatusTransacao
  data_transacao: string
  agendamento_id: string | null
  paciente_id: string | null
  referencia_externa: string | null
  criado_por: string | null
  criado_em: string
  paciente?: Pick<Paciente, 'id' | 'nome'>
}

export interface ContaVencer {
  id: string
  clinica_id: string
  descricao: string
  valor: number
  vencimento: string
  pago: boolean
  pago_em: string | null
  criado_em: string
}

// ─── Auditoria ───────────────────────────────────────────────────────────

export type AcaoAuditoria =
  | 'visualizar_paciente'
  | 'criar_agendamento'
  | 'editar_agendamento'
  | 'cancelar_agendamento'
  | 'visualizar_financeiro'
  | 'criar_transacao'
  | 'deletar_registro'
  | 'login'
  | 'logout'

export interface RegistroAuditoria {
  id: string
  clinica_id: string
  usuario_id: string | null
  acao: AcaoAuditoria
  tabela: string | null
  registro_id: string | null
  detalhes: Record<string, unknown> | null
  ip_address: string | null
  criado_em: string
}

// ─── Agendamento público (lead) ───────────────────────────────────────────

export interface Lead {
  id: string
  clinica_id: string
  nome: string
  email: string | null
  telefone: string
  servico_id: string | null
  profissional_id: string | null
  mensagem: string | null
  convertido: boolean
  criado_em: string
}

// ─── UI helpers ──────────────────────────────────────────────────────────

export interface KPICard {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  icon: string
  color?: string
}

export interface SlotDisponivel {
  hora: string
  disponivel: boolean
}

export interface SessaoClinica {
  usuarioId: string
  clinicaId: string
  papel: Papel
  nomeUsuario: string
  nomeClinica: string
  avatarUrl: string | null
}
