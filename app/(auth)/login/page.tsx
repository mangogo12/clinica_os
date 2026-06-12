'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = ref.current
      if (!el) return
      el.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] rounded-full mix-blend-screen blur-[80px] transition-transform duration-200 ease-out bg-[radial-gradient(circle,_rgba(184,195,255,0.5)_0%,_rgba(59,91,219,0.25)_45%,_transparent_75%)]"
    />
  )
}

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
      router.push('/inicio')
    } else {
      router.push('/selecionar-clinica')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#2a3a9e_0%,_#13153a_45%,_#090a1c_100%)]">
      {/* Textura de pontos */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Glow ambiente */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-primary/30 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -left-32 w-[320px] h-[320px] bg-secondary/20 rounded-full blur-[100px]" />

      {/* Glow que segue o cursor */}
      <CursorGlow />

      <div className="relative w-full max-w-sm z-10">
        <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-modal p-8 overflow-hidden">
          {/* Linha de brilho no topo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary-light to-transparent" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-primary-light/30 rounded-full blur-3xl" />

          {/* Logo */}
          <div className="relative flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(59,91,219,0.5)]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Bem-vindo de volta</h1>
            <p className="text-[13px] text-white/50 mt-0.5">Acesse sua conta para gerenciar sua clínica</p>
          </div>

          <form onSubmit={handleLogin} className="relative space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none text-white focus:border-primary-light focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-white/25"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-medium text-white/60">Sua Senha</label>
                <button type="button" className="text-[12px] text-primary-light hover:text-white transition-colors">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none text-white focus:border-primary-light focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
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
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary"
              />
              <span className="text-[13px] text-white/60">Manter-me conectado</span>
            </label>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-[13px] text-red-300">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_0_20px_rgba(59,91,219,0.4)]"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="relative mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/30 uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <a
              href="/registro"
              className="flex items-center justify-center gap-2 w-full border border-primary-light/40 text-primary-light font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors text-[13px]"
            >
              🚀 Teste grátis por 3 dias
            </a>
            <p className="text-center text-[12px] text-white/30 mt-3">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-white/30">
          <Shield size={12} />
          <span>AMBIENTE SEGURO E CRIPTOGRAFADO</span>
        </div>
      </div>
    </div>
  )
}
