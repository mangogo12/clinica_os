import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ exists: false })

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('perfis_usuario')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  return NextResponse.json({ exists: !!data })
}
