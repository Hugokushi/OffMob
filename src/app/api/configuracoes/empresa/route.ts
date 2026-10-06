import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { hasPermission } from '@/lib/permissions';

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    const membership = await prisma.empresaUsuario.findUnique({ where: { usuarioId_empresaId: { usuarioId: session.user?.id as string, empresaId } } });
    const permissaoOk = membership && (membership.isOwner || hasPermission(membership.permissoes as any, 'configuracoes', 'editar'));
    if (!permissaoOk) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, nomeFantasia, cnpj, email, telefone, plano } = body;

    // If plano is being updated, verify owner-only access and compute limits
    if (plano && !membership.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode alterar o plano.' }, { status: 403 });
    }

    const PLAN_LIMITS_MAP: Record<string, { maxUsers: number; valorMensal: number }> = {
      FREE: { maxUsers: 2, valorMensal: 0 },
      SECUNDARIO: { maxUsers: 5, valorMensal: 30 },
      PRO: { maxUsers: 20, valorMensal: 50 },
      FULL: { maxUsers: 100, valorMensal: 100 },
    };

    const planData = plano && PLAN_LIMITS_MAP[plano]
      ? { plano, maxUsers: PLAN_LIMITS_MAP[plano].maxUsers, valorMensal: PLAN_LIMITS_MAP[plano].valorMensal }
      : {};

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        ...(nome !== undefined && { nome }),
        ...(nomeFantasia !== undefined && { nomeFantasia }),
        ...(cnpj !== undefined && { cnpj }),
        ...(email !== undefined && { email }),
        ...(telefone !== undefined && { telefone }),
        ...planData,
      },
    });

    return NextResponse.json(empresaAtualizada);
  } catch (error) {
    console.error('[CONFIGURACOES_EMPRESA_PUT]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
