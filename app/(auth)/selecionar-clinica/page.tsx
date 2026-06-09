'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, ChevronRight, HelpCircle, Plus, Users } from 'lucide-react'

interface ClinicaVinculo {
  clinica_id: string
  papel: string
  clinica: {
    id: string
    nome: string
    subdominio: string
    status: string
  }
  total_pacientes?: number
}

export default function SelecionarClinicaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [vinculos, setVinculos] = useState<ClinicaVinculo[]>([])
  const [usuario, setUsuario] = useState<{ nome: string; email: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfis_usuario')
        .select('nome_completo, email, avatar_url')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setUsuario({ nome: perfil.nome_completo, email: perfil.email, avatar: perfil.avatar_url ?? undefined })
      }

      const { data: membros } = await supabase
        .from('membros_clinica')
        .select('clinica_id, papel, clinica:clinicas(id, nome, subdominio, status)')
        .eq('usuario_id', user.id)
        .eq('status', 'ativo')

      if (!membros || membros.length === 0) {
        router.push('/login')
        return
      }

      // Supabase retorna joins como array — normalizar para objeto
      const normalized = membros.map(m => ({
        ...m,
        clinica: Array.isArray(m.clinica) ? m.clinica[0] : m.clinica,
      }))
      setVinculos(normalized as unknown as ClinicaVinculo[])
      setLoading(false)
    }
    carregar()
  }, [])

  function selecionarClinica(clinicaId: string) {
    document.cookie = `clinica_id=${clinicaId}; path=/; max-age=86400; SameSite=Lax`
    router.push('/dashboard')
  }

  const statusColor: Record<string, string> = {
    ativo: 'text-green-600',
    suspenso: 'text-yellow-600',
    cancelado: 'text-red-600',
    pendente: 'text-orange-600',
  }
  const statusLabel: Record<string, string> = {
    ativo: 'Ativo',
    suspenso: 'Suspenso',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2FF] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF] p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M14 4v20M4 14h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-[#1A1A2E]">ClinicaOS</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[#9CA3AF] hover:text-[#444654]"><HelpCircle size={18} /></button>
            {usuario && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[#1A1A2E] leading-none">{usuario.nome}</p>
                  <p className="text-[11px] text-[#9CA3AF]">Gestor Médico</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                  {usuario.nome.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Welcome card */}
        <div className="bg-primary rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-xl font-bold mb-1">Olá, {usuario?.nome?.split(' ')[0] ?? 'Doutor'}!</h1>
          <p className="text-[13px] text-blue-200">
            Selecione uma de suas unidades cadastradas para gerenciar<br />
            agendamentos, pacientes e relatórios financeiros.
          </p>
        </div>

        {/* Grid de clínicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vinculos.map(v => (
            <button
              key={v.clinica_id}
              onClick={() => selecionarClinica(v.clinica_id)}
              className="bg-white rounded-2xl shadow-card p-5 text-left hover:shadow-card-hover hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#F0F2FF] rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-primary" />
                </div>
                <span className={`text-[11px] font-semibold ${statusColor[v.clinica.status] ?? 'text-gray-500'}`}>
                  {statusLabel[v.clinica.status] ?? v.clinica.status}
                </span>
              </div>
              <h3 className="font-semibold text-[#1A1A2E] mb-0.5">{v.clinica.nome}</h3>
              <p className="text-[12px] text-[#9CA3AF] mb-3">{v.clinica.subdominio}.clinicaos.com.br</p>
              <div className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                <Users size={12} />
                <span>— Pacientes</span>
              </div>
              <div className="mt-4 w-full bg-primary text-white text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-1 group-hover:bg-primary-dark transition-colors">
                Acessar <ChevronRight size={16} />
              </div>
            </button>
          ))}

          {/* Nova unidade */}
          <button className="bg-white rounded-2xl shadow-card p-5 text-left hover:shadow-card-hover hover:-translate-y-0.5 transition-all border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center min-h-[160px] gap-2 group">
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-[#E5E7EB] flex items-center justify-center group-hover:border-primary transition-colors">
              <Plus size={18} className="text-[#9CA3AF] group-hover:text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#1A1A2E]">Nova Unidade</p>
              <p className="text-[12px] text-[#9CA3AF]">Adicionar nova clínica à sua conta</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Sistema Operacional
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              Ambiente Seguro
            </span>
          </div>
          <span>© 2024 ClinicaOS. Todos os direitos reservados.</span>
        </div>
      </div>
    </div>
  )
}
