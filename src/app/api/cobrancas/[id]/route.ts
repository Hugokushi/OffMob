import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function PUT(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    const body = await request.json();
    const { status, dataPagamento, valorPago, descricao, valor, dataVencimento, clienteId } = body;

    // Verify if the cobranca belongs to the tenant
    const existingCobranca = await prisma.cobranca.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId,
      },
    });

    if (!existingCobranca) {
      return NextResponse.json(
        { error: 'Cobrança não encontrada ou não pertence a esta empresa' },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (dataPagamento !== undefined) dataToUpdate.dataPagamento = dataPagamento ? new Date(dataPagamento) : null;
    if (valorPago !== undefined) dataToUpdate.valorPago = valorPago ? Number(valorPago) : null;
    if (descricao) dataToUpdate.descricao = descricao;
    if (valor !== undefined) dataToUpdate.valor = Number(valor);
    if (dataVencimento) dataToUpdate.dataVencimento = new Date(dataVencimento);
    if (clienteId !== undefined) dataToUpdate.clienteId = clienteId || null;

    const updatedCobranca = await prisma.cobranca.update({
      where: {
        id: resolvedParams.id,
      },
      data: dataToUpdate,
      include: {
        cliente: true,
      }
    });

    return NextResponse.json(updatedCobranca);
  } catch (error: any) {
    console.error('Erro ao atualizar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cobrança' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    // Verify if the cobranca belongs to the tenant
    const existingCobranca = await prisma.cobranca.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId,
      },
    });

    if (!existingCobranca) {
      return NextResponse.json(
        { error: 'Cobrança não encontrada ou não pertence a esta empresa' },
        { status: 404 }
      );
    }

    await prisma.cobranca.delete({
      where: {
        id: resolvedParams.id,
      },
    });

    return NextResponse.json({ message: 'Cobrança excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir cobrança:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cobrança' },
      { status: 500 }
    );
  }
}
