import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Rotas públicas — não requerem autenticação
  const publicPaths = [
    '/auth',
    '/api/auth',
    '/api/stripe/webhook',
  ]
  const isPublic = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublic) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/auth', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar tenant ativo nas rotas de dashboard
  if (pathname.startsWith('/dashboard')) {
    const tenantId = req.cookies.get('active_tenant_id')?.value
    if (!tenantId) {
      return NextResponse.redirect(new URL('/workspaces', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
