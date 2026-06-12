'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Home, LayoutDashboard, Calendar, Users, UserCheck, DollarSign,
  Settings, LogOut, Stethoscope, ClipboardList, Clock, Check,
} from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'

const navItems = [
  { href: '/inicio',           label: 'Início',          icon: Home },
  { href: '/dashboards',       label: 'Dashboards',      icon: LayoutDashboard },
  { href: '/agenda',          label: 'Agenda',           icon: Calendar },
  { href: '/pacientes',       label: 'Pacientes',        icon: Users },
  { href: '/profissionais',   label: 'Profissionais',    icon: UserCheck },
  { href: '/servicos',        label: 'Serviços',         icon: ClipboardList },
  { href: '/financeiro',      label: 'Financeiro',       icon: DollarSign },
  { href: '/configuracoes',   label: 'Configurações',    icon: Settings },
]

interface SidebarProps {
  nomeClinica: string
  nomeUsuario: string
  papelUsuario: string
  avatarUrl?: string
  userId: string
  saidaRegistradaEm?: string | null
}

export function Sidebar({ nomeClinica, nomeUsuario, papelUsuario, avatarUrl, userId, saidaRegistradaEm = null }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [localAvatar, setLocalAvatar] = useState(avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [popupAberto, setPopupAberto] = useState(false)
  const [stats, setStats] = useState<{ diasTrabalhados: number; pacientesAtendidos: number } | null>(null)
  const [saidaRegistrada, setSaidaRegistrada] = useState(saidaRegistradaEm)
  const [registrandoSaida, setRegistrandoSaida] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'clinica_id=; path=/; max-age=0'
    router.push('/login')
  }

  async function handleRegistrarSaida() {
    if (registrandoSaida || saidaRegistrada) return
    setRegistrandoSaida(true)
    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'saida' }),
    })
    if (res.ok) {
      const data = await res.json()
      setSaidaRegistrada(data.registrado_em)
    }
    setRegistrandoSaida(false)
  }

  async function abrirPopup() {
    setPopupAberto(true)
    if (!stats) {
      const res = await fetch('/api/meu-perfil/stats')
      if (res.ok) setStats(await res.json())
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'avatars')
    fd.append('path', userId)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setLocalAvatar(url)
      await supabase.from('perfis_usuario').update({ avatar_url: url }).eq('id', userId)
    }
    setUploadingAvatar(false)
  }

  const papelLabel: Record<string, string> = {
    admin: 'Administrador',
    atendente: 'Atendente',
    profissional: 'Profissional',
    financeiro: 'Financeiro',
  }

  return (
    <>
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-[15px] leading-tight truncate">ClinicaOS</p>
            <p className="text-blue-300 text-[11px] leading-tight truncate">{nomeClinica}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
                    isActive
                      ? 'bg-white/10 text-white border-l-[3px] border-white -ml-[3px] pl-[15px]'
                      : 'text-white/70 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon size={18} className={isActive ? 'opacity-100' : 'opacity-80'} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        <div className="flex items-center gap-3 px-3 cursor-pointer" onClick={abrirPopup}>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-9 h-9 rounded-full flex-shrink-0 group"
            title="Alterar foto de perfil"
          >
            {localAvatar ? (
              <img src={localAvatar} alt={nomeUsuario} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {nomeUsuario.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar
                ? <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <span className="text-white text-[9px] font-bold">FOTO</span>
              }
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[13px] font-semibold leading-tight truncate">{nomeUsuario}</p>
            <p className="text-blue-300 text-[11px] leading-tight truncate uppercase tracking-wide">
              {papelLabel[papelUsuario] ?? papelUsuario}
            </p>
          </div>
          <button onClick={e => { e.stopPropagation(); handleLogout() }} className="text-white/50 hover:text-white transition-colors" title="Sair">
            <LogOut size={15} />
          </button>
        </div>

        <button
          onClick={e => { e.stopPropagation(); handleRegistrarSaida() }}
          disabled={registrandoSaida || !!saidaRegistrada}
          className={cn(
            'mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:cursor-default',
            saidaRegistrada
              ? 'bg-white/5 text-blue-300'
              : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-60',
          )}
          title="Registrar saída do expediente"
        >
          {saidaRegistrada
            ? <><Check size={12} /> Saída às {formatTime(saidaRegistrada)}</>
            : <><Clock size={12} /> {registrandoSaida ? 'Registrando...' : 'Registrar saída'}</>
          }
        </button>
      </div>
    </aside>

    {/* Popup de perfil */}
    {popupAberto && (
      <div className="fixed inset-0 z-50 flex items-end justify-start p-4 pointer-events-none">
        <div
          className="pointer-events-auto ml-[20px] mb-[80px] bg-white rounded-2xl shadow-modal w-[260px] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header com foto */}
          <div className="bg-primary p-5 flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 text-white/60 hover:text-white"
              onClick={() => setPopupAberto(false)}
            >
              ✕
            </button>
            <div className="relative group mb-3">
              {localAvatar ? (
                <img src={localAvatar} alt={nomeUsuario} className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                  {nomeUsuario.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
              >
                {uploadingAvatar ? '...' : 'ALTERAR'}
              </button>
            </div>
            <p className="text-white font-bold text-[14px] text-center">{nomeUsuario}</p>
            <p className="text-blue-200 text-[11px] uppercase tracking-wide">
              {({ admin: 'Administrador', atendente: 'Atendente', profissional: 'Profissional', financeiro: 'Financeiro' } as Record<string,string>)[papelUsuario] ?? papelUsuario}
            </p>
          </div>

          {/* Stats */}
          <div className="p-4">
            {stats === null ? (
              <p className="text-center text-[12px] text-[#9CA3AF] py-2">Carregando...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F0F2FF] rounded-xl p-3 text-center">
                  <p className="text-[22px] font-bold text-primary">{stats.diasTrabalhados}</p>
                  <p className="text-[11px] text-[#9CA3AF] font-medium">Dias Trabalhados</p>
                </div>
                <div className="bg-[#F0F2FF] rounded-xl p-3 text-center">
                  <p className="text-[22px] font-bold text-primary">{stats.pacientesAtendidos}</p>
                  <p className="text-[11px] text-[#9CA3AF] font-medium">Pacientes Atendidos</p>
                </div>
              </div>
            )}

            <button
              onClick={() => { avatarInputRef.current?.click(); setPopupAberto(false) }}
              className="w-full mt-3 py-2 text-[12px] font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] text-[#444654] transition-colors"
            >
              Alterar foto de perfil
            </button>
          </div>
        </div>

        {/* Overlay para fechar */}
        <div className="fixed inset-0 -z-10" onClick={() => setPopupAberto(false)} />
      </div>
    )}
    </>
  )
}
