import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { ServicosContent } from './ServicosContent';
import { redirect } from 'next/navigation';

export default async function ServicosPage() {
  const empresaId = await getCurrentTenantId();
  if (!empresaId) {
    redirect('/login');
  }

  const [servicos, atendimentos, clientes] = await Promise.all([
    prisma.servicoCatalogo.findMany({
      where: { empresaId },
      orderBy: { nome: 'asc' },
    }),
    prisma.atendimento.findMany({
      where: { empresaId },
      include: {
        cliente: true,
        servico: true,
      },
      orderBy: { dataAtendimento: 'desc' },
    }),
    prisma.cliente.findMany({
      where: { empresaId },
      orderBy: { nome: 'asc' },
    }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
      </div>
      <Suspense fallback={<div>Carregando...</div>}>
        <ServicosContent 
          initialServicos={servicos} 
          initialAtendimentos={atendimentos}
          clientes={clientes}
        />
      </Suspense>
    </div>
  );
}
