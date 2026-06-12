'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { LogIn, LogOut } from 'lucide-react'

interface RegistroPonto {
  id: string
  tipo: 'entrada' | 'saida'
  registrado_em: string
  usuario: { nome_completo: string; avatar_url: string | null } | null
}

export function RegistrosPontoCard() {
  const [registros, setRegistros] = useState<RegistroPonto[] | null>(null)

  useEffect(() => {
    fetch('/api/ponto/registros?limite=20')
      .then(res => (res.ok ? res.json() : []))
      .then(setRegistros)
      .catch(() => setRegistros([]))
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-card">
      <div className="p-5 border-b border-[#F0F2FF]">
        <h2 className="font-semibold text-[#1A1A2E]">Registros de Ponto</h2>
        <p className="text-[12px] text-[#9CA3AF]">Últimas entradas e saídas da equipe</p>
      </div>
      <div className="divide-y divide-[#F0F2FF]">
        {registros === null && (
          <p className="text-[13px] text-[#9CA3AF] text-center py-6">Carregando...</p>
        )}
        {registros?.length === 0 && (
          <p className="text-[13px] text-[#9CA3AF] text-center py-6">Nenhum registro encontrado</p>
        )}
        {registros?.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.tipo === 'entrada' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {r.tipo === 'entrada' ? <LogIn size={15} /> : <LogOut size={15} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1A1A2E] truncate">{r.usuario?.nome_completo ?? 'Usuário'}</p>
              <p className="text-[11px] text-[#9CA3AF]">{r.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada</p>
            </div>
            <span className="text-[12px] text-[#444654] font-medium whitespace-nowrap">{formatDateTime(r.registrado_em)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
