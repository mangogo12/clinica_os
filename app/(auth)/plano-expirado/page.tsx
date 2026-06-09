'use client'

import Link from 'next/link'
import { Shield, Lock, ArrowLeft } from 'lucide-react'

const PLANOS = [
  {
    nome: 'Básico',
    preco: 'R$ 97',
    periodo: '/mês',
    cor: 'border-[#E5E7EB]',
    badge: null,
    recursos: [
      '1 profissional',
      'Agenda online',
      'Prontuário eletrônico',
      'WhatsApp básico',
      'Suporte por e-mail',
    ],
  },
  {
    nome: 'Pro',
    preco: 'R$ 197',
    periodo: '/mês',
    cor: 'border-primary',
    badge: 'Mais popular',
    recursos: [
      'Até 5 profissionais',
      'Agenda + agendamento público',
      'Prontuário completo',
      'WhatsApp + relatórios',
      'Financeiro integrado',
      'Suporte prioritário',
    ],
  },
  {
    nome: 'Clínica',
    preco: 'R$ 397',
    periodo: '/mês',
    cor: 'border-[#E5E7EB]',
    badge: null,
    recursos: [
      'Profissionais ilimitados',
      'Multi-unidades',
      'API + integrações',
      'Relatórios avançados',
      'Manager de equipe',
      'Suporte 24/7 + onboarding',
    ],
  },
]

export default function PlanoExpiradoPage() {
  return (
    <div className="min-h-screen bg-[#F0F2FF] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#444654]"
          >
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-[#1A1A2E] text-[15px]">ClinicaOS</span>
          </div>
        </div>

        {/* Aviso de expiração */}
        <div className="bg-white rounded-2xl shadow-modal p-6 mb-6 flex items-start gap-4 border border-amber-200">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
            🔒
          </div>
          <div>
            <h2 className="font-bold text-[#1A1A2E] text-[15px] mb-0.5">Seu período de teste expirou</h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Os 3 dias gratuitos chegaram ao fim. Seus dados estão salvos — escolha um plano para
              continuar acessando o ClinicaOS.
            </p>
          </div>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {PLANOS.map(plano => (
            <div
              key={plano.nome}
              className={`bg-white rounded-2xl shadow-modal p-6 border-2 ${plano.cor} relative`}
            >
              {plano.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                  {plano.badge}
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-[#1A1A2E] text-[15px]">{plano.nome}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#1A1A2E]">{plano.preco}</span>
                  <span className="text-[12px] text-[#9CA3AF]">{plano.periodo}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plano.recursos.map(r => (
                  <li key={r} className="flex items-center gap-2 text-[13px] text-[#444654]">
                    <span className="text-green-500 font-bold text-[11px]">✓</span>
                    {r}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-[13px] transition-colors ${
                  plano.badge
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'border-2 border-primary text-primary hover:bg-[#F0F2FF]'
                }`}
              >
                Assinar {plano.nome}
              </button>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="text-center space-y-1">
          <p className="text-[12px] text-[#9CA3AF]">
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:suporte@clinicaos.com.br" className="text-primary underline">
              suporte@clinicaos.com.br
            </a>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9CA3AF]">
            <Shield size={12} />
            <span>AMBIENTE SEGURO E CRIPTOGRAFADO</span>
          </div>
        </div>
      </div>
    </div>
  )
}
