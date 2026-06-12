'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MoreVertical, X, Trash2 } from 'lucide-react'
import { formatDate, formatPhone, formatCPF, STATUS_AGENDAMENTO_VALUES } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  alta: 'Alta',
  em_tratamento: 'Em Tratamento',
  aguardando: 'Aguardando',
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em Curso',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falta: 'Falta',
}
const BADGE_LABELS: Record<string, string> = {
  ativo: 'badge-success',
  em_tratamento: 'badge-warning',
  aguardando: 'badge-neutral',
  alta: 'badge-info',
  inativo: 'badge-neutral',
  agendado: 'badge-info',
  confirmado: 'badge-success',
  em_atendimento: 'badge-warning',
  concluido: 'badge-success',
  cancelado: 'badge-danger',
  falta: 'badge-warning',
}

const FONTE_LABELS: Record<string, string> = {
  agendamento_publico: 'Público',
  cadastro_manual: 'Manual',
  indicacao: 'Indicação',
  convenio: 'Convênio',
}

export interface Paciente {
  id: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string
  status: string
  fonte: string
  ultima_consulta: string | null
  criado_em: string
  profissional_responsavel: { id: string; nome: string } | null
}

interface Props {
  pacientes: Paciente[]
  clinicaId?: string
}

const PAGE_SIZE = 10

const NOVO_VAZIO = {
  nome: '', cpf: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
}

const EDITAR_VAZIO = { nome: '', cpf: '', telefone: '', email: '', status: '' }

