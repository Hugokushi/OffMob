import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function GET(req: Request) {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const atendimentos = await prisma.atendimento.findMany({
      where: { empresaId },
      include: {
        cliente: true,
        servico: true,
      },
      orderBy: { dataAtendimento: 'desc' },
    });

    return NextResponse.json(atendimentos);
  } catch (error) {
    console.error('Error fetching atendimentos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { clienteId, servicoId, dataAtendimento, valor, observacoes, lembrarNaAgenda } = json;

    if (!clienteId || !servicoId || !dataAtendimento || valor === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, empresaId }
    });
    const servico = await prisma.servicoCatalogo.findFirst({
      where: { id: servicoId, empresaId }
    });

    if (!cliente || !servico) {
      return NextResponse.json({ error: 'Cliente or Servico not found' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const novoAtendimento = await tx.atendimento.create({
        data: {
          empresaId,
          clienteId,
          servicoId,
          dataAtendimento: new Date(dataAtendimento),
          valor: Number(valor),
          observacoes: observacoes || '',
          lembrarNaAgenda: !!lembrarNaAgenda,
          clienteConfirmado: false,
          servicoRealizado: false,
          cobrancaGerada: true,
          pagamentoRecebido: false,
        },
        include: {
          cliente: true,
          servico: true,
        }
      });

      
      await tx.cobranca.create({
        data: {
          empresaId,
          clienteId,
          valor: Number(valor),
          dataVencimento: new Date(dataAtendimento),
          status: 'PENDENTE',
          descricao: `Atendimento: ${servico.nome}`
        }
      });

      if (lembrarNaAgenda) {
        await tx.agendamento.create({
          data: {
            empresaId,
            titulo: `Atendimento: ${servico.nome} - ${cliente.nome}`,
            descricao: observacoes || '',
            dataHoraInicio: new Date(dataAtendimento),
            dataHoraFim: new Date(new Date(dataAtendimento).getTime() + (servico.duracaoMinutos || 60) * 60000),
            clienteId,
            status: 'AGENDADO'
          }
        });
      }

      return novoAtendimento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating atendimento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
