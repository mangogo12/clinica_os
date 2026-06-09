import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient, type AgendamentoItem } from '@/components/dashboard/DashboardClient'

export const metadata = { title: 'Dashboard — ClinicaOS' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const inicioHoje = `${hojeStr}T00:00:00`
  const fimHoje = `${hojeStr}T23:59:59`
  const inicioMes = `${hojeStr.substring(0, 7)}-01T00:00:00`

  // 7 dias para o gráfico
  const d7 = new Date(hoje)
  d7.setDate(hoje.getDate() - 6)
  const inicio7dias = d7.toISOString().split('T')[0]

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: agendamentosHoje },
    { data: agendamentosRecentes },
    { data: faturamentoMes },
    { count: totalAgMes },
    { count: faltasMes },
    { count: novosPacientes },
    { data: transacoes7dias },
    { data: perfilUser },
    { data: membroUser },
  ] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('id, data_hora_inicio, data_hora_fim, status, paciente:pacientes(nome), profissional:profissionais(nome), servico:servicos(nome)')
      .eq('clinica_id', clinicaId)
      .gte('data_hora_inicio', inicioHoje)
      .lte('data_hora_inicio', fimHoje)
      .order('data_hora_inicio'),

    supabase
      .from('agendamentos')
      .select('id, data_hora_inicio, status, paciente:pacientes(nome), profissional:profissionais(nome), servico:servicos(nome, preco)')
      .eq('clinica_id', clinicaId)
      .order('data_hora_inicio', { ascending: false })
      .limit(5),

    supabase
      .from('transacoes')
      .select('valor')
      .eq('clinica_id', clinicaId)
      .eq('tipo', 'entrada')
      .eq('status', 'confirmado')
      .gte('data_transacao', inicioMes.split('T')[0]),

    supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('data_hora_inicio', inicioMes),

    supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .eq('status', 'falta')
      .gte('data_hora_inicio', inicioMes),

    supabase
      .from('pacientes')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('criado_em', inicioMes),

    supabase
      .from('transacoes')
      .select('valor, data_transacao')
      .eq('clinica_id', clinicaId)
      .eq('tipo', 'entrada')
      .eq('status', 'confirmado')
      .gte('data_transacao', inicio7dias),

    supabase
      .from('perfis_usuario')
      .select('nome_completo, avatar_url')
      .eq('id', user!.id)
      .single(),

    supabase
      .from('membros_clinica')
      .select('papel')
      .eq('clinica_id', clinicaId)
      .eq('usuario_id', user!.id)
      .single(),
  ])

  const totalFaturamento = (faturamentoMes ?? []).reduce((acc, t) => acc + Number(t.valor), 0)
  const taxaFaltas = totalAgMes ? Math.round(((faltasMes ?? 0) / totalAgMes) * 100) : 0

  // Montar chartData dos últimos 7 dias
  const diasSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() - 6 + i)
    const dateStr = d.toISOString().split('T')[0]
    const receita = (transacoes7dias ?? [])
      .filter(t => t.data_transacao === dateStr)
      .reduce((sum, t) => sum + Number(t.valor), 0)
    return { dia: diasSemanaAbrev[d.getDay()], receita }
  })

  return (
    <DashboardClient
      agendamentosHoje={(agendamentosHoje ?? []) as unknown as AgendamentoItem[]}
      agendamentosRecentes={(agendamentosRecentes ?? []) as unknown as AgendamentoItem[]}
      chartData={chartData}
      nomeUsuario={perfilUser?.nome_completo ?? user?.email?.split('@')[0] ?? 'Usuário'}
      papelUsuario={membroUser?.papel ?? 'admin'}
      kpis={{
        agendamentosHoje: agendamentosHoje?.length ?? 0,
        faturamentoMes: totalFaturamento,
        taxaFaltas,
        novosPacientes: novosPacientes ?? 0,
      }}
    />
  )
}
