'use client'

import { useState } from 'react'
import { Check, Clock, Phone, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  preco: number
  icone: string | null
  popular: boolean
}

interface Profissional {
  id: string
  nome: string
  especialidade: string
  foto_url: string | null
}

interface Clinica {
  id: string
  nome: string
  subdominio: string
  logo_url: string | null
  email: string | null
  telefone: string | null
}

interface Props {
  clinica: Clinica
  servicos: Servico[]
  profissionais: Profissional[]
}

const STEPS = ['Serviço', 'Profissional', 'Horário', 'Dados', 'Confirmação']

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
]

const ICONES: Record<string, string> = {
  stethoscope: '🩺',
  brain: '🧠',
  tooth: '🦷',
  heart: '❤️',
  default: '⚕️',
}

export function BookingClient({ clinica, servicos, profissionais }: Props) {
  const [step, setStep] = useState(1)
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', observacoes: '', consentimento: false })
  const [enviando, setEnviando] = useState(false)

  async function confirmar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consentimento) return
    setEnviando(true)

    const res = await fetch(`/api/public/agendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicaId: clinica.id,
        servicoId: servicoSelecionado?.id,
        profissionalId: profissionalSelecionado?.id,
        data,
        hora: horarioSelecionado,
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        observacoes: form.observacoes,
        consentimentoLgpd: form.consentimento,
      }),
    })

    setEnviando(false)
    if (res.ok) {
      setStep(5)
    }
  }

  const CORES_PROF = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500']

  return (
    <div className="min-h-screen bg-[#F0F2FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-[#1A1A2E]">ClinicaOS Booking</span>
          </div>
          <button className="flex items-center gap-1.5 text-[13px] text-[#444654]">
            <Phone size={14} /> Contact Support
          </button>
        </div>
      </header>

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => {
            const n = i + 1
            const ativo = step === n
            const concluido = step > n
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all ${
                    concluido
                      ? 'bg-primary border-primary text-white'
                      : ativo
                      ? 'border-primary text-primary'
                      : 'border-[#E5E7EB] text-[#9CA3AF]'
                  }`}>
                    {concluido ? <Check size={14} /> : n}
                  </div>
                  <span className={`text-[11px] mt-1 font-medium ${ativo ? 'text-primary' : 'text-[#9CA3AF]'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 mb-4 ${step > n ? 'bg-primary' : 'bg-[#E5E7EB]'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            {/* Step 1 — Serviço */}
            {step === 1 && (
              <div>
                <h1 className="text-h2 text-[#1A1A2E] mb-1">Selecione o Serviço</h1>
                <p className="text-[13px] text-[#9CA3AF] mb-5">Escolha o procedimento que deseja realizar conosco hoje.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicos.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setServicoSelecionado(s); setStep(2) }}
                      className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary hover:shadow-card ${
                        servicoSelecionado?.id === s.id ? 'border-primary bg-[#F0F2FF]' : 'border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 bg-[#F0F2FF] rounded-xl flex items-center justify-center text-lg">
                          {ICONES[s.icone ?? ''] ?? ICONES.default}
                        </div>
                        {s.popular && <span className="badge-info">Popular</span>}
                      </div>
                      <h3 className="font-semibold text-[#1A1A2E] mb-0.5">{s.nome}</h3>
                      {s.descricao && <p className="text-[12px] text-[#9CA3AF] mb-3 line-clamp-2">{s.descricao}</p>}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                          <Clock size={12} /> {s.duracao_minutos} min
                        </span>
                        <span className="text-[14px] font-bold text-primary">{formatCurrency(s.preco)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Profissional */}
            {step === 2 && (
              <div>
                <h1 className="text-h2 text-[#1A1A2E] mb-1">Escolha o Profissional</h1>
                <p className="text-[13px] text-[#9CA3AF] mb-5">Selecione seu profissional de preferência.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profissionais.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => { setProfissionalSelecionado(p); setStep(3) }}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 hover:border-primary ${
                        profissionalSelecionado?.id === p.id ? 'border-primary bg-[#F0F2FF]' : 'border-[#E5E7EB]'
                      }`}
                    >
                      {p.foto_url ? (
                        <img src={p.foto_url} className="w-12 h-12 rounded-full object-cover" alt={p.nome} />
                      ) : (
                        <div className={`w-12 h-12 rounded-full ${CORES_PROF[idx % CORES_PROF.length]} flex items-center justify-center text-white font-bold`}>
                          {p.nome.split(' ').slice(0,2).map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-primary">{p.nome}</p>
                        <p className="text-[12px] text-[#9CA3AF]">{p.especialidade}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-4 text-[13px] text-[#9CA3AF] hover:text-[#444654]">← Voltar</button>
              </div>
            )}

            {/* Step 3 — Horário */}
            {step === 3 && (
              <div>
                <h1 className="text-h2 text-[#1A1A2E] mb-1">Escolha o Horário</h1>
                <p className="text-[13px] text-[#9CA3AF] mb-4">Selecione a data e o melhor horário para você.</p>
                <div className="mb-4">
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Data</label>
                  <input
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {HORARIOS.map(h => (
                    <button
                      key={h}
                      onClick={() => { setHorarioSelecionado(h); setStep(4) }}
                      className={`py-2 rounded-lg text-[13px] font-medium border-2 transition-all ${
                        horarioSelecionado === h
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#E5E7EB] text-[#444654] hover:border-primary'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="mt-4 text-[13px] text-[#9CA3AF] hover:text-[#444654]">← Voltar</button>
              </div>
            )}

            {/* Step 4 — Dados + Consentimento */}
            {step === 4 && (
              <form onSubmit={confirmar}>
                <h1 className="text-h2 text-[#1A1A2E] mb-1">Seus Dados</h1>
                <p className="text-[13px] text-[#9CA3AF] mb-5">Preencha seus dados para confirmar o agendamento.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Nome Completo *</label>
                    <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Telefone *</label>
                      <input required value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1.5">E-mail</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Observações</label>
                    <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                      rows={3} placeholder="Alguma informação adicional relevante..."
                      className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary resize-none" />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#F0F2FF] rounded-xl">
                    <input type="checkbox" required checked={form.consentimento} onChange={e => setForm(f => ({ ...f, consentimento: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded border-[#E5E7EB] text-primary" />
                    <span className="text-[12px] text-[#444654] leading-relaxed">
                      Concordo com o <strong>tratamento dos meus dados pessoais</strong> para fins de agendamento e comunicações relacionadas, conforme a LGPD (Lei 13.709/2018).
                    </span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF]">
                      Voltar
                    </button>
                    <button type="submit" disabled={enviando} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60">
                      {enviando ? 'Enviando...' : 'Confirmar Agendamento'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 5 — Confirmação */}
            {step === 5 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h1 className="text-h2 text-[#1A1A2E] mb-2">Agendamento Confirmado!</h1>
                <p className="text-[13px] text-[#9CA3AF] mb-6">
                  Em breve você receberá uma confirmação por mensagem. Obrigado!
                </p>
                <div className="bg-[#F0F2FF] rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto">
                  <p className="text-[13px]"><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
                  <p className="text-[13px]"><strong>Profissional:</strong> {profissionalSelecionado?.nome}</p>
                  <p className="text-[13px]"><strong>Data:</strong> {data}</p>
                  <p className="text-[13px]"><strong>Horário:</strong> {horarioSelecionado}</p>
                </div>
                <button onClick={() => setStep(1)} className="mt-6 text-[13px] text-primary hover:underline font-medium">
                  Fazer outro agendamento
                </button>
              </div>
            )}
          </div>

          {/* Sidebar — Resumo */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-[#1A1A2E] mb-4">Seu Agendamento</h3>
              {!servicoSelecionado ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-[#F0F2FF] rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl">📅</div>
                  <p className="text-[12px] text-[#9CA3AF]">Selecione um serviço para começar seu agendamento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {servicoSelecionado && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1A1A2E]">{servicoSelecionado.nome}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{servicoSelecionado.duracao_minutos} min</p>
                      </div>
                      <span className="text-[14px] font-bold text-primary">{formatCurrency(servicoSelecionado.preco)}</span>
                    </div>
                  )}
                  {profissionalSelecionado && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#F0F2FF]">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold">
                        {profissionalSelecionado.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-[#1A1A2E]">{profissionalSelecionado.nome}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{profissionalSelecionado.especialidade}</p>
                      </div>
                    </div>
                  )}
                  {horarioSelecionado && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#F0F2FF]">
                      <Clock size={14} className="text-[#9CA3AF]" />
                      <span className="text-[13px] text-[#444654]">{data} às {horarioSelecionado}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#9CA3AF] bg-white rounded-xl py-3 shadow-card">
              <Shield size={12} />
              <span>Ambiente 100% Seguro e Criptografado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-4 mt-8">
        <div className="max-w-container mx-auto px-6 flex items-center justify-between text-[12px] text-[#9CA3AF]">
          <span>© 2024 ClinicaOS - Gestão Inteligente para Saúde</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">Privacidade</a>
            <a href="#" className="hover:text-primary">Termos de Uso</a>
            <a href="#" className="hover:text-primary">Ajuda</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
