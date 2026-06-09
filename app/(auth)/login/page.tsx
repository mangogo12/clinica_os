'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error || !data.user) {
      setErro('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    // Buscar vínculos do usuário
    const { data: membros } = await supabase
      .from('membros_clinica')
      .select('id, clinica_id, papel, clinica:clinicas(id, nome, subdominio, status, plano, configuracoes)')
      .eq('usuario_id', data.user.id)
      .eq('status', 'ativo')

    if (!membros || membros.length === 0) {
      // Usuário existe mas sem clínica — redireciona para criar
      router.push('/criar-clinica')
      return
    }

    if (membros.length === 1) {
      const clinica = Array.isArray(membros[0].clinica) ? membros[0].clinica[0] : membros[0].clinica as any

      // Verificar trial expirado (armazenado em configuracoes.trial_expires_at)
      const trialExpiresAt = (clinica?.configuracoes as any)?.trial_expires_at
      if (clinica?.plano === 'starter' && trialExpiresAt) {
        if (new Date(trialExpiresAt) < new Date()) {
          await supabase.auth.signOut()
          router.push('/plano-expirado')
          return
        }
      }

      document.cookie = `clinica_id=${membros[0].clinica_id}; path=/; max-age=86400; SameSite=Lax`
      router.push('/dashboard')
    } else {
      router.push('/selecionar-clinica')
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-modal p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">ClinicaOS</h1>
            <p className="text-[13px] text-primary font-medium mt-0.5">Gestão Inteligente para Saúde</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-[12px] font-medium text-[#444654] mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-medium text-[#444654]">Sua Senha</label>
                <button type="button" className="text-[12px] text-primary hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#444654]"
                >
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Lembrar */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={e => setLembrar(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E7EB] text-primary"
              />
              <span className="text-[13px] text-[#444654]">Manter-me conectado</span>
            </label>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <>Entrar <span>→</span></>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>
            <a
              href="/registro"
              className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary font-semibold py-2.5 rounded-lg hover:bg-[#F0F2FF] transition-colors text-[13px]"
            >
              🚀 Teste grátis por 3 dias
            </a>
            <p className="text-center text-[12px] text-[#9CA3AF] mt-3">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-[#9CA3AF]">
          <Shield size={12} />
          <span>AMBIENTE SEGURO E CRIPTOGRAFADO</span>
        </div>
      </div>
    </div>
  )
}
