import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { hasPermission } from '@/lib/permissions';

export async function PUT(
  req: Request,
  { params }: { params: any }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { role, permissoes } = body;

    const empresaUsuario = await prisma.empresaUsuario.findUnique({
      where: { id },
    });

    if (!empresaUsuario || empresaUsuario.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (empresaUsuario.isOwner) {
      return NextResponse.json({ error: 'Não é possível alterar as permissões do proprietário.' }, { status: 400 });
    }

    const updated = await prisma.empresaUsuario.update({
      where: { id },
      data: {
        role: role !== undefined ? role : empresaUsuario.role,
        permissoes: permissoes !== undefined ? permissoes : empresaUsuario.permissoes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CONFIGURACOES_USUARIOS_ID_PUT]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: any }
) {
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

    const { id } = await params;

    const empresaUsuario = await prisma.empresaUsuario.findUnique({
      where: { id },
    });

    if (!empresaUsuario || empresaUsuario.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (empresaUsuario.isOwner) {
      return NextResponse.json({ error: 'Não é possível excluir o proprietário.' }, { status: 400 });
    }

    if (empresaUsuario.usuarioId === session.user?.id as string) {
       return NextResponse.json({ error: 'Você não pode excluir a si mesmo.' }, { status: 400 });
    }

    await prisma.empresaUsuario.delete({
      where: { id },
    });

    // Check if the user has other memberships
    const count = await prisma.empresaUsuario.count({
      where: { usuarioId: empresaUsuario.usuarioId },
    });

    if (count === 0) {
      await prisma.usuario.delete({
        where: { id: empresaUsuario.usuarioId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONFIGURACOES_USUARIOS_ID_DELETE]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
