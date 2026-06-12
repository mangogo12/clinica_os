'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PERFIS = [
  'Médico(a)',
  'Dentista',
  'Psicólogo(a)',
  'Fisioterapeuta',
  'Nutricionista',
  'Enfermeiro(a)',
  'Gestor(a) de Clínica',
  'Outro',
]

const AREAS = [
  'Clínica Geral',
  'Cardiologia',
  'Dermatologia',
  'Ortopedia',
  'Pediatria',
  'Ginecologia',
  'Odontologia',
  'Psicologia',
  'Fisioterapia',
  'Nutrição',
  'Estética',
  'Outra',
]

function gerarSubdominio(nomeClinica: string): string {
  return nomeClinica
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)
}

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nome: '',
    celular: '',
    perfil: '',
    area: '',
    nomeClinica: '',
    email: '',
    senha: '',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'sucesso'>('form')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (form.senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)

    const subdominio = gerarSubdominio(form.nomeClinica) + '-' + Math.random().toString(36).substring(2, 6)

    // Criar usuário + clínica via API (admin client — sem confirmação de e-mail)
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeUsuario: form.nome,
        email: form.email,
        senha: form.senha,
        celular: form.celular,
        perfil: form.perfil,
        area: form.area,
        nomeClinica: form.nomeClinica,
        subdominio,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      if (res.status === 409) {
        setErro('Este e-mail já está cadastrado. Faça login ou use outro e-mail.')
      } else {
        setErro(json.error ?? 'Erro ao criar conta. Tente novamente.')
      }
      setLoading(false)
      return
    }

    // Auto-login após cadastro bem-sucedido
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })

    if (loginError || !loginData.user) {
      router.push('/login?cadastro=ok')
      return
    }

    document.cookie = `clinica_id=${json.clinicaId}; path=/; max-age=86400; SameSite=Lax`
    router.push('/inicio')
  }

  if (step === 'sucesso') {
    return (
      <div className="min-h-screen bg-[#F0F2FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-modal p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🎉
          </div>
          <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Conta criada!</h1>
          <p className="text-[13px] text-[#9CA3AF] mb-6">
            Enviamos um e-mail de confirmação para <strong>{form.email}</strong>.
            Confirme e faça login para começar.
          </p>
          <Link
            href="/login"
            className="block w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-[13px] hover:bg-primary-dark transition-colors"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/login" className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#444654]">
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

        <div className="bg-white rounded-2xl shadow-modal p-8">
          {/* Título */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[12px] font-semibold px-3 py-1 rounded-full mb-3">
              🚀 Teste grátis por 3 dias
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Crie sua conta</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Sem cartão de crédito. Cancele quando quiser.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome + Celular */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Nome e sobrenome *</label>
                <input
                  required
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Dr. João Silva"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Celular / WhatsApp *</label>
                <input
                  required
                  value={form.celular}
                  onChange={e => set('celular', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Perfil + Área */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Você é... *</label>
                <select
                  required
                  value={form.perfil}
                  onChange={e => set('perfil', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-[#444654]"
                >
                  <option value="">Selecione uma opção</option>
                  {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Área de atuação *</label>
                <select
                  required
                  value={form.area}
                  onChange={e => set('area', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-[#444654]"
                >
                  <option value="">Selecione uma opção</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Nome da clínica */}
            <div>
              <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Nome da Clínica *</label>
              <input
                required
                value={form.nomeClinica}
                onChange={e => set('nomeClinica', e.target.value)}
                placeholder="Ex: Clínica São Lucas"
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
              />
              {form.nomeClinica && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  URL da sua clínica:{' '}
                  <span className="text-primary font-medium">
                    {gerarSubdominio(form.nomeClinica)}.clinicaos.com.br
                  </span>
                </p>
              )}
            </div>

            {/* E-mail + Senha */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">E-mail *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="nome@dominio.com"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Senha *</label>
                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={e => set('senha', e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    className="w-full px-3 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#444654]"
                  >
                    {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-[14px] mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                'Criar conta grátis →'
              )}
            </button>

            <p className="text-center text-[11px] text-[#9CA3AF]">
              Ao prosseguir, você concorda com os nossos{' '}
              <a href="#" className="underline">Termos de Uso e Política de Privacidade</a>.
            </p>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[#9CA3AF]">
          <Shield size={12} />
          <span>AMBIENTE SEGURO E CRIPTOGRAFADO</span>
        </div>
      </div>
    </div>
  )
}
