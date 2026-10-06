import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import WorkspacesList from './WorkspacesList'

export default async function WorkspacesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth')
  }

  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  const memberships: any = await prisma.empresaUsuario.findMany({
    where: {
      usuarioId: session.user.id,
      status: 'ACTIVE',
    },
    include: {
      empresa: true,
    },
    orderBy: {
      lastAccessAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <WorkspacesList
          memberships={memberships}
          activeTenantId={activeTenantId || null}
          userName={session.user.name || session.user.email || 'Usuário'}
        />
      </div>
    </div>
  )
}
