'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChevronRight, Users, UserCheck, Stethoscope, X, Check, ArrowRight, ArrowLeft, Upload } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  ativo: 'badge-success',
  inativo: 'badge-neutral',
  licenca_medica: 'badge-warning',
  ferias: 'badge-info',
}
const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  licenca_medica: 'Licença Médica',
  ferias: 'Férias',
}
const STATUS_INDICATOR: Record<string, string> = {
  ativo: 'bg-green-500',
  inativo: 'bg-gray-400',
  licenca_medica: 'bg-yellow-500',
  ferias: 'bg-blue-500',
}

const ESPECIALIDADES = [
  'Clínica Geral', 'Cardiologia', 'Dermatologia', 'Ortopedia',
  'Pediatria', 'Ginecologia e Obstetrícia', 'Odontologia', 'Psicologia',
  'Fisioterapia', 'Nutrição', 'Cirurgia Geral', 'Neurologia',
  'Oftalmologia', 'Otorrinolaringologia', 'Urologia', 'Endocrinologia',
  'Reumatologia', 'Gastroenterologia', 'Pneumologia', 'Psiquiatria',
  'Estética', 'Medicina do Trabalho', 'Geriatria', 'Anestesiologia',
]

interface Profissional {
  id: string
  nome: string
  especialidade: string
  registro_profissional: string | null
  foto_url: string | null
  status: string
  horario_inicio: string
  horario_fim: string
}

interface Props {
  profissionais: Profissional[]
  clinicaId: string
}

const FORM_VAZIO = {
  nome: '', email: '', senha: '', telefone: '', cpf: '',
  crm: '', rqe: '', endereco: '',
}