export function PacientesClient({ pacientes: inicial }: Props) {
  const [pacientes, setPacientes] = useState(inicial)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFonte, setFiltroFonte] = useState('')
  const [pagina, setPagina] = useState(1)

  const [modalNovo, setModalNovo] = useState(false)
  const [novoForm, setNovoForm] = useState(NOVO_VAZIO)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [salvandoNovo, setSalvandoNovo] = useState(false)
  const [erroNovo, setErroNovo] = useState<string | null>(null)
  const [avisoNovo, setAvisoNovo] = useState<string | null>(null)

  const [modalEditar, setModalEditar] = useState<Paciente | null>(null)
  const [editForm, setEditForm] = useState(EDITAR_VAZIO)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const buscaDigits = busca.replace(/\D/g, '')

  const filtrados = pacientes.filter(p => {
    const matchBusca = !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.email ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (buscaDigits.length > 0 && (p.cpf ?? '').replace(/\D/g, '').includes(buscaDigits))
    const matchStatus = !filtroStatus || p.status === filtroStatus
    const matchFonte = !filtroFonte || p.fonte === filtroFonte
    return matchBusca && matchStatus && matchFonte
  })

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  function setN<K extends keyof typeof novoForm>(k: K, v: string) {
    setNovoForm(f => ({ ...f, [k]: v }))
  }

  function abrirModalNovo() {
    setNovoForm(NOVO_VAZIO)
    setErroNovo(null)
    setAvisoNovo(null)
    setModalNovo(true)
  }

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setNovoForm(f => ({
          ...f,
          logradouro: data.logradouro ?? '',
          bairro: data.bairro ?? '',
          cidade: data.localidade ?? '',
          estado: data.uf ?? '',
        }))
      }
    } finally {
      setBuscandoCep(false)
    }
  }

  async function cadastrarPaciente() {
    if (!novoForm.nome.trim() || !novoForm.telefone.trim()) {
      setErroNovo('Nome e telefone são obrigatórios.')
      return
    }
    setErroNovo(null); setAvisoNovo(null); setSalvandoNovo(true)

    const res = await fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novoForm.nome,
        cpf: novoForm.cpf || null,
        telefone: novoForm.telefone,
        email: novoForm.email || null,
        cep: novoForm.cep || null,
        logradouro: novoForm.logradouro || null,
        numero: novoForm.numero || null,
        complemento: novoForm.complemento || null,
        bairro: novoForm.bairro || null,
        cidade: novoForm.cidade || null,
        estado: novoForm.estado || null,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setErroNovo(json.error ?? 'Erro ao cadastrar.')
      setSalvandoNovo(false)
      return
    }

    if (json.jaExistia) {
      setAvisoNovo(`Já existe um paciente cadastrado com este CPF: ${json.nome}.`)
      setSalvandoNovo(false)
      return
    }

    setPacientes(prev => [...prev, json as Paciente].sort((a, b) => a.nome.localeCompare(b.nome)))
    setSalvandoNovo(false)
    setModalNovo(false)
  }

  function setE<K extends keyof typeof editForm>(k: K, v: string) {
    setEditForm(f => ({ ...f, [k]: v }))
  }

  function abrirModalEditar(p: Paciente) {
    setEditForm({
      nome: p.nome,
      cpf: p.cpf ?? '',
      telefone: p.telefone,
      email: p.email ?? '',
      status: p.status,
    })
    setErroEdicao(null)
    setModalEditar(p)
  }

  async function salvarEdicaoPaciente() {
    if (!modalEditar) return
    if (!editForm.nome.trim() || !editForm.telefone.trim()) {
      setErroEdicao('Nome e telefone são obrigatórios.')
      return
    }
    setErroEdicao(null)
    setSalvandoEdicao(true)

    const res = await fetch(`/api/pacientes/${modalEditar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: editForm.nome,
        cpf: editForm.cpf || null,
        telefone: editForm.telefone,
        email: editForm.email || null,
        status: editForm.status,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErroEdicao(json.error ?? 'Erro ao salvar as alterações.')
      setSalvandoEdicao(false)
      return
    }

    const atualizado: Paciente = await res.json()
    setPacientes(prev => prev.map(p => p.id === atualizado.id ? atualizado : p).sort((a, b) => a.nome.localeCompare(b.nome)))
    setSalvandoEdicao(false)
    setModalEditar(null)
  }

  async function excluirPaciente(p: Paciente) {
    if (!confirm(`Excluir o paciente "${p.nome}"? Esta ação não pode ser desfeita.`)) return
    setExcluindoId(p.id)

    const res = await fetch(`/api/pacientes/${p.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Erro ao excluir o paciente.')
      setExcluindoId(null)
      return
    }

    setPacientes(prev => prev.filter(x => x.id !== p.id))
    setExcluindoId(null)
    setModalEditar(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Pacientes</h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Gerencie o prontuário e histórico de seus <strong>{pacientes.length.toLocaleString('pt-BR')}</strong> pacientes.
          </p>
        </div>
        <button onClick={abrirModalNovo} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Novo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1) }}
              placeholder="Buscar por nome, CPF ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={e => { setFiltroStatus(e.target.value); setPagina(1) }}
            className="px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white text-[#444654]"
          >
            <option value="">Status</option>
            {STATUS_AGENDAMENTO_VALUES.map(v => <option key={v} value={v}>{STATUS_LABELS[v]}</option>)}
          </select>
          <select
            value={filtroFonte}
            onChange={e => { setFiltroFonte(e.target.value); setPagina(1) }}
            className="px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white text-[#444654]"
          >
            <option value="">Fonte</option>
            {Object.entries(FONTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg text-[#444654] hover:bg-[#F0F2FF]">
            <Filter size={14} /> Filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F2FF]">
                {['Paciente', 'Contato', 'Última Consulta', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginados.map(p => (
                <tr key={p.id} className="border-b border-[#F0F2FF] last:border-0 hover:bg-[#FAFAFA] cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-semibold text-primary">{p.nome}</p>
                    <p className="text-[11px] text-[#9CA3AF]">CPF: {p.cpf ? formatCPF(p.cpf.replace(/\D/g, '')) : '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-[#1A1A2E]">{formatPhone(p.telefone)}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{p.email ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-[#1A1A2E]">
                      {p.ultima_consulta ? formatDate(p.ultima_consulta) : '—'}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {p.profissional_responsavel?.nome ?? '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={BADGE_LABELS[p.status] ?? 'badge-neutral'}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); abrirModalEditar(p) }}
                      className="text-[#9CA3AF] hover:text-[#444654] p-1 rounded hover:bg-[#F0F2FF]"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#9CA3AF]">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F0F2FF]">
          <p className="text-[12px] text-[#9CA3AF]">
            Mostrando {Math.min((pagina - 1) * PAGE_SIZE + 1, filtrados.length)}–{Math.min(pagina * PAGE_SIZE, filtrados.length)} de {filtrados.length} pacientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] text-[#444654] hover:bg-[#F0F2FF] disabled:opacity-40"
            >‹</button>
            {Array.from({ length: Math.min(totalPaginas, 3) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-[13px] font-medium transition-colors ${
                  pagina === n
                    ? 'bg-primary border-primary text-white'
                    : 'border-[#E5E7EB] text-[#444654] hover:bg-[#F0F2FF]'
                }`}
              >{n}</button>
            ))}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas || totalPaginas === 0}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] text-[#444654] hover:bg-[#F0F2FF] disabled:opacity-40"
            >›</button>
          </div>
        </div>
      </div>

      {/* Modal Novo Paciente */}
      {modalNovo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">Novo Paciente</h2>
              <button onClick={() => setModalNovo(false)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Nome *</label>
                  <input value={novoForm.nome} onChange={e => setN('nome', e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">CPF</label>
                  <input value={novoForm.cpf} onChange={e => setN('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Telefone *</label>
                  <input value={novoForm.telefone} onChange={e => setN('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">E-mail</label>
                  <input value={novoForm.email} onChange={e => setN('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">CEP</label>
                <div className="relative">
                  <input value={novoForm.cep}
                    onChange={e => { setN('cep', e.target.value); buscarCep(e.target.value) }}
                    placeholder="00000-000" maxLength={9}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                  {buscandoCep && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">buscando...</span>}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Logradouro</label>
                <input value={novoForm.logradouro} onChange={e => setN('logradouro', e.target.value)}
                  placeholder="Rua, Av., Alameda..."
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Número</label>
                  <input value={novoForm.numero} onChange={e => setN('numero', e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Complemento</label>
                  <input value={novoForm.complemento} onChange={e => setN('complemento', e.target.value)}
                    placeholder="Apto, Bloco..."
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Bairro</label>
                  <input value={novoForm.bairro} onChange={e => setN('bairro', e.target.value)}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Cidade</label>
                  <input value={novoForm.cidade} onChange={e => setN('cidade', e.target.value)}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">UF</label>
                  <input value={novoForm.estado} onChange={e => setN('estado', e.target.value.toUpperCase())}
                    placeholder="SP" maxLength={2}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {erroNovo && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                  {erroNovo}
                </div>
              )}
              {avisoNovo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[13px] text-amber-700">
                  {avisoNovo}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[#F0F2FF]">
              <button onClick={() => setModalNovo(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                Cancelar
              </button>
              <button onClick={cadastrarPaciente} disabled={salvandoNovo}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                {salvandoNovo ? 'Cadastrando...' : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Paciente */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">Editar Paciente</h2>
              <button onClick={() => setModalEditar(null)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Nome *</label>
                  <input value={editForm.nome} onChange={e => setE('nome', e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">CPF</label>
                  <input value={editForm.cpf} onChange={e => setE('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Telefone *</label>
                  <input value={editForm.telefone} onChange={e => setE('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">E-mail</label>
                  <input value={editForm.email} onChange={e => setE('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Status</label>
                <select value={editForm.status} onChange={e => setE('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  {STATUS_AGENDAMENTO_VALUES.map(v => <option key={v} value={v}>{STATUS_LABELS[v]}</option>)}
                </select>
              </div>

              {erroEdicao && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                  {erroEdicao}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[#F0F2FF]">
              <button onClick={() => excluirPaciente(modalEditar)} disabled={excluindoId === modalEditar.id || salvandoEdicao}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60">
                <Trash2 size={14} /> {excluindoId === modalEditar.id ? 'Excluindo...' : 'Excluir'}
              </button>
              <button onClick={() => setModalEditar(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                Cancelar
              </button>
              <button onClick={salvarEdicaoPaciente} disabled={salvandoEdicao || excluindoId === modalEditar.id}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
