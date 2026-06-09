'use client'

import { useState } from 'react'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'

const PAPEL_LABELS: Record<string, string> = {
  admin: 'Admin',
  atendente: 'Secretária Administrativa',
  profissional: 'Profissional',
  financeiro: 'Financeiro',
}
const PAPEL_COLORS: Record<string, string> = {
  admin: 'text-primary',
  atendente: 'text-purple-600',
  profissional: 'text-green-600',
  financeiro: 'text-orange-600',
}
const STATUS_BADGE: Record<string, string> = {
  ativo: 'badge-success',
  inativo: 'badge-neutral',
  pendente: 'badge-warning',
}

export interface Membro {
  id: string
  papel: string
  status: string
  perfil: { id: string; nome_completo: string; email: string; avatar_url: string | null } | null
}

interface Props {
  clinica: Record<string, unknown> | null
  membros: Membro[]
}

export function ConfiguracoesClient({ clinica, membros }: Props) {
  const [aba, setAba] = useState<'clinica' | 'equipe' | 'plano'>('clinica')

  const iniciais = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const CORES = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500']

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h2 text-[#1A1A2E]">Configurações</h1>
        <p className="text-[13px] text-[#9CA3AF]">Gerencie as informações da sua clínica, equipe e plano de assinatura.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card">
        <div className="flex border-b border-[#F0F2FF] px-5">
          {(['clinica', 'equipe', 'plano'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`px-4 py-4 text-[13px] font-medium capitalize border-b-2 transition-colors ${
                aba === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#444654]'
              }`}
            >
              {tab === 'clinica' ? 'Clínica' : tab === 'equipe' ? 'Equipe' : 'Plano'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Tab Clínica */}
          {aba === 'clinica' && (
            <div className="max-w-xl space-y-4">
              <h2 className="text-h3 text-[#1A1A2E]">Informações da Clínica</h2>
              {[
                { label: 'Nome da Clínica', key: 'nome', type: 'text' },
                { label: 'CNPJ', key: 'cnpj', type: 'text' },
                { label: 'E-mail', key: 'email', type: 'email' },
                { label: 'Telefone', key: 'telefone', type: 'tel' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    defaultValue={(clinica?.[field.key] as string) ?? ''}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              ))}
              <button className="bg-primary text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors">
                Salvar Alterações
              </button>
            </div>
          )}

          {/* Tab Equipe */}
          {aba === 'equipe' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3 text-[#1A1A2E]">Membros da Equipe</h2>
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark">
                  <Plus size={14} /> Adicionar Membro
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F0F2FF]">
                    {['Membro', 'Cargo / Especialidade', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide pb-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m, idx) => (
                    <tr key={m.id} className="border-b border-[#F0F2FF] last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${CORES[idx % CORES.length]} flex items-center justify-center text-white text-[12px] font-bold`}>
                            {m.perfil ? iniciais(m.perfil.nome_completo) : '?'}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#1A1A2E]">{m.perfil?.nome_completo ?? 'Sem perfil'}</p>
                            <p className="text-[11px] text-[#9CA3AF]">{m.perfil?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[13px] font-medium ${PAPEL_COLORS[m.papel] ?? 'text-[#444654]'}`}>
                          {PAPEL_LABELS[m.papel] ?? m.papel}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={STATUS_BADGE[m.status] ?? 'badge-neutral'}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-[#9CA3AF] hover:text-[#444654] p-1"><Pencil size={15} /></button>
                          <button className="text-[#9CA3AF] hover:text-[#444654] p-1">
                            {m.status === 'ativo' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {membros.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[13px] text-[#9CA3AF]">
                        Nenhum membro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Plano */}
          {aba === 'plano' && (
            <div className="max-w-2xl">
              <h2 className="text-h3 text-[#1A1A2E] mb-4">Plano de Assinatura</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { nome: 'Starter', preco: 'R$ 149/mês', recursos: ['1 Unidade', '5 Profissionais', '500 Pacientes', 'Agendamento Básico'], atual: false },
                  { nome: 'Pro', preco: 'R$ 349/mês', recursos: ['3 Unidades', '20 Profissionais', 'Pacientes Ilimitados', 'Financeiro + API'], atual: true },
                  { nome: 'Enterprise', preco: 'Sob Consulta', recursos: ['Unidades Ilimitadas', 'Profissionais Ilimitados', 'SLA Dedicado', 'Onboarding'], atual: false },
                ].map(plano => (
                  <div key={plano.nome} className={`rounded-2xl border-2 p-5 ${plano.atual ? 'border-primary bg-[#F0F2FF]' : 'border-[#E5E7EB]'}`}>
                    {plano.atual && <p className="text-[11px] font-bold text-primary mb-2 uppercase tracking-wide">Plano Atual</p>}
                    <h3 className="text-h3 text-[#1A1A2E] mb-1">{plano.nome}</h3>
                    <p className="text-xl font-bold text-primary mb-4">{plano.preco}</p>
                    <ul className="space-y-1.5 text-[13px] text-[#444654]">
                      {plano.recursos.map(r => (
                        <li key={r} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> {r}
                        </li>
                      ))}
                    </ul>
                    {!plano.atual && (
                      <button className="w-full mt-4 bg-primary text-white py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark">
                        Fazer Upgrade
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
