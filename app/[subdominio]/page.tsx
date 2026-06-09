import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { BookingClient } from '@/components/booking/BookingClient'

interface Props {
  params: Promise<{ subdominio: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subdominio } = await params
  const supabase = await createAdminClient()
  const { data: clinica } = await supabase
    .from('clinicas')
    .select('nome')
    .eq('subdominio', subdominio)
    .eq('status', 'ativo')
    .single()

  return {
    title: clinica ? `Agendar — ${clinica.nome}` : 'Agendamento Online',
  }
}

export default async function BookingPage({ params }: Props) {
  const { subdominio } = await params
  const supabase = await createAdminClient()

  const { data: clinica } = await supabase
    .from('clinicas')
    .select('id, nome, subdominio, logo_url, email, telefone')
    .eq('subdominio', subdominio)
    .eq('status', 'ativo')
    .single()

  if (!clinica) notFound()

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase
      .from('servicos')
      .select('id, nome, descricao, duracao_minutos, preco, icone, popular')
      .eq('clinica_id', clinica.id)
      .eq('ativo', true)
      .order('popular', { ascending: false }),
    supabase
      .from('profissionais')
      .select('id, nome, especialidade, foto_url')
      .eq('clinica_id', clinica.id)
      .eq('status', 'ativo')
      .order('nome'),
  ])

  return (
    <BookingClient
      clinica={clinica}
      servicos={servicos ?? []}
      profissionais={profissionais ?? []}
    />
  )
}
