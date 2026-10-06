import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentTenant, getCurrentTenantId } from '@/lib/tenant-db'
import { prisma } from '@/lib/prisma'
import Sidebar from './Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth')
  }

  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    redirect('/workspaces')
  }

  const empresa = await getCurrentTenant()
  if (!empresa) {
    redirect('/workspaces')
  }

  const membership = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: tenantId,
      },
    },
  })

  if (!membership) {
    redirect('/workspaces')
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <script dangerouslySetInnerHTML={{ __html: `if ('${empresa.tema}' === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');` }} />
      <Sidebar
        empresa={{
          id: empresa.id,
          nome: empresa.nome,
          logoUrl: empresa.logoUrl,
          plano: empresa.plano,
        }}
        membership={{
          role: membership.role,
          isOwner: membership.isOwner,
          permissoes: membership.permissoes,
        }}
        userName={session.user.name || 'Usuário'}
      />
      <main className="flex-1 overflow-y-auto bg-background text-foreground">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
