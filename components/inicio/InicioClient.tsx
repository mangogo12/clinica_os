'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatTime, statusAgendamentoBadge, statusAgendamentoLabel } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Calendar, ChevronRight, DollarSign, TrendingDown, UserPlus } from 'lucide-react'
import { RegistrosPontoCard } from '@/components/ponto/RegistrosPontoCard'

const PERFIS_PONTO = ['admin', 'financeiro', 'medico_admin']

export interface AgendamentoItem {
  id: string
  data_hora_inicio: string
  status: string
  paciente: { nome: string } | null
  profissional: { nome: string } | null
  servico: { nome: string; preco?: number } | null
}

interface KPIs {
  agendamentosHoje: number
  faturamentoMes: number
  taxaFaltas: number
  novosPacientes: number
}

interface Props {
  kpis: KPIs
  agendamentosHoje: AgendamentoItem[]
  agendamentosRecentes: AgendamentoItem[]
  chartData: { dia: string; receita: number }[]
  nomeUsuario: string
  papelUsuario: string
}

const BORDA_STATUS: Record<string, string> = {
  agendado: 'border-primary',
  confirmado: 'border-primary',
  em_atendimento: 'border-amber-400',
  concluido: 'border-green-500',
  cancelado: 'border-red-400',
  falta: 'border-red-400',
}

function saudacaoPorHora(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function primeiroNomeCapitalizado(nome: string): string {
  const primeiro = nome.split(' ')[0]
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()
}

export function InicioClient({ kpis, agendamentosHoje, agendamentosRecentes, chartData, nomeUsuario, papelUsuario }: Props) {
  const [saudacao, setSaudacao] = useState('')

  useEffect(() => {
    setSaudacao(saudacaoPorHora())
    const timer = setInterval(() => setSaudacao(saudacaoPorHora()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const hoje = new Date()
  const diaSemanaLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const dataFormatada = `${diaSemanaLabels[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`

  // Mini calendário
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  // Próximo agendamento hoje
  const proximoAg = agendamentosHoje.find(ag => ['agendado', 'confirmado'].includes(ag.status))

  const nomeExibicao = primeiroNomeCapitalizado(nomeUsuario)

  const kpiCards = [
    {
      label: 'Agendamentos Hoje',
      value: kpis.agendamentosHoje,
      icon: <Calendar size={18} className="text-primary" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Faturamento Mês',
      value: formatCurrency(kpis.faturamentoMes),
      icon: <DollarSign size={18} className="text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      label: 'Taxa de Faltas',
      value: `${kpis.taxaFaltas}%`,
      icon: <TrendingDown size={18} className="text-red-500" />,
      bg: 'bg-red-50',
    },
    {
      label: 'Novos Pacientes',
      value: kpis.novosPacientes,
      icon: <UserPlus size={18} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-primary rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-blue-200 text-[13px] mb-1">{dataFormatada}</p>
          <h1 className="text-white text-2xl font-bold mb-2">
            {saudacao}{saudacao ? ', ' : ''}{nomeExibicao}!
          </h1>
          <p className="text-blue-100 text-[14px] mb-4">
            {kpis.agendamentosHoje === 0 ? (
              'Nenhum agendamento para hoje. Aproveite para organizar a clínica.'
            ) : (
              <>
                Sua clínica tem <strong>{kpis.agendamentosHoje} agendamento{kpis.agendamentosHoje > 1 ? 's' : ''}</strong> para hoje.
                {proximoAg && (
                  <> O próximo começa às{' '}
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-semibold text-white">
                      {formatTime(proximoAg.data_hora_inicio)}
                    </span>.
                  </>
                )}
              </>
            )}
          </p>
          <a href="/agenda" className="bg-white text-primary font-semibold text-[13px] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors inline-block">
            Ver Agenda Completa
          </a>
        </div>
        <div className="hidden md:block opacity-20 absolute right-6 top-1/2 -translate-y-1/2">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" stroke="white" strokeWidth="2"/>
            <path d="M60 20v80M20 60h80" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-[22px] font-bold text-[#1A1A2E] leading-none mb-1">{card.value}</p>
            <p className="text-[12px] text-[#9CA3AF]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Calendar + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Faturamento Semanal</h2>
              <p className="text-[12px] text-[#9CA3AF]">Receitas confirmadas dos últimos 7 dias</p>
            </div>
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"/>Receita (R$)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B5BDB" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B5BDB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(1)}k`} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Receita']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              />
              <Area type="monotone" dataKey="receita" stroke="#3B5BDB" strokeWidth={2} fill="url(#gradPrimary)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Mini Calendário */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#1A1A2E]">
                {meses[mes]} {ano}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {diasSemana.map(d => (
                <div key={d} className="text-[10px] text-center text-[#9CA3AF] font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1
                const isHoje = dia === hoje.getDate()
                return (
                  <button key={dia}
                    className={`text-[11px] text-center py-1 rounded-full transition-colors ${
                      isHoje ? 'bg-primary text-white font-bold' : 'text-[#444654] hover:bg-[#F0F2FF]'
                    }`}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agenda do dia */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E] text-[13px]">Agenda de Hoje</h3>
              <span className="badge-info">{agendamentosHoje.length} TOTAL</span>
            </div>
            <div className="space-y-3">
              {agendamentosHoje.slice(0, 4).map(ag => (
                <div key={ag.id} className={`pl-3 border-l-2 ${BORDA_STATUS[ag.status] ?? 'border-primary'}`}>
                  <p className="text-[11px] text-primary font-semibold">{formatTime(ag.data_hora_inicio)}</p>
                  <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{ag.paciente?.nome ?? '—'}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{ag.servico?.nome ?? '—'}</p>
                </div>
              ))}
              {agendamentosHoje.length === 0 && (
                <p className="text-[13px] text-[#9CA3AF] text-center py-3">Nenhum agendamento hoje</p>
              )}
            </div>
            <a href="/agenda" className="block w-full mt-3 text-[12px] text-primary font-medium hover:underline text-center">
              Expandir Agenda
            </a>
          </div>
        </div>
      </div>

      {/* Agendamentos recentes */}
      <div className="bg-white rounded-2xl shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
          <h2 className="font-semibold text-[#1A1A2E]">Agendamentos Recentes</h2>
          <a href="/agenda" className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F2FF]">
                {['Horário', 'Paciente', 'Profissional', 'Serviço', 'Status'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agendamentosRecentes.map(ag => (
                <tr key={ag.id} className="border-b border-[#F0F2FF] last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3 text-[13px] text-[#1A1A2E] font-medium">{formatTime(ag.data_hora_inicio)}</td>
                  <td className="px-5 py-3 text-[13px] text-primary font-medium">{ag.paciente?.nome ?? '—'}</td>
                  <td className="px-5 py-3 text-[13px] text-[#1A1A2E]">{ag.profissional?.nome ?? '—'}</td>
                  <td className="px-5 py-3 text-[13px] text-[#444654]">{ag.servico?.nome ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={statusAgendamentoBadge(ag.status)}>{statusAgendamentoLabel(ag.status)}</span>
                  </td>
                </tr>
              ))}
              {agendamentosRecentes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">Nenhum agendamento encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registros de ponto — apenas perfis de gestão */}
      {PERFIS_PONTO.includes(papelUsuario) && <RegistrosPontoCard />}
    </div>
  )
}
