'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Search, UserPlus, Trash2 } from 'lucide-react'
import { statusAgendamentoLabel, formatTime, formatPhone } from '@/lib/utils'

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

type Visualizacao = 'semana' | 'mes' | 'dia'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getPeriodo(ref: Date, vis: Visualizacao) {
  if (vis === 'dia') {
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0)
    const fim = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999)
    return { inicio, fim }
  }
  if (vis === 'mes') {
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0)
    const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999)
    return { inicio, fim }
  }
  const inicio = new Date(ref)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 6)
  fim.setHours(23, 59, 59, 999)
  return { inicio, fim }
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
  profissionaisServicos: { profissional_id: string; servico_id: string }[]
  clinicaId: string
}

type PacienteEncontrado = { id: string; nome: string; cpf?: string | null; telefone?: string }
type Slot = { hora: string; disponivel: boolean }

export function AgendaClient({ agendamentos: agendamentosIniciais, profissionais, servicos, profissionaisServicos }: Props) {
  const [agendamentos, setAgendamentos] = useState<AgItem[]>(agendamentosIniciais)
  const [carregandoAgenda, setCarregandoAgenda] = useState(false)
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('semana')
  const [dataRef, setDataRef] = useState(() => new Date())

  // Filtros
  const [filtroProfissional, setFiltroProfissional] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('')

  // Detalhes / edição de agendamento
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgItem | null>(null)
  const [editForm, setEditForm] = useState({ status: '', data: '', hora: '', profissional_id: '', servico_id: '', observacoes: '' })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

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
  const [novoCep, setNovoCep] = useState('')
  const [novoLogradouro, setNovoLogradouro] = useState('')
  const [novoNumero, setNovoNumero] = useState('')
  const [novoComplemento, setNovoComplemento] = useState('')
  const [novoBairro, setNovoBairro] = useState('')
  const [novoCidade, setNovoCidade] = useState('')
  const [novoEstado, setNovoEstado] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [cadastrandoPaciente, setCadastrandoPaciente] = useState(false)
  const [erroPaciente, setErroPaciente] = useState<string | null>(null)

  const [form, setForm] = useState({
    paciente_id: '',
    profissional_id: '',
    servico_id: '',
    data: new Date().toISOString().split('T')[0],
    hora: '',
    observacoes: '',
  })

  const [slots, setSlots] = useState<Slot[]>([])
  const [diaIndisponivel, setDiaIndisponivel] = useState(false)
  const [carregandoSlots, setCarregandoSlots] = useState(false)
  const [erroAgendamento, setErroAgendamento] = useState<string | null>(null)

  // Serviços que o profissional selecionado realiza (todos, se nenhum vínculo configurado)
  const servicosDoProfissional = profissionaisServicos
    .filter(ps => ps.profissional_id === form.profissional_id)
    .map(ps => ps.servico_id)
  const servicosFiltrados = (form.profissional_id && servicosDoProfissional.length > 0)
    ? servicos.filter(s => servicosDoProfissional.includes(s.id))
    : servicos

  // Buscar horários disponíveis quando profissional/data/serviço mudam
  useEffect(() => {
    if (!form.profissional_id || !form.data) {
      setSlots([]); setDiaIndisponivel(false)
      return
    }
    let cancelado = false
    setCarregandoSlots(true)
    const params = new URLSearchParams({ profissional_id: form.profissional_id, data: form.data })
    if (form.servico_id) params.set('servico_id', form.servico_id)

    fetch(`/api/agenda/disponibilidade?${params.toString()}`)
      .then(res => res.json())
      .then((json: { slots?: Slot[]; diaIndisponivel?: boolean }) => {
        if (cancelado) return
        setSlots(json.slots ?? [])
        setDiaIndisponivel(!!json.diaIndisponivel)
      })
      .finally(() => { if (!cancelado) setCarregandoSlots(false) })

    return () => { cancelado = true }
  }, [form.profissional_id, form.data, form.servico_id])

  // Ajusta o horário selecionado quando a lista de slots muda
  useEffect(() => {
    if (slots.length === 0) {
      if (form.hora !== '') setForm(f => ({ ...f, hora: '' }))
      return
    }
    const atualOk = slots.some(s => s.hora === form.hora && s.disponivel)
    if (!atualOk) {
      const primeiroDisponivel = slots.find(s => s.disponivel)
      setForm(f => ({ ...f, hora: primeiroDisponivel?.hora ?? '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  // Reseta o serviço selecionado se ele não pertencer ao profissional escolhido
  useEffect(() => {
    if (form.servico_id && !servicosFiltrados.some(s => s.id === form.servico_id)) {
      setForm(f => ({ ...f, servico_id: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.profissional_id])

  // Busca os agendamentos do período visível (semana, mês ou dia)
  useEffect(() => {
    const { inicio, fim } = getPeriodo(dataRef, visualizacao)
    let rangeInicio = inicio
    let rangeFim = fim
    if (visualizacao === 'mes') {
      rangeInicio = new Date(inicio)
      rangeInicio.setDate(rangeInicio.getDate() - rangeInicio.getDay())
      rangeFim = new Date(fim)
      rangeFim.setDate(rangeFim.getDate() + (6 - rangeFim.getDay()))
      rangeFim.setHours(23, 59, 59, 999)
    }

    let cancelado = false
    setCarregandoAgenda(true)
    const params = new URLSearchParams({ inicio: rangeInicio.toISOString(), fim: rangeFim.toISOString() })

    fetch(`/api/agenda?${params.toString()}`)
      .then(res => res.json())
      .then((data: AgItem[]) => { if (!cancelado) setAgendamentos(Array.isArray(data) ? data : []) })
      .finally(() => { if (!cancelado) setCarregandoAgenda(false) })

    return () => { cancelado = true }
  }, [visualizacao, dataRef])

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

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setNovoLogradouro(data.logradouro ?? '')
        setNovoBairro(data.bairro ?? '')
        setNovoCidade(data.localidade ?? '')
        setNovoEstado(data.uf ?? '')
      }
    } finally {
      setBuscandoCep(false)
    }
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
      body: JSON.stringify({
        nome: novoNome,
        cpf: novoCpf || null,
        telefone: novoTelefone,
        cep: novoCep || null,
        logradouro: novoLogradouro || null,
        numero: novoNumero || null,
        complemento: novoComplemento || null,
        bairro: novoBairro || null,
        cidade: novoCidade || null,
        estado: novoEstado || null,
      }),
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
    setNovoCep(''); setNovoLogradouro(''); setNovoNumero(''); setNovoComplemento('')
    setNovoBairro(''); setNovoCidade(''); setNovoEstado('')
    setCadastrandoPaciente(false)
  }

  function abrirModal() {
    setPacienteSelecionado(null)
    setForm(f => ({ ...f, paciente_id: '' }))
    setCpfBusca(''); setResultadoBusca([])
    setModoPaciente('buscar')
    setErroAgendamento(null)
    setModalAberto(true)
  }

  // Dias visíveis na visão semanal
  const diasDaSemana = (() => {
    const { inicio } = getPeriodo(dataRef, 'semana')
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      return d
    })
  })()

  // Dias visíveis na grade da visão mensal (inclui dias de meses adjacentes para completar as semanas)
  const diasDoMes = (() => {
    const { inicio, fim } = getPeriodo(dataRef, 'mes')
    const inicioGrid = new Date(inicio)
    inicioGrid.setDate(inicioGrid.getDate() - inicioGrid.getDay())
    const fimGrid = new Date(fim)
    fimGrid.setDate(fimGrid.getDate() + (6 - fimGrid.getDay()))
    const dias: Date[] = []
    const cursor = new Date(inicioGrid)
    while (cursor <= fimGrid) {
      dias.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return dias
  })()

  // Título do período exibido
  const tituloPeriodo = (() => {
    if (visualizacao === 'dia') {
      return capitalize(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(dataRef))
    }
    if (visualizacao === 'mes') {
      return capitalize(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(dataRef))
    }
    const { inicio, fim } = getPeriodo(dataRef, 'semana')
    const dia = (d: Date) => d.getDate().toString().padStart(2, '0')
    if (inicio.getMonth() === fim.getMonth()) {
      const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(inicio)
      return `${dia(inicio)} – ${dia(fim)} de ${mes}`
    }
    const mesInicio = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(inicio).replace('.', '')
    const mesFim = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(fim).replace('.', '')
    return `${dia(inicio)} ${mesInicio} – ${dia(fim)} ${mesFim}`
  })()

  function navegar(direcao: -1 | 1) {
    setDataRef(d => {
      const novo = new Date(d)
      if (visualizacao === 'dia') novo.setDate(novo.getDate() + direcao)
      else if (visualizacao === 'semana') novo.setDate(novo.getDate() + direcao * 7)
      else novo.setMonth(novo.getMonth() + direcao)
      return novo
    })
  }

  function irParaHoje() {
    setDataRef(new Date())
  }

  // Agendamentos filtrados pela barra de busca/filtros
  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (filtroProfissional && ag.profissional?.id !== filtroProfissional) return false
    if (filtroStatus && ag.status !== filtroStatus) return false
    if (filtroPaciente && !(ag.paciente?.nome ?? '').toLowerCase().includes(filtroPaciente.toLowerCase())) return false
    return true
  })

  function agendamentosNoDia(dia: Date, hora?: string) {
    return agendamentosFiltrados.filter(ag => {
      const inicio = new Date(ag.data_hora_inicio)
      const mesmoDia = inicio.getFullYear() === dia.getFullYear()
        && inicio.getMonth() === dia.getMonth()
        && inicio.getDate() === dia.getDate()
      if (!mesmoDia) return false
      if (hora === undefined) return true
      const horaSlot = `${inicio.getHours().toString().padStart(2, '0')}:00`
      return horaSlot === hora
    })
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault()

    if (diaIndisponivel) {
      setErroAgendamento('Este profissional não atende neste dia da semana.')
      return
    }
    const slotEscolhido = slots.find(s => s.hora === form.hora)
    if (!slotEscolhido || !slotEscolhido.disponivel) {
      setErroAgendamento('Selecione um horário disponível.')
      return
    }

    setErroAgendamento(null)
    setSalvando(true)
    const servico = servicos.find(s => s.id === form.servico_id)
    const duracao = servico?.duracao_minutos ?? 30
    const inicio = new Date(`${form.data}T${form.hora}:00`)
    const fim = new Date(inicio.getTime() + duracao * 60000)

    const res = await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paciente_id: form.paciente_id,
        profissional_id: form.profissional_id,
        servico_id: form.servico_id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        observacoes: form.observacoes || null,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErroAgendamento(json.error ?? 'Erro ao salvar o agendamento.')
      setSalvando(false)
      return
    }

    const novo: AgItem = await res.json()
    setAgendamentos(prev => [...prev, novo])
    setModalAberto(false)
    setSalvando(false)
  }

  // Detalhes / edição de um agendamento existente
  const servicosDoProfissionalEdit = profissionaisServicos
    .filter(ps => ps.profissional_id === editForm.profissional_id)
    .map(ps => ps.servico_id)
  const servicosFiltradosEdit = (editForm.profissional_id && servicosDoProfissionalEdit.length > 0)
    ? servicos.filter(s => servicosDoProfissionalEdit.includes(s.id))
    : servicos

  function abrirDetalhe(ag: AgItem) {
    const inicio = new Date(ag.data_hora_inicio)
    const pad = (n: number) => n.toString().padStart(2, '0')
    setAgendamentoSelecionado(ag)
    setEditForm({
      status: ag.status,
      data: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`,
      hora: `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`,
      profissional_id: ag.profissional?.id ?? '',
      servico_id: ag.servico?.id ?? '',
      observacoes: ag.observacoes ?? '',
    })
    setErroEdicao(null)
  }

  async function salvarEdicaoAgendamento() {
    if (!agendamentoSelecionado) return
    setSalvandoEdicao(true)
    setErroEdicao(null)

    const servico = servicos.find(s => s.id === editForm.servico_id) ?? agendamentoSelecionado.servico
    const duracao = servico?.duracao_minutos ?? 30
    const inicio = new Date(`${editForm.data}T${editForm.hora}:00`)
    const fim = new Date(inicio.getTime() + duracao * 60000)

    const res = await fetch(`/api/agenda/${agendamentoSelecionado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editForm.status,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        profissional_id: editForm.profissional_id,
        servico_id: editForm.servico_id,
        observacoes: editForm.observacoes || null,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErroEdicao(json.error ?? 'Erro ao salvar as alterações.')
      setSalvandoEdicao(false)
      return
    }

    const atualizado: AgItem = await res.json()
    setAgendamentos(prev => prev.map(a => a.id === atualizado.id ? atualizado : a))
    setSalvandoEdicao(false)
    setAgendamentoSelecionado(null)
  }

  async function excluirAgendamento() {
    if (!agendamentoSelecionado) return
    if (!confirm('Excluir este agendamento? Esta ação não pode ser desfeita.')) return

    setExcluindo(true)
    setErroEdicao(null)
    const res = await fetch(`/api/agenda/${agendamentoSelecionado.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErroEdicao(json.error ?? 'Erro ao excluir o agendamento.')
      setExcluindo(false)
      return
    }

    const idExcluido = agendamentoSelecionado.id
    setAgendamentos(prev => prev.filter(a => a.id !== idExcluido))
    setExcluindo(false)
    setAgendamentoSelecionado(null)
  }

  const algumFiltroAtivo = !!(filtroProfissional || filtroStatus || filtroPaciente)

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
            <button
              onClick={() => setVisualizacao('semana')}
              className={`px-3 py-1 text-[12px] rounded-md font-medium transition-colors ${visualizacao === 'semana' ? 'bg-primary text-white' : 'text-[#444654] hover:bg-[#F0F2FF]'}`}
            >
              Sem
            </button>
            <button
              onClick={() => setVisualizacao('mes')}
              className={`px-3 py-1 text-[12px] rounded-md font-medium transition-colors ${visualizacao === 'mes' ? 'bg-primary text-white' : 'text-[#444654] hover:bg-[#F0F2FF]'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setVisualizacao('dia')}
              className={`px-3 py-1 text-[12px] rounded-md font-medium transition-colors ${visualizacao === 'dia' ? 'bg-primary text-white' : 'text-[#444654] hover:bg-[#F0F2FF]'}`}
            >
              Dia
            </button>
          </div>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Navegação de período + filtros */}
      <div className="bg-white rounded-2xl shadow-card p-3 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} className="text-[#9CA3AF] hover:text-[#444654] p-1.5 rounded-md hover:bg-[#F0F2FF]">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navegar(1)} className="text-[#9CA3AF] hover:text-[#444654] p-1.5 rounded-md hover:bg-[#F0F2FF]">
            <ChevronRight size={16} />
          </button>
          <button onClick={irParaHoje} className="px-2.5 py-1 text-[12px] font-medium text-[#444654] border border-[#E5E7EB] rounded-md hover:bg-[#F0F2FF]">
            Hoje
          </button>
        </div>

        <p className="text-[14px] font-semibold text-[#1A1A2E] flex-1 min-w-[160px]">
          {tituloPeriodo}
          {carregandoAgenda && <span className="text-[11px] font-normal text-[#9CA3AF] ml-2">Carregando...</span>}
        </p>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={filtroPaciente}
            onChange={e => setFiltroPaciente(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E7EB] rounded-md outline-none focus:border-primary w-44"
          />
        </div>

        <select
          value={filtroProfissional}
          onChange={e => setFiltroProfissional(e.target.value)}
          className="px-2.5 py-1.5 text-[12px] border border-[#E5E7EB] rounded-md outline-none focus:border-primary bg-white text-[#444654]"
        >
          <option value="">Todos os profissionais</option>
          {profissionais.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="px-2.5 py-1.5 text-[12px] border border-[#E5E7EB] rounded-md outline-none focus:border-primary bg-white text-[#444654]"
        >
          <option value="">Todos os status</option>
          {Object.keys(STATUS_CORES).map(s => (
            <option key={s} value={s}>{statusAgendamentoLabel(s)}</option>
          ))}
        </select>

        {algumFiltroAtivo && (
          <button
            onClick={() => { setFiltroProfissional(''); setFiltroStatus(''); setFiltroPaciente('') }}
            className="px-2.5 py-1.5 text-[12px] font-medium text-primary hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {visualizacao === 'semana' && (
          <>
            {/* Header da semana */}
            <div className="flex items-center border-b border-[#F0F2FF]">
              <div className="w-16 flex-shrink-0 p-3" />
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
                            onClick={() => abrirDetalhe(ag)}
                            className={`rounded border-l-2 px-2 py-1 mb-1 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_CORES[ag.status] ?? 'bg-gray-100 border-gray-400'}`}
                          >
                            <p className="text-[10px] font-bold">{formatTime(ag.data_hora_inicio)}</p>
                            <p className="text-[11px] font-semibold truncate">{ag.paciente?.nome}</p>
                            <p className="text-[10px] truncate opacity-75">{ag.profissional?.nome}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {visualizacao === 'dia' && (
          <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
            {HORAS.map(hora => {
              const ags = agendamentosNoDia(dataRef, hora)
              return (
                <div key={hora} className="flex border-b border-[#F0F2FF] min-h-[64px]">
                  <div className="w-16 flex-shrink-0 px-3 py-2 text-[11px] text-[#9CA3AF]">{hora}</div>
                  <div className="flex-1 border-l border-[#F0F2FF] p-2 space-y-1.5">
                    {ags.map(ag => (
                      <div
                        key={ag.id}
                        onClick={() => abrirDetalhe(ag)}
                        className={`rounded border-l-2 px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_CORES[ag.status] ?? 'bg-gray-100 border-gray-400'}`}
                      >
                        <p className="text-[12px] font-bold">{formatTime(ag.data_hora_inicio)} — {ag.paciente?.nome}</p>
                        <p className="text-[11px] opacity-75">{ag.profissional?.nome} · {ag.servico?.nome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {visualizacao === 'mes' && (
          <div>
            <div className="grid grid-cols-7 border-b border-[#F0F2FF]">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="p-2 text-center text-[11px] font-medium text-[#9CA3AF]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {diasDoMes.map((dia, i) => {
                const isHoje = dia.toDateString() === new Date().toDateString()
                const foraDoMes = dia.getMonth() !== dataRef.getMonth()
                const ags = agendamentosNoDia(dia)
                return (
                  <div
                    key={i}
                    onClick={() => { setDataRef(dia); setVisualizacao('dia') }}
                    className={`min-h-[100px] border-r border-b border-[#F0F2FF] p-1.5 cursor-pointer hover:bg-[#FAFAFA] transition-colors ${foraDoMes ? 'bg-[#FAFAFA]' : ''}`}
                  >
                    <p className={`text-[12px] font-semibold mb-1 ${isHoje ? 'text-primary' : foraDoMes ? 'text-[#D1D5DB]' : 'text-[#1A1A2E]'}`}>
                      {dia.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {ags.slice(0, 3).map(ag => (
                        <div
                          key={ag.id}
                          onClick={e => { e.stopPropagation(); abrirDetalhe(ag) }}
                          className={`rounded px-1.5 py-0.5 text-[10px] truncate border-l-2 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_CORES[ag.status] ?? 'bg-gray-100 border-gray-400'}`}
                        >
                          {formatTime(ag.data_hora_inicio)} {ag.paciente?.nome}
                        </div>
                      ))}
                      {ags.length > 3 && (
                        <p className="text-[10px] text-[#9CA3AF] px-1.5">+{ags.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                    <div>
                      <label className="block text-[11px] font-medium text-[#444654] mb-1">CEP</label>
                      <div className="relative">
                        <input value={novoCep}
                          onChange={e => { setNovoCep(e.target.value); buscarCep(e.target.value) }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                        {buscandoCep && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">buscando...</span>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#444654] mb-1">Logradouro</label>
                      <input value={novoLogradouro} onChange={e => setNovoLogradouro(e.target.value)}
                        placeholder="Rua, Av., Alameda..."
                        className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">Número</label>
                        <input value={novoNumero} onChange={e => setNovoNumero(e.target.value)}
                          placeholder="123"
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">Complemento</label>
                        <input value={novoComplemento} onChange={e => setNovoComplemento(e.target.value)}
                          placeholder="Apto, Bloco..."
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">Bairro</label>
                        <input value={novoBairro} onChange={e => setNovoBairro(e.target.value)}
                          placeholder="Bairro"
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">Cidade</label>
                        <input value={novoCidade} onChange={e => setNovoCidade(e.target.value)}
                          placeholder="Cidade"
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#444654] mb-1">UF</label>
                        <input value={novoEstado} onChange={e => setNovoEstado(e.target.value)}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary placeholder:text-[#9CA3AF] bg-white"
                        />
                      </div>
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
                  onChange={e => setForm(f => ({ ...f, profissional_id: e.target.value, hora: '' }))}
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
                  disabled={!form.profissional_id}
                  value={form.servico_id}
                  onChange={e => setForm(f => ({ ...f, servico_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                >
                  <option value="">{form.profissional_id ? 'Selecione o serviço' : 'Selecione um profissional primeiro'}</option>
                  {servicosFiltrados.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} — {s.duracao_minutos}min</option>
                  ))}
                </select>
                {form.profissional_id && servicosFiltrados.length === 0 && (
                  <p className="text-[11px] text-red-600 mt-1">Este profissional não possui serviços disponíveis.</p>
                )}
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value, hora: '' }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Horário</label>
                  <select
                    required
                    disabled={!form.profissional_id || diaIndisponivel || carregandoSlots}
                    value={form.hora}
                    onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                  >
                    {!form.profissional_id && <option value="">Selecione um profissional</option>}
                    {form.profissional_id && carregandoSlots && <option value="">Carregando horários...</option>}
                    {form.profissional_id && !carregandoSlots && diaIndisponivel && <option value="">Profissional não atende neste dia</option>}
                    {form.profissional_id && !carregandoSlots && !diaIndisponivel && slots.length === 0 && <option value="">Nenhum horário disponível</option>}
                    {form.profissional_id && !carregandoSlots && !diaIndisponivel && slots.map(s => (
                      <option key={s.hora} value={s.hora} disabled={!s.disponivel}>
                        {s.hora}{!s.disponivel ? ' (indisponível)' : ''}
                      </option>
                    ))}
                  </select>
                  {form.profissional_id && !carregandoSlots && diaIndisponivel && (
                    <p className="text-[11px] text-red-600 mt-1">Este profissional não atende neste dia da semana.</p>
                  )}
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

              {erroAgendamento && (
                <p className="text-[12px] text-red-600">{erroAgendamento}</p>
              )}

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
                  disabled={salvando || diaIndisponivel || !form.hora}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Agendamento */}
      {agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">Detalhes do Agendamento</h2>
              <button onClick={() => setAgendamentoSelecionado(null)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Paciente */}
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-3 py-2">
                <p className="text-[13px] font-semibold text-[#1A1A2E]">{agendamentoSelecionado.paciente?.nome}</p>
                {agendamentoSelecionado.paciente?.telefone && (
                  <p className="text-[11px] text-[#9CA3AF]">{formatPhone(agendamentoSelecionado.paciente.telefone)}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  {Object.keys(STATUS_CORES).map(s => (
                    <option key={s} value={s}>{statusAgendamentoLabel(s)}</option>
                  ))}
                </select>
              </div>

              {/* Profissional */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Profissional</label>
                <select
                  value={editForm.profissional_id}
                  onChange={e => setEditForm(f => ({ ...f, profissional_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — {p.especialidade}</option>
                  ))}
                </select>
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Procedimento / Serviço</label>
                <select
                  value={editForm.servico_id}
                  onChange={e => setEditForm(f => ({ ...f, servico_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  {servicosFiltradosEdit.map(s => (
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
                    value={editForm.data}
                    onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Horário</label>
                  <input
                    type="time"
                    value={editForm.hora}
                    onChange={e => setEditForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Observações</label>
                <textarea
                  value={editForm.observacoes}
                  onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Alguma observação relevante?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary resize-none"
                />
              </div>

              {erroEdicao && (
                <p className="text-[12px] text-red-600">{erroEdicao}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={excluirAgendamento}
                  disabled={excluindo || salvandoEdicao}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Trash2 size={14} /> {excluindo ? 'Excluindo...' : 'Excluir'}
                </button>
                <button
                  type="button"
                  onClick={() => setAgendamentoSelecionado(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarEdicaoAgendamento}
                  disabled={salvandoEdicao || excluindo}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
