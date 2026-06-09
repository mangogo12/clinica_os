import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value
  if (!clinicaId) return NextResponse.json({ diasTrabalhados: 0, pacientesAtendidos: 0 })

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  // Buscar profissional vinculado a este usuário nesta clínica
  const { data: membro } = await supabase
    .from('membros_clinica')
    .select('id')
    .eq('clinica_id', clinicaId)
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (!membro) return NextResponse.json({ diasTrabalhados: 0, pacientesAtendidos: 0 })

  const { data: profissional } = await supabase
    .from('profissionais')
    .select('id')
    .eq('clinica_id', clinicaId)
    .eq('membro_id', membro.id)
    .maybeSingle()

  if (!profissional) {
    // Admin sem registro de profissional — retorna stats gerais da clínica
    const { count: pacientes } = await supabase
      .from('pacientes')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)

    const { data: agDatas } = await supabase
      .from('agendamentos')
      .select('data_hora_inicio')
      .eq('clinica_id', clinicaId)
      .eq('status', 'concluido')

    const diasUnicos = new Set((agDatas ?? []).map(a => a.data_hora_inicio.split('T')[0]))

    return NextResponse.json({
      diasTrabalhados: diasUnicos.size,
      pacientesAtendidos: pacientes ?? 0,
    })
  }

  // Stats do profissional específico
  const { data: agendamentosConcluidos } = await supabase
    .from('agendamentos')
    .select('data_hora_inicio, paciente_id')
    .eq('clinica_id', clinicaId)
    .eq('profissional_id', profissional.id)
    .eq('status', 'concluido')

  const diasUnicos = new Set((agendamentosConcluidos ?? []).map(a => a.data_hora_inicio.split('T')[0]))
  const pacientesUnicos = new Set((agendamentosConcluidos ?? []).map(a => a.paciente_id))

  return NextResponse.json({
    diasTrabalhados: diasUnicos.size,
    pacientesAtendidos: pacientesUnicos.size,
  })
}
