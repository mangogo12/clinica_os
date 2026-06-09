import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/login',
  '/api/public',
  '/_next',
  '/favicon.ico',
]

const DASHBOARD_PATHS = ['/dashboard', '/agenda', '/clientes', '/profissionais', '/servicos', '/equipe', '/financeiro', '/configuracoes']

function isDashboardRoute(pathname: string) {
  return DASHBOARD_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clinicaos.com.br'

  // Resolver subdomínio
  const hostSemPorta = host.split(':')[0]
  let subdominio: string | null = null
  if (hostSemPorta.endsWith(`.${appDomain}`)) {
    subdominio = hostSemPorta.replace(`.${appDomain}`, '')
  } else if (hostSemPorta.endsWith('.localhost')) {
    subdominio = hostSemPorta.replace('.localhost', '')
  }

  // Rotas públicas e assets — deixar passar
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Subdomínio detectado → rota pública da clínica
  if (subdominio && !isDashboardRoute(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-subdominio', subdominio)
    return response
  }

  // Dashboard → exige autenticação
  const { supabaseResponse, user } = await updateSession(request)

  if (isDashboardRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Injetar clinica_id do cookie seguro
  const clinicaId = request.cookies.get('clinica_id')?.value
  if (clinicaId) {
    supabaseResponse.headers.set('x-clinica-id', clinicaId)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
