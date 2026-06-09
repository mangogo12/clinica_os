'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'
import { formatDate, formatPhone } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  alta: 'Alta',
  em_tratamento: 'Em Tratamento',
  aguardando: 'Aguardando',
}
const BADGE_LABELS: Record<string, string> = {
  ativo: 'badge-success',
  em_tratamento: 'badge-warning',
  aguardando: 'badge-neutral',
  alta: 'badge-info',
  inativo: 'badge-neutral',
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

export function ClientesClient({ pacientes }: Props) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFonte, setFiltroFonte] = useState('')
  const [pagina, setPagina] = useState(1)

  const filtrados = pacientes.filter(p => {
    const matchBusca = !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.cpf ?? '').includes(busca) ||
      (p.email ?? '').toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || p.status === filtroStatus
    const matchFonte = !filtroFonte || p.fonte === filtroFonte
    return matchBusca && matchStatus && matchFonte
  })

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Lista de Clientes</h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Gerencie o prontuário e histórico de seus <strong>{pacientes.length.toLocaleString('pt-BR')}</strong> pacientes.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Novo Cliente
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
              placeholder="Buscar por nome, CPF ou prontuário..."
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={e => { setFiltroStatus(e.target.value); setPagina(1) }}
            className="px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white text-[#444654]"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select
            value={filtroFonte}
            onChange={e => { setFiltroFonte(e.target.value); setPagina(1) }}
            className="px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white text-[#444654]"
          >
            <option value="">Todas as Fontes</option>
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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0">
                        {p.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-primary">{p.nome}</p>
                        <p className="text-[11px] text-[#9CA3AF]">CPF: {p.cpf ?? '—'}</p>
                      </div>
                    </div>
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
                    <button className="text-[#9CA3AF] hover:text-[#444654] p-1">
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
    </div>
  )
}
