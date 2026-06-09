import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ProfissionaisClient } from '@/components/profissionais/ProfissionaisClient'

export const metadata = { title: 'Profissionais — ClinicaOS' }

export default async function ProfissionaisPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const { data: profissionais, error: errProf } = await supabase
    .from('profissionais')
    .select('id, nome, especialidade, registro_profissional, foto_url, status')
    .eq('clinica_id', clinicaId)
    .order('nome')

  if (errProf) console.error('[profissionais]', errProf.message)

  return (
    <ProfissionaisClient
      profissionais={profissionais ?? []}
      clinicaId={clinicaId}
    />
  )
}
