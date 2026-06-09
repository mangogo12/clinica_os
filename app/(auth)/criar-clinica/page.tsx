'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PERFIS = [
  'Médico(a)', 'Dentista', 'Psicólogo(a)', 'Fisioterapeuta',
  'Nutricionista', 'Enfermeiro(a)', 'Gestor(a) de Clínica', 'Outro',
]

const AREAS = [
  'Clínica Geral', 'Cardiologia', 'Dermatologia', 'Ortopedia',
  'Pediatria', 'Ginecologia', 'Odontologia', 'Psicologia',
  'Fisioterapia', 'Nutrição', 'Estética', 'Outra',
]

function gerarSubdominio(nome: string): string {
  return nome.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 30)
}

export default function CriarClinicaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nomeClinica, setNomeClinica] = useState('')
  const [perfil, setPerfil] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }
      setUserEmail(data.user.email ?? '')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeClinica.trim()) return
    setErro(null)
    setLoading(true)

    const subdominio = gerarSubdominio(nomeClinica) + '-' + Math.random().toString(36).substring(2, 6)

    const res = await fetch('/api/criar-clinica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeClinica, subdominio, perfil, area }),
    })

    const json = await res.json()

    if (!res.ok) {
      setErro(json.error ?? 'Erro ao criar clínica. Tente novamente.')
      setLoading(false)
      return
    }

    document.cookie = `clinica_id=${json.clinicaId}; path=/; max-age=86400; SameSite=Lax`
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { supabase.auth.signOut(); router.push('/login') }}
            className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#444654]"
          >
            <ArrowLeft size={14} /> Sair
          </button>
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
          <div className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-2xl">
              🏥
            </div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Crie sua clínica</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              Conta: <span className="text-[#444654]">{userEmail}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da clínica */}
            <div>
              <label className="block text-[12px] font-medium text-[#444654] mb-1.5">
                Nome da Clínica *
              </label>
              <input
                required
                autoFocus
                value={nomeClinica}
                onChange={e => setNomeClinica(e.target.value)}
                placeholder="Ex: Clínica São Lucas"
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
              />
              {nomeClinica && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  URL:{' '}
                  <span className="text-primary font-medium">
                    {gerarSubdominio(nomeClinica)}.clinicaos.com.br
                  </span>
                </p>
              )}
            </div>

            {/* Perfil + Área (opcionais) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Você é...</label>
                <select
                  value={perfil}
                  onChange={e => setPerfil(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-[#444654]"
                >
                  <option value="">Opcional</option>
                  {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1.5">Área</label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white text-[#444654]"
                >
                  <option value="">Opcional</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nomeClinica.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-[14px]"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                'Criar clínica e entrar →'
              )}
            </button>
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
