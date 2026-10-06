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
    const { corPrimaria, corSecundaria, logoUrl, tema } = body;

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        corPrimaria,
        corSecundaria,
        logoUrl,
        tema: tema || 'light',
      },
    });

    return NextResponse.json(empresaAtualizada);
  } catch (error) {
    console.error('[CONFIGURACOES_PERSONALIZACAO_PUT]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
