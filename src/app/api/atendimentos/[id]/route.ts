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

    const existing = await prisma.atendimento.findFirst({
      where: { id: resolvedParams.id, empresaId },
      include: {
        cliente: true,
        servico: true,
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Atendimento not found' }, { status: 404 });
    }

    const json = await req.json();
    const { 
      clienteConfirmado, 
      servicoRealizado, 
      cobrancaGerada, 
      pagamentoRecebido,
      observacoes
    } = json;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.atendimento.update({
        where: { id: resolvedParams.id },
        data: {
          clienteConfirmado: clienteConfirmado !== undefined ? clienteConfirmado : existing.clienteConfirmado,
          servicoRealizado: servicoRealizado !== undefined ? servicoRealizado : existing.servicoRealizado,
          cobrancaGerada: cobrancaGerada !== undefined ? cobrancaGerada : existing.cobrancaGerada,
          pagamentoRecebido: pagamentoRecebido !== undefined ? pagamentoRecebido : existing.pagamentoRecebido,
          observacoes: observacoes !== undefined ? observacoes : existing.observacoes,
        },
        include: {
          cliente: true,
          servico: true,
        }
      });

      if (cobrancaGerada && !existing.cobrancaGerada) {
        await tx.cobranca.create({
          data: {
            empresaId,
            clienteId: existing.clienteId,
            valor: existing.valor,
            dataVencimento: existing.dataAtendimento,
            status: pagamentoRecebido ? 'PAGA' : 'PENDENTE',
            descricao: `Atendimento: ${existing.servico?.nome || 'Desconhecido'}`
          }
        });
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating atendimento:', error);
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

    const existing = await prisma.atendimento.findFirst({
      where: { id: resolvedParams.id, empresaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Atendimento not found' }, { status: 404 });
    }

    await prisma.atendimento.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting atendimento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
