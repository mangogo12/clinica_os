import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) redirect('/selecionar-clinica')

  // Setar contexto RLS
  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  // Carregar dados da sessão
  const [{ data: membro }, { data: clinica }, { data: perfil }] = await Promise.all([
    supabase
      .from('membros_clinica')
      .select('papel')
      .eq('clinica_id', clinicaId)
      .eq('usuario_id', user.id)
      .eq('status', 'ativo')
      .single(),
    supabase
      .from('clinicas')
      .select('nome, subdominio, plano, configuracoes')
      .eq('id', clinicaId)
      .single(),
    supabase
      .from('perfis_usuario')
      .select('nome_completo, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  if (!membro || !clinica) redirect('/selecionar-clinica')

  // Verificar trial expirado — bloquear acesso ao dashboard
  const trialExpiresAt = (clinica.configuracoes as any)?.trial_expires_at
  if (clinica.plano === 'starter' && trialExpiresAt) {
    if (new Date(trialExpiresAt) < new Date()) {
      redirect('/plano-expirado')
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2FF]">
      <Sidebar
        nomeClinica={clinica.nome}
        nomeUsuario={perfil?.nome_completo ?? user.email?.split('@')[0] ?? 'Usuário'}
        papelUsuario={membro.papel}
        avatarUrl={perfil?.avatar_url ?? undefined}
        userId={user.id}
      />
      <div className="ml-[260px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
