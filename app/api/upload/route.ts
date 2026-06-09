import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) ?? 'avatars'
  const pathPrefix = (formData.get('path') as string) ?? user.id

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filePath = `${pathPrefix}/${Date.now()}.${ext}`

  const supabase = await createAdminClient()

  // Criar bucket se não existir (ignora erro se já existir)
  await supabase.storage.createBucket(bucket, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5 * 1024 * 1024,
  })

  const arrayBuffer = await file.arrayBuffer()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: true,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return NextResponse.json({ url: publicUrl })
}
