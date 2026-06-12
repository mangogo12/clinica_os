'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChevronRight, Users, UserCheck, Stethoscope, X, Check, ArrowRight, ArrowLeft, Upload, Trash2 } from 'lucide-react'

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

const STATUS_MEMBRO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  pendente: 'Pendente',
}
const STATUS_MEMBRO_BADGE: Record<string, string> = {
  ativo: 'badge-success',
  inativo: 'badge-neutral',
  pendente: 'badge-warning',
}
const STATUS_MEMBRO_INDICATOR: Record<string, string> = {
  ativo: 'bg-green-500',
  inativo: 'bg-gray-400',
  pendente: 'bg-yellow-500',
}

const PAPEL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  medico_admin: 'Médico Administrador',
  financeiro: 'Financeiro',
  atendente: 'Atendente',
}

const PAPEL_OPTIONS = ['admin', 'medico', 'medico_admin', 'financeiro', 'atendente']

const EQUIPE_PAPEIS = ['admin', 'atendente', 'financeiro', 'medico_admin']
const EQUIPE_MEDICA_PAPEIS = ['medico', 'medico_admin']

const ESPECIALIDADES = [
  'Clínica Geral', 'Cardiologia', 'Dermatologia', 'Ortopedia',
  'Pediatria', 'Ginecologia e Obstetrícia', 'Odontologia', 'Psicologia',
  'Fisioterapia', 'Nutrição', 'Cirurgia Geral', 'Neurologia',
  'Oftalmologia', 'Otorrinolaringologia', 'Urologia', 'Endocrinologia',
  'Reumatologia', 'Gastroenterologia', 'Pneumologia', 'Psiquiatria',
  'Estética', 'Medicina do Trabalho', 'Geriatria', 'Anestesiologia',
]

export interface MembroEquipe {
  id: string
  papel: string
  statusMembro: string
  nome: string
  email: string
  telefone: string | null
  avatarUrl: string | null
  profissional: {
    id: string
    especialidade: string
    registroProfissional: string | null
    status: string
  } | null
}

interface Servico {
  id: string
  nome: string
}

interface Props {
  membros: MembroEquipe[]
  servicos: Servico[]
  clinicaId: string
}

const FORM_VAZIO = {
  nome: '', email: '', senha: '', telefone: '', cpf: '',
  crm: '', rqe: '', endereco: '',
}

const EDIT_VAZIO = { nome: '', papel: '', especialidade: '', registroProfissional: '', status: '' }

