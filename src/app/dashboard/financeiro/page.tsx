import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { redirect } from 'next/navigation';
import FinanceiroContent from './FinanceiroContent';

export const metadata = {
  title: 'Financeiro | Off Mob',
};

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth');
  }

  const empresaId = await getCurrentTenantId();
  if (!empresaId) {
    redirect('/dashboard');
  }

  // Fetch initial data
  const cobrancas = await prisma.cobranca.findMany({
    where: {
      empresaId,
    },
    include: {
      cliente: true,
    },
    orderBy: {
      dataVencimento: 'desc',
    },
  });

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, cpf: true },
  });

  return <FinanceiroContent initialCobrancas={cobrancas} clientes={clientes} />;
}
