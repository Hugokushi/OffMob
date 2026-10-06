import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';
import { hasPermission, PLAN_LIMITS, getDefaultPermissions, PlanoType } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    const usuarios = await prisma.empresaUsuario.findMany({
      where: { empresaId },
      include: {
        usuario: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('[CONFIGURACOES_USUARIOS_GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const permissaoOk = membership && (membership.isOwner || hasPermission(membership.permissoes as any, 'configuracoes', 'criar'));
    if (!permissaoOk) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const plan = (empresa.plano as PlanoType) || 'FREE';
    const limit = PLAN_LIMITS[plan].maxUsers;

    const count = await prisma.empresaUsuario.count({
      where: { empresaId },
    });

    if (count >= limit) {
      return NextResponse.json({ error: 'Limite de usuários atingido para o plano atual.' }, { status: 403 });
    }

    const body = await req.json();
    const { nome, login, senha, cargo } = body;

    if (!nome || !login || !senha || !cargo) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Check if login already exists globally
    const existingUser = await prisma.usuario.findUnique({
      where: { email: login },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este usuário/login já está em uso.' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const defaultPerms = getDefaultPermissions();

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email: login,
        senhaHash,
        empresas: {
          create: {
            empresaId,
            role: cargo,
            isOwner: false,
            permissoes: defaultPerms as any,
          }
        }
      },
      include: {
        empresas: true,
      }
    });

    return NextResponse.json(novoUsuario);
  } catch (error) {
    console.error('[CONFIGURACOES_USUARIOS_POST]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
