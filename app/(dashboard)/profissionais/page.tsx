import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { ProfissionaisClient, type MembroEquipe } from '@/components/profissionais/ProfissionaisClient'

export const metadata = { title: 'Profissionais — ClinicaOS' }
export const dynamic = 'force-dynamic'

export default async function ProfissionaisPage() {
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  const admin = await createAdminClient()

  const { data: membrosClinica } = await admin
    .from('membros_clinica')
    .select('id, usuario_id, papel, status')
    .eq('clinica_id', clinicaId)
    .order('criado_em')

  const usuarioIds = (membrosClinica ?? []).map(m => m.usuario_id)

  const { data: perfis } = usuarioIds.length
    ? await admin.from('perfis_usuario').select('id, nome_completo, email, telefone, avatar_url').in('id', usuarioIds)
    : { data: [] }

  const { data: profissionais } = await admin
    .from('profissionais')
    .select('id, membro_id, nome, especialidade, registro_profissional, foto_url, status')
    .eq('clinica_id', clinicaId)

  const { data: servicos } = await admin
    .from('servicos')
    .select('id, nome')
    .eq('clinica_id', clinicaId)
    .eq('ativo', true)
    .order('nome')

  const membros: MembroEquipe[] = (membrosClinica ?? []).map(m => {
    const perfil = perfis?.find(p => p.id === m.usuario_id)
    const profissional = profissionais?.find(p => p.membro_id === m.id) ?? null
    return {
      id: m.id,
      papel: m.papel,
      statusMembro: m.status,
      nome: profissional?.nome ?? perfil?.nome_completo ?? 'Sem nome',
      email: perfil?.email ?? '',
      telefone: perfil?.telefone ?? null,
      avatarUrl: profissional?.foto_url ?? perfil?.avatar_url ?? null,
      profissional: profissional ? {
        id: profissional.id,
        especialidade: profissional.especialidade,
        registroProfissional: profissional.registro_profissional,
        status: profissional.status,
      } : null,
    }
  })

  return (
    <ProfissionaisClient
      membros={membros}
      servicos={servicos ?? []}
      clinicaId={clinicaId}
    />
  )
}
