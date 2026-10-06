import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId: tenantId,
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { nome, cpf, telefone, email, categoria, status } = body;

    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId: tenantId,
      },
    });

    if (!clienteExistente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    if (!nome) {
      return NextResponse.json(
        { error: 'O nome é obrigatório' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.update({
      where: {
        id: resolvedParams.id,
      },
      data: {
        nome,
        cpf,
        telefone,
        email,
        categoria,
        status,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId: tenantId,
      },
    });

    if (!clienteExistente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    await prisma.cliente.delete({
      where: {
        id: resolvedParams.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    );
  }
}
