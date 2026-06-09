import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { FinanceiroClient, type Transacao } from '@/components/financeiro/FinanceiroClient'
import { registrarAuditoria } from '@/lib/auditoria'

export const metadata = { title: 'Financeiro â€” ClinicaOS' }

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const clinicaId = cookieStore.get('clinica_id')?.value ?? ''
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.rpc('set_clinica_id', { p_clinica_id: clinicaId })

  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: transacoes }, { data: contas }] = await Promise.all([
    supabase
      .from('transacoes')
      .select(`
        id, tipo, descricao, valor, categoria, status, data_transacao,
        paciente:pacientes(id, nome)
      `)
      .eq('clinica_id', clinicaId)
      .gte('data_transacao', inicioMes)
      .order('data_transacao', { ascending: false })
      .limit(50),

    supabase
      .from('contas_vencer')
      .select('*')
      .eq('clinica_id', clinicaId)
      .eq('pago', false)
      .order('vencimento')
      .limit(10),
  ])

  await registrarAuditoria({
    clinicaId,
    usuarioId: user?.id ?? null,
    acao: 'visualizar_financeiro',
  })

  const entradas = (transacoes ?? []).filter(t => t.tipo === 'entrada' && t.status === 'confirmado')
  const saidas = (transacoes ?? []).filter(t => t.tipo === 'saida' && t.status === 'confirmado')

  return (
    <FinanceiroClient
      transacoes={(transacoes ?? []) as unknown as Transacao[]}
      contas={contas ?? []}
      kpis={{
        entradas: entradas.reduce((acc, t) => acc + Number(t.valor), 0),
        saidas: saidas.reduce((acc, t) => acc + Number(t.valor), 0),
      }}
    />
  )
}

