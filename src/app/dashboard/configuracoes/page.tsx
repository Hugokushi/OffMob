import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import ConfiguracoesContent from './ConfiguracoesContent';
import { Suspense } from 'react';

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth');
  }

  const empresaId = await getCurrentTenantId();
  if (!empresaId) {
    redirect('/dashboard');
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    redirect('/dashboard');
  }

  const usuarios = await prisma.empresaUsuario.findMany({
    where: { empresaId },
    include: {
      usuario: true,
    },
    orderBy: { joinedAt: 'asc' },
  });

  const currentUser = usuarios.find((u) => u.usuarioId === session.user?.id as string);

  const funcionarios = await prisma.funcionario.findMany({
    where: { empresaId },
    orderBy: { nome: 'asc' },
  });

  if (!currentUser) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie os dados, aparência e equipe da sua empresa.</p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <ConfiguracoesContent
          initialEmpresa={empresa}
          initialUsuarios={usuarios}
          currentUser={currentUser}
          initialFuncionarios={funcionarios}
        />
      </Suspense>
    </div>
  );
}