export function ProfissionaisClient({ membros: inicial, servicos, clinicaId }: Props) {
  const [membros, setMembros] = useState(inicial)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState(FORM_VAZIO)
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [especialidadesExtras, setEspecialidadesExtras] = useState<string[]>([])
  const [novaEsp, setNovaEsp] = useState('')
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([])
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [emailJaExiste, setEmailJaExiste] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [modalEditar, setModalEditar] = useState<MembroEquipe | null>(null)
  const [editForm, setEditForm] = useState(EDIT_VAZIO)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const profissionais = membros.filter(m => m.profissional)

  const stats = {
    total: membros.length,
    ativos: membros.filter(m => (m.profissional ? m.profissional.status === 'ativo' : m.statusMembro === 'ativo')).length,
    especialidades: new Set(profissionais.flatMap(m => m.profissional!.especialidade.split(',').map(e => e.trim())).filter(Boolean)).size,
  }

  const filtrados = membros.filter(m =>
    !busca ||
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (m.profissional?.especialidade.toLowerCase().includes(busca.toLowerCase()) ?? false)
  )

  const equipe = filtrados.filter(m => EQUIPE_PAPEIS.includes(m.papel))
  const equipeMedica = filtrados.filter(m => EQUIPE_MEDICA_PAPEIS.includes(m.papel))

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

  function setE<K extends keyof typeof editForm>(k: K, v: string) {
    setEditForm(f => ({ ...f, [k]: v }))
  }

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

  function toggleServico(id: string) {
    setServicosSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
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
    setServicosSelecionados([])
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

  function proximoStep2() {
    if (especialidades.length === 0) { setErro('Selecione pelo menos uma especialidade.'); return }
    setErro(null); setStep(3)
  }

  async function cadastrar() {
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
      body: JSON.stringify({ clinicaId, ...form, foto_url, especialidade: especialidades.join(', '), emailJaExiste, servicoIds: servicosSelecionados }),
    })

    const json = await res.json()

    if (!res.ok) {
      setErro(json.error ?? 'Erro ao cadastrar profissional.')
      setSalvando(false)
      return
    }

    setMembros(prev => [...prev, json as MembroEquipe].sort((a, b) => a.nome.localeCompare(b.nome)))
    setSalvando(false)
    setModal(false)
  }

  function abrirModalEditar(m: MembroEquipe) {
    setEditForm({
      nome: m.nome,
      papel: m.papel,
      especialidade: m.profissional?.especialidade ?? '',
      registroProfissional: m.profissional?.registroProfissional ?? '',
      status: m.profissional ? m.profissional.status : m.statusMembro,
    })
    setErroEdicao(null)
    setModalEditar(m)
  }

  async function salvarEdicaoMembro() {
    if (!modalEditar) return
    if (!editForm.nome.trim()) {
      setErroEdicao('Nome é obrigatório.')
      return
    }
    setErroEdicao(null)
    setSalvandoEdicao(true)

    const res = await fetch(`/api/membros/${modalEditar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: editForm.nome,
        papel: editForm.papel,
        especialidade: editForm.especialidade,
        registroProfissional: editForm.registroProfissional || null,
        status: editForm.status,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErroEdicao(json.error ?? 'Erro ao salvar as alterações.')
      setSalvandoEdicao(false)
      return
    }

    const atualizado: MembroEquipe = await res.json()
    setMembros(prev => prev.map(m => m.id === atualizado.id ? atualizado : m).sort((a, b) => a.nome.localeCompare(b.nome)))
    setSalvandoEdicao(false)
    setModalEditar(null)
  }

  async function excluirMembro() {
    if (!modalEditar) return
    if (!confirm(`Remover "${modalEditar.nome}" da equipe? Esta ação não pode ser desfeita.`)) return
    setExcluindo(true)

    const res = await fetch(`/api/membros/${modalEditar.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Erro ao remover da equipe.')
      setExcluindo(false)
      return
    }

    setMembros(prev => prev.filter(m => m.id !== modalEditar.id))
    setExcluindo(false)
    setModalEditar(null)
  }

  function renderCard(m: MembroEquipe, idx: number, contexto: 'equipe' | 'medica') {
    const subtitulo = contexto === 'medica' && m.profissional
      ? `${m.profissional.especialidade}${m.profissional.registroProfissional ? ` • ${m.profissional.registroProfissional}` : ''}`
      : (PAPEL_LABELS[m.papel] ?? m.papel)

    const indicador = m.profissional ? (STATUS_INDICATOR[m.profissional.status] ?? 'bg-gray-400') : (STATUS_MEMBRO_INDICATOR[m.statusMembro] ?? 'bg-gray-400')

    return (
      <div key={`${contexto}-${m.id}`} onClick={() => abrirModalEditar(m)} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.nome} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-full ${CORES[idx % CORES.length]} flex items-center justify-center text-white text-xl font-bold`}>
                {iniciais(m.nome)}
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${indicador}`} />
          </div>
          <h3 className="text-[14px] font-semibold text-primary">{m.nome}</h3>
          <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{subtitulo}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          {m.profissional ? (
            <span className={STATUS_STYLES[m.profissional.status] ?? 'badge-neutral'}>{STATUS_LABELS[m.profissional.status] ?? m.profissional.status}</span>
          ) : (
            <span className={STATUS_MEMBRO_BADGE[m.statusMembro] ?? 'badge-neutral'}>{STATUS_MEMBRO_LABELS[m.statusMembro] ?? m.statusMembro}</span>
          )}
          {contexto === 'medica' && (
            <span className="text-[11px] text-[#9CA3AF] font-medium truncate">{PAPEL_LABELS[m.papel] ?? m.papel}</span>
          )}
        </div>
        <button className="mt-3 w-full flex items-center justify-center gap-1 text-[12px] text-[#9CA3AF] hover:text-primary transition-colors">
          Ver detalhes <ChevronRight size={14} />
        </button>
      </div>
    )
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

      {/* Equipe */}
      <div className="space-y-3">
        <h2 className="text-h3 text-[#1A1A2E]">Equipe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipe.map((m, idx) => renderCard(m, idx, 'equipe'))}
          {equipe.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#9CA3AF]">Nenhum membro encontrado</div>
          )}
        </div>
      </div>

      {/* Equipe Médica */}
      <div className="space-y-3">
        <h2 className="text-h3 text-[#1A1A2E]">Equipe Médica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipeMedica.map((m, idx) => renderCard(m, idx, 'medica'))}
          {equipeMedica.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#9CA3AF]">Nenhum profissional encontrado</div>
          )}
        </div>
      </div>

      {/* Modal Novo Profissional */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF] flex-shrink-0">
              <div>
                <h2 className="text-h3 text-[#1A1A2E]">
                  {step === 1 ? 'Dados do Profissional' : step === 2 ? 'Especialidades' : 'Serviços'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="h-1.5 w-14 rounded-full bg-primary" />
                  <div className={`h-1.5 w-14 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-[#E5E7EB]'}`} />
                  <div className={`h-1.5 w-14 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-[#E5E7EB]'}`} />
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

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#9CA3AF]">
                    Selecione os serviços que este profissional realiza. Se nenhum for selecionado, todos os serviços da clínica ficarão disponíveis para ele na agenda.
                  </p>
                  {servicos.length === 0 ? (
                    <p className="text-[12px] text-[#9CA3AF] italic">Nenhum serviço cadastrado na clínica.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {servicos.map(s => {
                        const sel = servicosSelecionados.includes(s.id)
                        return (
                          <button
                            key={s.id} type="button" onClick={() => toggleServico(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                              sel ? 'bg-primary text-white border-primary' : 'bg-white text-[#444654] border-[#E5E7EB] hover:border-primary hover:text-primary'
                            }`}
                          >
                            {sel && <Check size={11} />}{s.nome}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {servicosSelecionados.length > 0 && (
                    <p className="text-[12px] text-primary font-semibold">
                      {servicosSelecionados.length} serviço(s) selecionado(s)
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
              {step > 1 ? (
                <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                  <ArrowLeft size={14} /> Voltar
                </button>
              ) : (
                <button onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                  Cancelar
                </button>
              )}
              {step === 1 && (
                <button onClick={proximo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Próximo <ArrowRight size={14} />
                </button>
              )}
              {step === 2 && (
                <button onClick={proximoStep2}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Próximo <ArrowRight size={14} />
                </button>
              )}
              {step === 3 && (
                <button onClick={cadastrar} disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                  {salvando ? 'Cadastrando...' : 'Cadastrar Profissional'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Membro */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#F0F2FF]">
              <h2 className="text-h3 text-[#1A1A2E]">Editar Membro</h2>
              <button onClick={() => setModalEditar(null)} className="text-[#9CA3AF] hover:text-[#444654]">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Nome *</label>
                  <input value={editForm.nome} onChange={e => setE('nome', e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#444654] mb-1">Cargo</label>
                  <select value={editForm.papel} onChange={e => setE('papel', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                  >
                    {PAPEL_OPTIONS.map(p => <option key={p} value={p}>{PAPEL_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>

              {modalEditar.profissional && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#444654] mb-1">Especialidade</label>
                    <input value={editForm.especialidade} onChange={e => setE('especialidade', e.target.value)}
                      placeholder="Especialidade"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#444654] mb-1">Registro (CRM)</label>
                    <input value={editForm.registroProfissional} onChange={e => setE('registroProfissional', e.target.value)}
                      placeholder="CRM/SP 000000"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-[#444654] mb-1">Status</label>
                <select value={editForm.status} onChange={e => setE('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-primary bg-white"
                >
                  {modalEditar.profissional
                    ? Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)
                    : Object.entries(STATUS_MEMBRO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {erroEdicao && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-700">
                  {erroEdicao}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-[#F0F2FF]">
              <button onClick={excluirMembro} disabled={excluindo || salvandoEdicao}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60">
                <Trash2 size={14} /> {excluindo ? 'Removendo...' : 'Excluir'}
              </button>
              <button onClick={() => setModalEditar(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-lg hover:bg-[#F0F2FF] transition-colors">
                Cancelar
              </button>
              <button onClick={salvarEdicaoMembro} disabled={salvandoEdicao || excluindo}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
                {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
