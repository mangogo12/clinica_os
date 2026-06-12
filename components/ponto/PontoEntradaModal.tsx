'use client'

import { useState } from 'react'
import { LogIn } from 'lucide-react'

interface Props {
  registrado: boolean
}

export function PontoEntradaModal({ registrado }: Props) {
  const [aberto, setAberto] = useState(!registrado)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function registrarEntrada() {
    setLoading(true)
    setErro(null)
    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'entrada' }),
    })
    if (res.ok) {
      setAberto(false)
    } else {
      const body = await res.json().catch(() => null)
      setErro(body?.error ?? 'Erro ao registrar entrada.')
    }
    setLoading(false)
  }

  if (!aberto) return null

  const agora = new Date()
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(agora)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A2E]/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LogIn size={22} className="text-primary" />
        </div>
        <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-1">Registrar entrada</h2>
        <p className="text-[13px] text-[#9CA3AF] capitalize mb-1">{dataFormatada}</p>
        <p className="text-[13px] text-[#444654] mb-5">
          Confirme sua entrada para iniciar o expediente de hoje.
        </p>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[12px] text-red-600 mb-4">
            {erro}
          </div>
        )}

        <button
          onClick={registrarEntrada}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Registrando...' : 'Registrar entrada'}
        </button>
      </div>
    </div>
  )
}
