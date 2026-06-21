'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Download, Plus, TrendingDown, TrendingUp, Wallet, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

function buildChartData(transacoes: Transacao[]) {
  if (transacoes.length === 0) return []
  const byWeek = new Map<string, { receitas: number; despesas: number }>()
  for (const t of transacoes) {
    const d = new Date(t.data_transacao)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const entry = byWeek.get(label) ?? { receitas: 0, despesas: 0 }
    if (t.tipo === 'entrada') entry.receitas += t.valor
    else entry.despesas += t.valor
    byWeek.set(label, entry)
  }
  return Array.from(byWeek.entries()).map(([data, v]) => ({ data, ...v }))
}

const STATUS_BADGE: Record<string, string> = {
  confirmado: 'badge-success',
  pendente: 'badge-neutral',
  cancelado: 'badge-danger',
  pago: 'badge-success',
  processando: 'badge-warning',
}
const STATUS_LABEL: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
  pago: 'Pago',
  processando: 'Processando',
}

export interface Transacao {
  id: string
  tipo: string
  descricao: string
  valor: number
  categoria: string
  status: string
  data_transacao: string
  paciente: { id: string; nome: string } | null
}

interface Conta {
  id: string
  descricao: string
  valor: number
  vencimento: string
  pago: boolean
}

interface Props {
  transacoes: Transacao[]
  contas: Conta[]
  kpis: { entradas: number; saidas: number }
}

export function FinanceiroClient({ transacoes, contas, kpis }: Props) {
  const [periodo, setPeriodo] = useState('30d')
  const saldo = kpis.entradas - kpis.saidas
  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').length
  const ticketMedio = totalEntradas > 0 ? kpis.entradas / totalEntradas : 0
  const chartData = buildChartData(transacoes)

  const saldoStatus = saldo > 0 ? 'Positivo' : saldo < 0 ? 'Negativo' : '—'

  const kpiCards = [
    {
      label: 'Entradas',
      value: formatCurrency(kpis.entradas),
      delta: totalEntradas > 0 ? `${totalEntradas} lançamento${totalEntradas > 1 ? 's' : ''}` : '—',
      positive: true,
      icon: <TrendingUp size={18} className="text-green-600" />,
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Saídas',
      value: formatCurrency(kpis.saidas),
      delta: kpis.saidas > 0 ? `${transacoes.filter(t => t.tipo === 'saida').length} lançamento(s)` : '—',
      positive: false,
      icon: <TrendingDown size={18} className="text-red-500" />,
      bg: 'bg-red-50',
      textColor: 'text-red-500',
    },
    {
      label: 'Saldo Total',
      value: formatCurrency(saldo),
      delta: saldoStatus,
      positive: saldo >= 0,
      icon: <Wallet size={18} className="text-blue-600" />,
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(ticketMedio),
      delta: totalEntradas > 0 ? `base: ${totalEntradas}` : '—',
      positive: true,
      icon: <CreditCard size={18} className="text-orange-500" />,
      bg: 'bg-orange-50',
      textColor: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Gestão Financeira</h1>
          <p className="text-[13px] text-[#9CA3AF]">Monitore a saúde <span className="text-primary font-medium">financeira</span> da sua clínica em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#444654]">
            <span>📅</span>
            <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="bg-transparent outline-none text-[13px]">
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
          <button className="flex items-center gap-2 border border-[#E5E7EB] text-[#444654] px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-[#F0F2FF]">
            <Download size={14} /> Exportar CSV
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark">
            <Plus size={14} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
              <span className={`text-[11px] font-semibold ${card.positive ? 'text-green-600' : 'text-red-500'}`}>
                {card.delta}
              </span>
            </div>
            <p className="text-[20px] font-bold text-[#1A1A2E]">{card.value}</p>
            <p className="text-[12px] text-[#9CA3AF] uppercase font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Contas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Fluxo de Caixa */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1A2E]">Fluxo de Caixa</h2>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"/>Receitas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Despesas</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B5BDB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B5BDB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip
                  formatter={(v, n) => [formatCurrency(Number(v ?? 0)), String(n) === 'receitas' ? 'Receitas' : 'Despesas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                />
                <Area type="monotone" dataKey="receitas" stroke="#3B5BDB" strokeWidth={2} fill="url(#gradReceita)" strokeDasharray="0" dot={false} />
                <Area type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={1.5} fill="url(#gradDespesa)" strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-[#9CA3AF]">
              Nenhum dado para exibir no período
            </div>
          )}
        </div>

        {/* Próximos Vencimentos */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-semibold text-[#1A1A2E] mb-4">Próximos Vencimentos</h2>
          <div className="space-y-3">
            {contas.slice(0, 5).map(conta => {
              const venc = new Date(conta.vencimento)
              const hoje = new Date()
              const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
              const urgente = diff <= 3
              return (
                <div key={conta.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#F0F2FF]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${urgente ? 'bg-red-50' : 'bg-blue-50'}`}>
                    💳
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1A1A2E] truncate">{conta.descricao}</p>
                    <p className={`text-[11px] ${urgente ? 'text-red-500 font-semibold' : 'text-[#9CA3AF]'}`}>
                      {diff <= 0 ? 'Vencido' : `Vence em ${diff} dia${diff > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#1A1A2E]">{formatCurrency(conta.valor)}</span>
                </div>
              )
            })}
            {contas.length === 0 && (
              <p className="text-[13px] text-[#9CA3AF] text-center py-6">Nenhuma conta a vencer</p>
            )}
          </div>
          <button className="w-full mt-3 text-[12px] text-primary font-medium hover:underline">
            Ver todas as contas
          </button>
        </div>
      </div>

      {/* Transações */}
      <div className="bg-white rounded-2xl shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
          <h2 className="font-semibold text-[#1A1A2E]">Transações Recentes</h2>
          <button className="text-[13px] text-primary font-medium hover:underline">Ver tudo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F2FF]">
                {['Tipo', 'Descrição', 'Data', 'Status', 'Valor'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transacoes.slice(0, 8).map(t => (
                <tr key={t.id} className="border-b border-[#F0F2FF] last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                      t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {t.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-medium text-[#1A1A2E]">{t.descricao}</p>
                    {t.paciente && <p className="text-[11px] text-[#9CA3AF]">{t.paciente.nome}</p>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#444654]">
                    {formatDate(t.data_transacao)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={STATUS_BADGE[t.status] ?? 'badge-neutral'}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-[13px] font-semibold ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                  </td>
                </tr>
              ))}
              {transacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#9CA3AF]">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {transacoes.length > 0 && (
          <div className="px-5 py-3 text-[12px] text-[#9CA3AF] border-t border-[#F0F2FF]">
            Exibindo {Math.min(8, transacoes.length)} de {transacoes.length} transações
          </div>
        )}
      </div>
    </div>
  )
}
