'use client'

import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Search, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { statusAgendamentoLabel } from '@/lib/utils'

const HORAS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`)
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const STATUS_CORES: Record<string, string> = {
  agendado: 'bg-blue-100 border-blue-400 text-blue-800',
  confirmado: 'bg-green-100 border-green-400 text-green-800',
  em_atendimento: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  concluido: 'bg-gray-100 border-gray-400 text-gray-700',
  cancelado: 'bg-red-100 border-red-400 text-red-700',
  falta: 'bg-orange-100 border-orange-400 text-orange-700',
}

export interface AgItem {
  id: string
  data_hora_inicio: string
  data_hora_fim: string
  status: string
  observacoes?: string
  paciente: { id: string; nome: string; telefone?: string } | null
  profissional: { id: string; nome: string; especialidade?: string } | null
  servico: { id: string; nome: string; duracao_minutos?: number; preco?: number } | null
}

interface Props {
  agendamentos: AgItem[]
  profissionais: { id: string; nome: string; especialidade?: string }[]
  servicos: { id: string; nome: string; duracao_minutos?: number; preco?: number }[]
  pacientes: { id: string; nome: string; telefone?: string; cpf?: string }[]
  clinicaId: string
}

type PacienteEncontrado = { id: string; nome: string; cpf?: string | null; telefone?: string }

export function AgendaClient({ agendamentos, profissionais, servicos, pacientes, clinicaId }: Props) {
  const supabase = createClient()
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Paciente
  const [modoPaciente, setModoPaciente] = useState<'buscar' | 'novo'>('buscar')
  const [cpfBusca, setCpfBusca] = useState('')
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteEncontrado | null>(null)
  const [resultadoBusca, setResultadoBusca] = useState<PacienteEncontrado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoCpf, setNovoCpf] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [cadastrandoPaciente, setCadastrandoPaciente] = useState(false)
  const [erroPaciente, setErroPaciente] = useState<string | null>(null)

  const [form, setForm] = useState({
    paciente_id: '',
    profissional_id: '',
    servico_id: '',
    data: new Date().toISOString().split('T')[0],
    hora: '08:00',
    observacoes: '',
  })

  async function buscarPorCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length < 3) { setResultadoBusca([]); return }
    setBuscando(true)
    const res = await fetch(`/api/pacientes?cpf=${digits}`)
    const data = await res.json()
    setResultadoBusca(data)
    setBuscando(false)
  }

  function selecionarPaciente(p: PacienteEncontrado) {
    setPacienteSelecionado(p)
    setForm(f => ({ ...f, paciente_id: p.id }))
    setResultadoBusca([])
    setCpfBusca('')
  }

  async function cadastrarNovoPaciente() {
    if (!novoNome.trim() || !novoTelefone.trim()) {
      setErroPaciente('Nome e telefone são obrigatórios.')
      return
    }
    setErroPaciente(null)
    setCadastrandoPaciente(true)
    const res = await fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, cpf: novoCpf || null, telefone: novoTelefone }),
    })
    const json = await res.json()
    if (!res.ok && res.status !== 200) {
      setErroPaciente(json.error ?? 'Erro ao cadastrar.')
      setCadastrandoPaciente(false)
      return
    }
    selecionarPaciente({ id: json.id, nome: json.nome, cpf: json.cpf })
    setModoPaciente('buscar')
    setNovoNome(''); setNovoCpf(''); setNovoTelefone('')
    setCadastrandoPaciente(false)
  }

  function abrirModal() {
    setPacienteSelecionado(null)
    setForm(f => ({ ...f, paciente_id: '' }))
    setCpfBusca(''); setResultadoBusca([])
    setModoPaciente('buscar')
    setModalAberto(true)
  }

  // Calcular dias da semana
  const base = new Date()
  base.setDate(base.getDate() - base.getDay() + semanaOffset * 7)
  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d
  })

  function agendamentosNoDia(dia: Date, hora: string) {
    const diaStr = dia.toISOString().split('T')[0]
    return agendamentos.filter(ag => {
      const agData = ag.data_hora_inicio.split('T')[0]
      const agHora = ag.data_hora_inicio.split('T')[1]?.substring(0, 5)
      return agData === diaStr && agHora === hora
    })
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const servico = servicos.find(s => s.id === form.servico_id)
    const duracao = servico?.duracao_minutos ?? 30
    const inicio = new Date(`${form.data}T${form.hora}:00`)
    const fim = new Date(inicio.getTime() + duracao * 60000)

    await supabase.from('agendamentos').insert({
      clinica_id: clinicaId,
      paciente_id: form.paciente_id,
      profissional_id: form.profissional_id,
      servico_id: form.servico_id,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      observacoes: form.observacoes || null,
      origem: 'dashboard',
    })

    setModalAberto(false)
    setSalvando(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Agenda Médica</h1>
          <p className="text-[12px] text-[#9CA3AF]">Todos os Profissionais</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E5E7EB] p-1">
            <button className="px-3 py-1 text-[12px] bg-primary text-white rounded-md font-medium">Sem</button>
            <button className="px-3 py-1 text-[12px] text-[#444654] hover:bg-[#F0F2FF] rounded-md">Mês</button>
            <button className="px-3 py-1 text-[12px] text-[#444654] hover:bg-[#F0F2FF] rounded-md">Dia</button>
          </div>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendário semanal */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header da semana */}
        <div className="flex items-center border-b border-[#F0F2FF]">
          <div className="w-16 flex-shrink-0 p-3">
            <div className="flex gap-1">
              <button onClick={() => setSemanaOffset(o => o - 1)} className="text-[#9CA3AF] hover:text-[#444654] p-1">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setSemanaOffset(o => o + 1)} className="text-[#9CA3AF] hover:text-[#444654] p-1">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {diasDaSemana.map((dia, i) => {
            const isHoje = dia.toDateString() === new Date().toDateString()
            return (
              <div key={i} className={`flex-1 p-3 text-center border-l border-[#F0F2FF] ${isHoje ? 'bg-[#F0F2FF]' : ''}`}>
                <p className="text-[11px] text-[#9CA3AF] font-medium">{DIAS_SEMANA[i]}</p>
                <p className={`text-[16px] font-bold ${isHoje ? 'text-primary' : 'text-[#1A1A2E]'}`}>
                  {dia.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
          {HORAS.map(hora => (
            <div key={hora} className="flex border-b border-[#F0F2FF] min-h-[56px]">
              <div className="w-16 flex-shrink-0 px-3 py-2 text-[11px] text-[#9CA3AF]">{hora}</div>
              {diasDaSemana.map((dia, i) => {
                const ags = agendamentosNoDia(dia, hora)
                return (
                  <div key={i} className="flex-1 border-l border-[#F0F2FF] p-1 relative">
                    {ags.map(ag => (
                      <div
                        key={ag.id}
                        className={`rounded border-l-2 px-2 py-1 mb-1 cursor-pointer ${STATUS_CORES[ag.status] ?? 'bg-gray-100 border-gray-400'}`}
                      >
                        <p className="text-[11px] font-semibold truncate">{ag.paciente?.nome}</p>
                        <p className="text-[10px] truncate opacity-75">{ag.servico?.nome}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="p-4 border-t border-[#F0F2FF] flex flex-wrap gap-3">
          {Object.entries(STATUS_CORES).map(([status, cls]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border-l-2 ${cls}`} />
              <span className="text-[11px] text-[#444654]">{statusAgendamentoLabel(status)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">Novo Agendamento</h2>
              <button onClick={() => setModalAberto(false)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={salvarAgendamento} className="p-5 space-y-4">
              {/* Paciente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-medium text-[#444654]">Paciente *</label>
                  <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden text-[11px]">
                    <button type="button" onClick={() => setModoPaciente('buscar')}
                      className={`flex items-center gap-1 px-2.5 py-1 ${modoPaciente === 'buscar' ? 'bg-primary text-white' : 'text-[#444654] hover:bg-[#F0F2FF]'}`}>
                      <Search size={11} /> Buscar CPF
                    </button>
                    <button type="button" onClick={() => setModoPaciente('novo')}
                      className={`flex items-center gap-1 px-2.5 py-1 border-l border-[#E5E7EB] ${modoPaciente === 'novo' ? 'bg-primary text-white' : 'text-[#444654] hover:bg-[#F0F2FF]'}`}>
                      <UserPlus size={11} /> Cadastrar
                    </button>
                  </div>
                </div>

                {pacienteSelecionado ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-[13px] font-semibold text-green-800">{pacienteSelecionado.nome}</p>
                      {pacienteSelecionado.cpf && <p className="text-[11px] text-green-600">CPF: {pacienteSelecionado.cpf}</p>}
                    </div>
                    <button type="button" onClick={() => { setPacienteSelecionado(null); setForm(f => ({ ...f, paciente_id: '' })) }}
                      className="text-green-600 hover:text-green-800">
                      <X size={14} />
                    </button>
                  </div>
                ) : modoPaciente === 'buscar' ? (
                  <div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text" placeholder="Digite o CPF do paciente..."
                        value={cpfBusca}
                        onChange={e => { setCpfBusca(e.target.value); buscarPorCpf(e.target.value) }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    {buscando && <p className="text-[11px] text-[#9CA3AF] mt-1">Buscando...</p>}
                    {resultadoBusca.length > 0 && (
                      <div className="border border-[#E5E7EB] rounded-lg mt-1 overflow-hidden">
                        {resultadoBusca.map(p => (
                          <button key={p.id} type="button" onClick={() => selecionarPaciente(p)}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F0F2FF] border-b border-[#F0F2FF] last:border-0">
                            <span className="font-medium">{p.nome}</span>
                            {p.cpf && <span className="text-[#9CA3AF] ml-2">CPF: {p.cpf}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {cpfBusca.replace(/\D/g, '').length >= 3 && !buscando && resultadoBusca.length === 0 && (
                      <p className="text-[11px] text-[#9CA3AF] mt-1">
                        Nenhum paciente encontrado.{' '}
                        <button type="button" className="text-primary underline" onClick={() => setModoPaciente('novo')}>Cadastrar novo?</button>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-lg p-3 space-y-2 bg-[#FAFAFA]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">Nome *</label>
                        <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
                          placeholder="Nome completo"
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">CPF</label>
                        <input value={novoCpf} onChange={e => setNovoCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#444654] mb-1">Telefone *</label>
                      <input value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                      />
                    </div>
                    {erroPaciente && <p className="text-[11px] text-red-600">{erroPaciente}</p>}
                    <button type="button" onClick={cadastrarNovoPaciente} disabled={cadastrandoPaciente}
                      className="w-full py-1.5 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                      {cadastrandoPaciente ? 'Cadastrando...' : 'Cadastrar e selecionar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Profissional */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Profissional</label>
                <select
                  required
                  value={form.profissional_id}
                  onChange={e => setForm(f => ({ ...f, profissional_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  <option value="">Selecione um profissional</option>
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — {p.especialidade}</option>
                  ))}
                </select>
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Procedimento / Serviço</label>
                <select
                  required
                  value={form.servico_id}
                  onChange={e => setForm(f => ({ ...f, servico_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  <option value="">Selecione o serviço</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} — {s.duracao_minutos}min</option>
                  ))}
                </select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Horário</label>
                  <input
                    type="time"
                    required
                    value={form.hora}
                    onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Alguma observação relevante?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
