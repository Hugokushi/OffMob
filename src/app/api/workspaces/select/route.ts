import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { empresaId } = await req.json()
    if (!empresaId) {
      return NextResponse.json({ error: 'empresaId é obrigatório.' }, { status: 400 })
    }

    // Verificar se usuário tem acesso a esta empresa
    const membership = await prisma.empresaUsuario.findUnique({
      where: {
        usuarioId_empresaId: {
          usuarioId: session.user.id,
          empresaId,
        },
      },
    })

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Acesso negado à empresa.' }, { status: 403 })
    }

    // Atualizar lastAccessAt
    await prisma.empresaUsuario.update({
      where: { id: membership.id },
      data: { lastAccessAt: new Date() },
    })

    // Definir cookie
    const cookieStore = await cookies()
    cookieStore.set('active_tenant_id', empresaId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao selecionar empresa:', error)
    return NextResponse.json({ error: 'Erro ao alternar empresa.' }, { status: 500 })
  }
}