export function ProfissionaisClient({ profissionais: inicial, clinicaId }: Props) {
  const [lista, setLista] = useState(inicial)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState(FORM_VAZIO)
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [especialidadesExtras, setEspecialidadesExtras] = useState<string[]>([])
  const [novaEsp, setNovaEsp] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [emailJaExiste, setEmailJaExiste] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const stats = {
    total: lista.length,
    ativos: lista.filter(p => p.status === 'ativo').length,
    especialidades: new Set(lista.flatMap(p => p.especialidade.split(',').map(e => e.trim())).filter(Boolean)).size,
  }

  const filtrados = lista.filter(p =>
    !busca ||
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(busca.toLowerCase())
  )

  const iniciais = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const CORES = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']

  // Debounce check de email
  useEffect(() => {
    if (!form.email || !form.email.includes('@')) { setEmailJaExiste(false); return }
    const t = setTimeout(async () => {
      setCheckingEmail(true)
      const res = await fetch('/api/profissionais/check-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const { exists } = await res.json()
      setEmailJaExiste(exists)
      setCheckingEmail(false)
    }, 600)
    return () => clearTimeout(t)
  }, [form.email])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function toggleEsp(esp: string) {
    setEspecialidades(prev => prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp])
  }

  function adicionarEsp() {
    const esp = novaEsp.trim()
    if (!esp) return
    const existe = [...ESPECIALIDADES, ...especialidadesExtras].some(e => e.toLowerCase() === esp.toLowerCase())
    if (!existe) setEspecialidadesExtras(prev => [...prev, esp])
    if (!especialidades.includes(esp)) setEspecialidades(prev => [...prev, esp])
    setNovaEsp('')
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function abrirModal() {
    setForm(FORM_VAZIO)
    setEspecialidades([])
    setEspecialidadesExtras([])
    setNovaEsp('')
    setFotoFile(null)
    setFotoPreview(null)
    setEmailJaExiste(false)
    setErro(null)
    setStep(1)
    setModal(true)
  }

  function validarStep1() {
    if (!form.nome.trim()) return 'Nome é obrigatório.'
    if (!form.email.trim()) return 'E-mail é obrigatório.'
    if (!form.crm.trim()) return 'CRM é obrigatório.'
    if (!emailJaExiste && form.senha.length < 8) return 'Senha deve ter pelo menos 8 caracteres.'
    return null
  }

  function proximo() {
    const err = validarStep1()
    if (err) { setErro(err); return }
    setErro(null); setStep(2)
  }

  async function cadastrar() {
    if (especialidades.length === 0) { setErro('Selecione pelo menos uma especialidade.'); return }
    setErro(null); setSalvando(true)

    // Upload foto se houver
    let foto_url: string | null = null
    if (fotoFile) {
      const fd = new FormData()
      fd.append('file', fotoFile)
      fd.append('bucket', 'profissionais')
      fd.append('path', clinicaId)
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (upRes.ok) {
        const { url } = await upRes.json()
        foto_url = url
      }
    }

    const res = await fetch('/api/profissionais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicaId, ...form, foto_url, especialidade: especialidades.join(', '), emailJaExiste }),
    })

    if (!res.ok) {
      const json = await res.json()
      setErro(json.error ?? 'Erro ao cadastrar profissional.')
      setSalvando(false)
      return
    }

    setModal(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-[#1A1A2E]">Gestão de Profissionais</h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Visualize e gerencie a equipe clínica, especialidades e{' '}
            <span className="text-primary font-medium">horários</span>.
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Novo Profissional
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: <Users size={20} className="text-primary" /> },
          { label: 'Ativos', value: stats.ativos, icon: <UserCheck size={20} className="text-green-600" /> },
          { label: 'Especialidades', value: stats.especialidades, icon: <Stethoscope size={20} className="text-purple-600" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0F2FF] rounded-xl flex items-center justify-center">{s.icon}</div>
            <div>
              <p className="text-[22px] font-bold text-[#1A1A2E]">{s.value}</p>
              <p className="text-[12px] text-[#9CA3AF] uppercase font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar profissional..."
          className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtrados.map((p, idx) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative mb-3">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-full ${CORES[idx % CORES.length]} flex items-center justify-center text-white text-xl font-bold`}>
                    {iniciais(p.nome)}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${STATUS_INDICATOR[p.status] ?? 'bg-gray-400'}`} />
              </div>
              <h3 className="text-[14px] font-semibold text-primary">{p.nome}</h3>
              <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{p.especialidade}{p.registro_profissional ? ` • ${p.registro_profissional}` : ''}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className={STATUS_STYLES[p.status] ?? 'badge-neutral'}>{STATUS_LABELS[p.status] ?? p.status}</span>
              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                ⏰ <span>{p.horario_inicio.substring(0, 5)} - {p.horario_fim.substring(0, 5)}</span>
              </div>
            </div>
            <button className="mt-3 w-full flex items-center justify-center gap-1 text-[12px] text-[#9CA3AF] hover:text-primary transition-colors">
              Ver detalhes <ChevronRight size={14} />
            </button>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#9CA3AF]">Nenhum profissional encontrado</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF] flex-shrink-0">
              <div>
                <h2 className="text-h3 text-[#1A1A2E]">
                  {step === 1 ? 'Dados do Profissional' : 'Especialidades'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="h-1.5 w-20 rounded-full bg-primary" />
                  <div className={`h-1.5 w-20 rounded-full ${step === 2 ? 'bg-primary' : 'bg-[#E5E7EB]'}`} />
                </div>
              </div>
              <button onClick={() => setModal(false)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5">
              {step === 1 && (
                <div className="space-y-3">
                  {/* Nome + Telefone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">Nome completo *</label>
                      <input value={form.nome} onChange={e => set('nome', e.target.value)}
                        placeholder="Dr. João Silva"
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">Telefone</label>
                      <input value={form.telefone} onChange={e => set('telefone', e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </div>

                  {/* CPF + CRM */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">CPF</label>
                      <input value={form.cpf} onChange={e => set('cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">CRM *</label>
                      <input value={form.crm} onChange={e => set('crm', e.target.value)}
                        placeholder="CRM/SP 000000"
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </div>

                  {/* RQE + Foto */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">RQE</label>
                      <input value={form.rqe} onChange={e => set('rqe', e.target.value)}
                        placeholder="00000"
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">Foto</label>
                      <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
                      <button type="button" onClick={() => fotoInputRef.current?.click()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg hover:border-primary hover:bg-[#F0F2FF] transition-all text-[#9CA3AF] hover:text-primary">
                        {fotoPreview ? (
                          <><img src={fotoPreview} className="w-5 h-5 rounded-full object-cover" alt="" /><span className="text-[#444654] text-[12px] truncate">Foto selecionada</span></>
                        ) : (
                          <><Upload size={14} /><span className="text-[12px]">Anexar foto</span></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#444654] mb-1">Endereço</label>
                    <input value={form.endereco} onChange={e => set('endereco', e.target.value)}
                      placeholder="Rua, número, bairro, cidade — UF"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                    />
                  </div>

                  {/* Acesso */}
                  <div className="border-t border-[#F0F2FF] pt-3">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Acesso ao Sistema</p>
                    <div className="mb-3">
                      <label className="block text-[12px] font-medium text-[#444654] mb-1">E-mail *</label>
                      <div className="relative">
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                          placeholder="medico@email.com"
                          className="w-full px-3 py-2 pr-8 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                        />
                        {checkingEmail && (
                          <svg className="animate-spin w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        )}
                      </div>
                      {emailJaExiste && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="flex-shrink-0">⚠️</span>
                          <span>E-mail de médico em uso — profissional já cadastrado no sistema. A senha existente será mantida e ele terá acesso a esta clínica.</span>
                        </div>
                      )}
                    </div>

                    {!emailJaExiste && (
                      <div>
                        <label className="block text-[12px] font-medium text-[#444654] mb-1">Senha *</label>
                        <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)}
                          placeholder="Mín. 8 caracteres"
                          className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                        />
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          O profissional usará este e-mail e senha para acessar o ClinicaOS.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#9CA3AF]">Selecione todas as especialidades que se aplicam a este profissional.</p>
                  <div className="flex flex-wrap gap-2">
                    {[...ESPECIALIDADES, ...especialidadesExtras].map(esp => {
                      const sel = especialidades.includes(esp)
                      return (
                        <button
                          key={esp} type="button" onClick={() => toggleEsp(esp)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                            sel ? 'bg-primary text-white border-primary' : 'bg-white text-[#444654] border-[#E5E7EB] hover:border-primary hover:text-primary'
                          }`}
                        >
                          {sel && <Check size={11} />}{esp}
                        </button>
                      )
                    })}
                  </div>

                  {/* Adicionar especialidade customizada */}
                  <div className="flex gap-2 pt-1 border-t border-[#F0F2FF]">
                    <input
                      value={novaEsp}
                      onChange={e => setNovaEsp(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarEsp())}
                      placeholder="Adicionar especialidade..."
                      className="flex-1 px-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                    />
                    <button type="button" onClick={adicionarEsp}
                      disabled={!novaEsp.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-40">
                      <Plus size={13} /> Adicionar
                    </button>
                  </div>

                  {especialidades.length > 0 && (
                    <p className="text-[12px] text-primary font-semibold">
                      {especialidades.length} especialidade(s) selecionada(s)
                    </p>
                  )}
                </div>
              )}

              {erro && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                  {erro}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-[#F0F2FF] flex-shrink-0">
              {step === 2 ? (
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                  <ArrowLeft size={14} /> Voltar
                </button>
              ) : (
                <button onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                  Cancelar
                </button>
              )}
              {step === 1 ? (
                <button onClick={proximo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Próximo <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={cadastrar} disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                  {salvando ? 'Cadastrando...' : 'Cadastrar Profissional'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
