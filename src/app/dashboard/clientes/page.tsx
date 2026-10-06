import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { redirect } from 'next/navigation';
import ClientesContent from './ClientesContent';
import { Suspense } from 'react';

export default async function ClientesPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    redirect('/dashboard');
  }

  // Fetch initial clients
  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId: tenantId,
    },
    orderBy: {
      nome: 'asc',
    },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">Gerencie os clientes da sua empresa.</p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <ClientesContent initialClientes={clientes} />
      </Suspense>
    </div>
  );
}
