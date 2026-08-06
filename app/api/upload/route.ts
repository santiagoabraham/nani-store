import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Magic-byte signatures for allowed image types.
// Validates actual file content, not just the Content-Type header.
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 8) return false
  switch (mimeType) {
    case 'image/jpeg':
      // FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case 'image/png':
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 && buffer[1] === 0x50 &&
        buffer[2] === 0x4e && buffer[3] === 0x47 &&
        buffer[4] === 0x0d && buffer[5] === 0x0a &&
        buffer[6] === 0x1a && buffer[7] === 0x0a
      )
    case 'image/webp':
      // RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
      return (
        buffer[0] === 0x52 && buffer[1] === 0x49 &&
        buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer.length >= 12 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 &&
        buffer[10] === 0x42 && buffer[11] === 0x50
      )
    case 'image/gif':
      // GIF87a or GIF89a
      return (
        buffer[0] === 0x47 && buffer[1] === 0x49 &&
        buffer[2] === 0x46 && buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
      )
    default:
      return false
  }
}

export async function POST(request: NextRequest) {
  // 1. Require an authenticated admin session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Fetch role AND tenant_id — we need tenant_id for storage path isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.tenant_id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const tenantId: string = profile.tenant_id

  // 2. Validate file presence and MIME type whitelist
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usá JPG, PNG o WEBP.' }, { status: 400 })
  }

  // 3. Read buffer and validate magic bytes (prevents Content-Type spoofing)
  const buffer = Buffer.from(await file.arrayBuffer())

  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: 'El contenido del archivo no coincide con el tipo declarado.' },
      { status: 400 }
    )
  }

  // 4. Sanitise filename and build tenant-isolated storage path.
  //    Files are stored under products/{tenantId}/ so each tenant's images
  //    are in a separate namespace — no cross-tenant collision or enumeration.
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  const filename  = `${base}-${Date.now()}.${ext}`
  const storagePath = `${tenantId}/${filename}` // tenant-isolated path

  const service = createServiceClient()

  const { error: uploadErr } = await service.storage
    .from('products')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) {
    console.error('[upload] Supabase Storage error:', uploadErr)
    return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage
    .from('products')
    .getPublicUrl(storagePath)

  return NextResponse.json({ url: publicUrl })
}
