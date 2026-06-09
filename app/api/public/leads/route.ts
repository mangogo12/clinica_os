import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clinicaId, nome, telefone, email, servicoId, profissionalId, mensagem } = body

  if (!clinicaId || !nome || !telefone) {
    return NextResponse.json({ error: 'Campos obrigatórios: clinicaId, nome, telefone' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { error } = await supabase.from('leads').insert({
    clinica_id: clinicaId,
    nome,
    telefone,
    email: email || null,
    servico_id: servicoId || null,
    profissional_id: profissionalId || null,
    mensagem: mensagem || null,
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
