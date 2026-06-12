'use client'

import { useState } from 'react'
import { Plus, Search, X, ClipboardList, CheckCircle2, Clock, Power, Pencil, Trash2, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  preco: number
  ativo: boolean
  popular: boolean
}

interface Profissional {
  id: string
  nome: string
  especialidade: string | null
}

interface Vinculo {
  profissional_id: string
  servico_id: string
}

interface Props {
  servicos: Servico[]
  profissionais: Profissional[]
  vinculos: Vinculo[]
  clinicaId: string
}

const FORM_VAZIO = { nome: '', descricao: '', duracao_minutos: 30, preco: 0 }

function montarVinculosMap(vinculos: Vinculo[]) {
  const mapa: Record<string, string[]> = {}
  for (const v of vinculos) {
    if (!mapa[v.servico_id]) mapa[v.servico_id] = []
    mapa[v.servico_id].push(v.profissional_id)
  }
  return mapa
}

export function ServicosClient({ servicos: inicial, profissionais, vinculos }: Props) {
  const [lista, setLista] = useState(inicial)
  const [vinculosMap, setVinculosMap] = useState(() => montarVinculosMap(vinculos))
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const stats = {
    total: lista.length,
    ativos: lista.filter(s => s.ativo).length,
  }

  const filtrados = lista.filter(s =>
    !busca || s.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function abrirModalNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setProfissionaisSelecionados([])
    setErro(null)
    setModal(true)
  }

  function abrirModalEditar(s: Servico) {
    setEditando(s)
    setForm({ nome: s.nome, descricao: s.descricao ?? '', duracao_minutos: s.duracao_minutos, preco: s.preco })
    setProfissionaisSelecionados(vinculosMap[s.id] ?? [])
    setErro(null)
    setModal(true)
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleProfissional(id: string) {
    setProfissionaisSelecionados(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setErro(null); setSalvando(true)

    let servicoId: string

    if (editando) {
      const res = await fetch(`/api/servicos/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profissionalIds: profissionaisSelecionados }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao salvar.'); setSalvando(false); return }
      servicoId = editando.id
      setLista(prev => prev.map(s => s.id === editando.id ? json : s).sort((a, b) => a.nome.localeCompare(b.nome)))
    } else {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profissionalIds: profissionaisSelecionados }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao cadastrar.'); setSalvando(false); return }
      servicoId = (json as Servico).id
      setLista(prev => [...prev, json as Servico].sort((a, b) => a.nome.localeCompare(b.nome)))
    }

    setVinculosMap(prev => ({ ...prev, [servicoId]: profissionaisSelecionados }))
    setSalvando(false)
    setModal(false)
  }

  async function alternarAtivo(s: Servico) {
    const res = await fetch(`/api/servicos/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !s.ativo }),
    })
    if (res.ok) {
      const json = await res.json()
      setLista(prev => prev.map(item => item.id === s.id ? json : item))
    }
  }

  async function excluir(s: Servico) {
    if (!confirm(`Excluir o serviço "${s.nome}"?`)) return
    const res = await fetch(`/api/servicos/${s.id}`, { method: 'DELETE' })
    if (res.ok) {
      setLista(prev => prev.filter(item => item.id !== s.id))
    } else {
      const json = await res.json()
      alert(json.error ?? 'Erro ao excluir.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Serviços e Procedimentos</h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Cadastre os serviços oferecidos pela clínica e vincule-os aos profissionais.
          </p>
        </div>
        <button
          onClick={abrirModalNovo}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0F2FF] rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-[#1A1A2E]">{stats.total}</p>
            <p className="text-[12px] text-[#9CA3AF] uppercase font-medium">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0F2FF] rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-[#1A1A2E]">{stats.ativos}</p>
            <p className="text-[12px] text-[#9CA3AF] uppercase font-medium">Ativos</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar serviço..."
          className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 bg-[#F0F2FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-primary" />
              </div>
              <span className={s.ativo ? 'badge-success' : 'badge-neutral'}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
            <h3 className="text-[14px] font-semibold text-[#1A1A2E]">{s.nome}</h3>
            {s.descricao && <p className="text-[12px] text-[#9CA3AF] line-clamp-2 mt-0.5">{s.descricao}</p>}
            <div className="flex items-center gap-3 mt-3 text-[12px] text-[#444654]">
              <span className="flex items-center gap-1"><Clock size={12} /> {s.duracao_minutos}min</span>
              <span className="font-semibold text-primary">{formatCurrency(s.preco)}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#F0F2FF]">
              <button onClick={() => abrirModalEditar(s)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] font-medium text-[#444654] border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                <Pencil size={12} /> Editar
              </button>
              <button onClick={() => alternarAtivo(s)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] font-medium text-[#444654] border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                <Power size={12} /> {s.ativo ? 'Inativar' : 'Ativar'}
              </button>
              <button onClick={() => excluir(s)}
                className="flex items-center justify-center py-1.5 px-2 text-red-500 border border-[#E5E7EB] rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#9CA3AF]">Nenhum serviço cadastrado</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">{editando ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setModal(false)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Nome *</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)}
                  placeholder="Ex: Consulta de Rotina"
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  rows={2}
                  placeholder="Detalhes do procedimento (opcional)"
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Duração (min)</label>
                  <input type="number" min={5} step={5} value={form.duracao_minutos}
                    onChange={e => set('duracao_minutos', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Preço (R$)</label>
                  <input type="number" min={0} step={0.01} value={form.preco}
                    onChange={e => set('preco', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Profissionais vinculados</label>
                <p className="text-[11px] text-[#9CA3AF] mb-2">
                  Selecione quem realiza este serviço. Se nenhum for selecionado, ficará disponível para todos os profissionais.
                </p>
                {profissionais.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF] italic">Nenhum profissional cadastrado na clínica.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profissionais.map(p => {
                      const sel = profissionaisSelecionados.includes(p.id)
                      return (
                        <button
                          key={p.id} type="button" onClick={() => toggleProfissional(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                            sel ? 'bg-primary text-white border-primary' : 'bg-white text-[#444654] border-[#E5E7EB] hover:border-primary hover:text-primary'
                          }`}
                        >
                          {sel && <Check size={11} />}{p.nome}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                  {erro}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[#F0F2FF]">
              <button onClick={() => setModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
