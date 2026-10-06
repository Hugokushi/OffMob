import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { auth } from './auth'

export async function getCurrentTenantId(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieTenantId = cookieStore.get('active_tenant_id')?.value

  if (cookieTenantId) return cookieTenantId

  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.empresaUsuario.findFirst({
    where: { usuarioId: session.user.id, status: 'ACTIVE' },
    orderBy: { lastAccessAt: 'desc' },
    select: { empresaId: true },
  })

  return membership?.empresaId ?? null
}

export async function getCurrentTenant() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return null

  return prisma.empresa.findUnique({ where: { id: tenantId } })
}

export function getTenantDb(empresaId: string) {
  return {
    empresaId,
    convite: {
      findMany: (args?: object) =>
        prisma.convite.findMany({ ...args, where: { ...((args as any)?.where ?? {}), empresaId } }),
      findFirst: (args?: object) =>
        prisma.convite.findFirst({ ...args, where: { ...((args as any)?.where ?? {}), empresaId } }),
      create: (args: any) =>
        prisma.convite.create({ ...args, data: { ...args.data, empresaId } }),
      update: (args: any) => prisma.convite.update(args),
      delete: (args: any) => prisma.convite.delete(args),
    },
    empresaUsuario: {
      findMany: (args?: object) =>
        prisma.empresaUsuario.findMany({ ...args, where: { ...((args as any)?.where ?? {}), empresaId } }),
      findFirst: (args?: object) =>
        prisma.empresaUsuario.findFirst({ ...args, where: { ...((args as any)?.where ?? {}), empresaId } }),
      create: (args: any) =>
        prisma.empresaUsuario.create({ ...args, data: { ...args.data, empresaId } }),
      update: (args: any) => prisma.empresaUsuario.update(args),
      delete: (args: any) => prisma.empresaUsuario.delete(args),
    },
  }
}

export async function checkSubscriptionGuard(empresaId: string): Promise<{
  allowed: boolean
  reason?: 'TRIAL_EXPIRED' | 'CANCELED' | 'PAST_DUE'
}> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { status: true, trialExpiresAt: true },
  })

  if (!empresa) return { allowed: false, reason: 'CANCELED' }
  if (empresa.status === 'ACTIVE') return { allowed: true }

  if (empresa.status === 'TRIAL') {
    if (empresa.trialExpiresAt && empresa.trialExpiresAt < new Date()) return { allowed: false, reason: 'TRIAL_EXPIRED' }
    return { allowed: true }
  }

  if (empresa.status === 'PAST_DUE') return { allowed: false, reason: 'PAST_DUE' }
  return { allowed: false, reason: 'CANCELED' }
}

