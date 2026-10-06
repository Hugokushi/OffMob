import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { redirect } from 'next/navigation';
import AgendaContent from './AgendaContent';

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const empresaId = await getCurrentTenantId();
  if (!empresaId) {
    redirect('/dashboard');
  }

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' }
  });

  const servicos = await prisma.servicoCatalogo.findMany({
    where: { empresaId },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
      </div>
      <div className="h-full flex-1 flex-col space-y-8 flex">
        <AgendaContent clientes={clientes} servicos={servicos} />
      </div>
    </div>
  );
}
