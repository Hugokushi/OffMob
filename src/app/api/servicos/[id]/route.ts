import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { nome, descricao, preco, duracaoMinutos, status } = json;

    const existing = await prisma.servicoCatalogo.findFirst({
      where: { id: resolvedParams.id, empresaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const updated = await prisma.servicoCatalogo.update({
      where: { id: resolvedParams.id },
      data: {
        nome,
        descricao,
        preco: preco !== undefined ? Number(preco) : undefined,
        duracaoMinutos: duracaoMinutos !== undefined ? Number(duracaoMinutos) : undefined,
        status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.servicoCatalogo.findFirst({
      where: { id: resolvedParams.id, empresaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await prisma.servicoCatalogo.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
