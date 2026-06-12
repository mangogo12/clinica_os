'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  LayoutGrid, DollarSign, Calendar, Users, Stethoscope,
  TrendingUp, TrendingDown, Wallet, UserPlus, CheckCircle2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export type Periodo = '7d' | '30d' | '90d' | '12m'

export interface SeriePonto {
  label: string
  receitas: number
  despesas: number
  agendamentos: number
  pacientes: number
}

export interface StatusCount {
  status: string
  label: string
  valor: number
  cor: string
}

export interface BarDatum {
  label: string
  valor: number
}

export interface NomeTotalDatum {
  nome: string
  total: number
}

export interface ProfissionalStat {
  id: string
  nome: string
  especialidade: string
  total: number
  concluidos: number
  cancelados: number
}

export interface DashboardsData {
  periodo: Periodo
  serie: SeriePonto[]
  financeiro: {
    receitas: number
    despesas: number
    porCategoria: BarDatum[]
  }
  agenda: {
    total: number
    porStatus: StatusCount[]
    porProfissional: NomeTotalDatum[]
  }
  pacientes: {
    novos: number
    total: number
    porStatus: StatusCount[]
    porFonte: BarDatum[]
  }
  profissionais: ProfissionalStat[]
}

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: '12m', label: '12 meses' },
]

const CATEGORIAS = [
  { id: 'geral', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'profissionais', label: 'Médicos', icon: Stethoscope },
] as const

type CategoriaId = typeof CATEGORIAS[number]['id']

interface Props {
  data: DashboardsData
}

export function DashboardsClient({ data }: Props) {
  const [categoria, setCategoria] = useState<CategoriaId>('geral')
  const activeIndex = CATEGORIAS.findIndex(c => c.id === categoria)
  const saldo = data.financeiro.receitas - data.financeiro.despesas

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Dashboards</h1>
          <p className="text-[13px] text-[#9CA3AF]">Visualize todos os dados da clínica em diferentes formatos e períodos.</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-card p-1">
          {PERIODOS.map(p => (
            <Link
              key={p.id}
              href={`/dashboards?periodo=${p.id}`}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                data.periodo === p.id ? 'bg-primary text-white' : 'text-[#9CA3AF] hover:text-[#444654]'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Seletor de categoria (mobile) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIAS.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-colors ${
                categoria === cat.id ? 'bg-primary text-white' : 'bg-white text-[#9CA3AF] shadow-card'
              }`}
            >
              <Icon size={14} /> {cat.label}
            </button>
          )
        })}
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {categoria === 'geral' && <SecaoGeral data={data} saldo={saldo} />}
          {categoria === 'financeiro' && <SecaoFinanceiro data={data} saldo={saldo} />}
          {categoria === 'agenda' && <SecaoAgenda data={data} />}
          {categoria === 'pacientes' && <SecaoPacientes data={data} />}
          {categoria === 'profissionais' && <SecaoProfissionais data={data} />}
        </div>

        {/* Seletor vertical de categorias (desktop) */}
        <div className="hidden lg:block w-16 flex-shrink-0 self-stretch">
          <div className="sticky top-6">
            <div className="relative flex flex-col items-end gap-5 py-2 pr-3">
              <div className="absolute right-0 top-2 bottom-2 w-px bg-[#E5E7EB]" />
              {CATEGORIAS.map((cat, i) => {
                const dist = Math.abs(i - activeIndex)
                const isActive = cat.id === categoria
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoria(cat.id)}
                    className="relative flex items-center gap-2 transition-all duration-200"
                    style={{
                      transform: `translateX(${isActive ? -16 : dist === 1 ? -6 : 0}px)`,
                      opacity: dist >= 3 ? 0.35 : 1,
                    }}
                  >
                    {isActive && (
                      <span className="text-[11px] font-semibold text-primary whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-card">
                        {cat.label}
                      </span>
                    )}
                    <span className={`flex items-center justify-center rounded-full border-2 flex-shrink-0 transition-all ${
                      isActive ? 'w-11 h-11 border-primary bg-primary text-white' : 'w-8 h-8 border-[#E5E7EB] bg-white text-[#9CA3AF]'
                    }`}>
                      <Icon size={isActive ? 18 : 14} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componentes auxiliares ──────────────────────────────────────────────

function KpiCard({ label, value, icon, bg }: { label: string; value: string | number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-[20px] font-bold text-[#1A1A2E] leading-none mb-1">{value}</p>
      <p className="text-[12px] text-[#9CA3AF]">{label}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, extra, children }: { title: string; subtitle?: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="font-semibold text-[#1A1A2E]">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#9CA3AF]">{subtitle}</p>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ texto }: { texto: string }) {
  return <p className="text-[13px] text-[#9CA3AF] text-center py-10">{texto}</p>
}

function ReceitaDespesaLegenda() {
  return (
    <div className="flex items-center gap-3 text-[12px] text-[#9CA3AF]">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Receitas</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Despesas</span>
    </div>
  )
}

function ReceitaDespesaChart({ serie }: { serie: SeriePonto[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={serie} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#12B76A" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#12B76A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
          tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          formatter={(v, name) => [formatCurrency(Number(v ?? 0)), name === 'receitas' ? 'Receitas' : 'Despesas']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
        <Area type="monotone" dataKey="receitas" stroke="#12B76A" strokeWidth={2} fill="url(#gradReceitas)" />
        <Area type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={2} fill="url(#gradDespesas)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function SerieAreaChart({ serie, dataKey, label, color }: { serie: SeriePonto[]; dataKey: 'agendamentos' | 'pacientes'; label: string; color: string }) {
  const gradId = `grad-serie-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={serie} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip formatter={v => [v, label]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatusBarChart({ data }: { data: StatusCount[] }) {
  if (data.length === 0 || data.every(d => d.valor === 0)) return <EmptyState texto="Sem dados no período" />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BarDatumChart({ data, color, formatter }: { data: BarDatum[]; color: string; formatter?: (v: number) => string }) {
  if (data.length === 0) return <EmptyState texto="Sem dados no período" />
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
          tickFormatter={v => formatter ? formatter(v) : String(v)} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: '#444654' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={v => formatter ? formatter(Number(v)) : String(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
        <Bar dataKey="valor" fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function NomeTotalChart({ data, color }: { data: NomeTotalDatum[]; color: string }) {
  if (data.length === 0) return <EmptyState texto="Sem dados no período" />
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11, fill: '#444654' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
        <Bar dataKey="total" fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Seções por categoria ─────────────────────────────────────────────────

function SecaoGeral({ data, saldo }: { data: DashboardsData; saldo: number }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas" value={formatCurrency(data.financeiro.receitas)} icon={<TrendingUp size={18} className="text-green-600" />} bg="bg-green-50" />
        <KpiCard label="Despesas" value={formatCurrency(data.financeiro.despesas)} icon={<TrendingDown size={18} className="text-red-500" />} bg="bg-red-50" />
        <KpiCard label="Saldo" value={formatCurrency(saldo)} icon={<Wallet size={18} className="text-primary" />} bg="bg-blue-50" />
        <KpiCard label="Agendamentos" value={data.agenda.total} icon={<Calendar size={18} className="text-purple-600" />} bg="bg-purple-50" />
      </div>
      <ChartCard title="Receitas vs Despesas" subtitle="Evolução no período selecionado" extra={<ReceitaDespesaLegenda />}>
        <ReceitaDespesaChart serie={data.serie} />
      </ChartCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Agendamentos por Status" subtitle="Distribuição no período selecionado">
          <StatusBarChart data={data.agenda.porStatus} />
        </ChartCard>
        <ChartCard title="Novos Pacientes" subtitle="Evolução no período selecionado">
          <SerieAreaChart serie={data.serie} dataKey="pacientes" label="Novos Pacientes" color="#8B5CF6" />
        </ChartCard>
      </div>
    </>
  )
}

function SecaoFinanceiro({ data, saldo }: { data: DashboardsData; saldo: number }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Receitas" value={formatCurrency(data.financeiro.receitas)} icon={<TrendingUp size={18} className="text-green-600" />} bg="bg-green-50" />
        <KpiCard label="Despesas" value={formatCurrency(data.financeiro.despesas)} icon={<TrendingDown size={18} className="text-red-500" />} bg="bg-red-50" />
        <KpiCard label="Saldo" value={formatCurrency(saldo)} icon={<Wallet size={18} className="text-primary" />} bg="bg-blue-50" />
      </div>
      <ChartCard title="Receitas vs Despesas" subtitle="Evolução no período selecionado" extra={<ReceitaDespesaLegenda />}>
        <ReceitaDespesaChart serie={data.serie} />
      </ChartCard>
      <ChartCard title="Receitas por Categoria" subtitle="Distribuição no período selecionado">
        <BarDatumChart data={data.financeiro.porCategoria} color="#3B5BDB" formatter={formatCurrency} />
      </ChartCard>
    </>
  )
}

function SecaoAgenda({ data }: { data: DashboardsData }) {
  const concluidos = data.agenda.porStatus.find(s => s.status === 'concluido')?.valor ?? 0
  const taxaConclusao = data.agenda.total ? Math.round((concluidos / data.agenda.total) * 100) : 0
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total de Agendamentos" value={data.agenda.total} icon={<Calendar size={18} className="text-primary" />} bg="bg-blue-50" />
        <KpiCard label="Concluídos" value={concluidos} icon={<CheckCircle2 size={18} className="text-green-600" />} bg="bg-green-50" />
        <KpiCard label="Taxa de Conclusão" value={`${taxaConclusao}%`} icon={<TrendingUp size={18} className="text-purple-600" />} bg="bg-purple-50" />
      </div>
      <ChartCard title="Volume de Agendamentos" subtitle="Evolução no período selecionado">
        <SerieAreaChart serie={data.serie} dataKey="agendamentos" label="Agendamentos" color="#3B5BDB" />
      </ChartCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Por Status" subtitle="Distribuição no período selecionado">
          <StatusBarChart data={data.agenda.porStatus} />
        </ChartCard>
        <ChartCard title="Por Profissional" subtitle="Total de atendimentos no período">
          <NomeTotalChart data={data.agenda.porProfissional} color="#3B5BDB" />
        </ChartCard>
      </div>
    </>
  )
}

function SecaoPacientes({ data }: { data: DashboardsData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <KpiCard label="Novos Pacientes" value={data.pacientes.novos} icon={<UserPlus size={18} className="text-purple-600" />} bg="bg-purple-50" />
        <KpiCard label="Total de Pacientes" value={data.pacientes.total} icon={<Users size={18} className="text-primary" />} bg="bg-blue-50" />
      </div>
      <ChartCard title="Novos Pacientes" subtitle="Evolução no período selecionado">
        <SerieAreaChart serie={data.serie} dataKey="pacientes" label="Novos Pacientes" color="#8B5CF6" />
      </ChartCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Por Status" subtitle="Distribuição no período selecionado">
          <StatusBarChart data={data.pacientes.porStatus} />
        </ChartCard>
        <ChartCard title="Por Origem" subtitle="Distribuição no período selecionado">
          <BarDatumChart data={data.pacientes.porFonte} color="#8B5CF6" />
        </ChartCard>
      </div>
    </>
  )
}

function SecaoProfissionais({ data }: { data: DashboardsData }) {
  return (
    <>
      <ChartCard title="Atendimentos por Profissional" subtitle="Total no período selecionado">
        <NomeTotalChart data={data.profissionais} color="#3B5BDB" />
      </ChartCard>
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#F0F2FF]">
          <h2 className="font-semibold text-[#1A1A2E]">Desempenho por Profissional</h2>
          <p className="text-[12px] text-[#9CA3AF]">Resumo do período selecionado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[#9CA3AF] text-[11px] uppercase tracking-wide">
                <th className="px-5 py-2.5 font-medium">Profissional</th>
                <th className="px-5 py-2.5 font-medium">Especialidade</th>
                <th className="px-5 py-2.5 font-medium text-right">Atendimentos</th>
                <th className="px-5 py-2.5 font-medium text-right">Concluídos</th>
                <th className="px-5 py-2.5 font-medium text-right">Cancel./Faltas</th>
                <th className="px-5 py-2.5 font-medium text-right">Conclusão</th>
              </tr>
            </thead>
            <tbody>
              {data.profissionais.map(p => (
                <tr key={p.id} className="border-t border-[#F0F2FF]">
                  <td className="px-5 py-3 font-medium text-[#1A1A2E]">{p.nome}</td>
                  <td className="px-5 py-3 text-[#9CA3AF]">{p.especialidade}</td>
                  <td className="px-5 py-3 text-right">{p.total}</td>
                  <td className="px-5 py-3 text-right">{p.concluidos}</td>
                  <td className="px-5 py-3 text-right">{p.cancelados}</td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">
                    {p.total ? Math.round((p.concluidos / p.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
              {data.profissionais.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[#9CA3AF]">Nenhum profissional cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
