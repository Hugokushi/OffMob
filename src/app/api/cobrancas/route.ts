import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = { empresaId };

    if (status && status !== 'TODAS') {
      where.status = status;
    }

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      where.dataVencimento = {
        gte: startDate,
        lte: endDate,
      };
    }

    const cobrancas = await prisma.cobranca.findMany({
      where,
      include: {
        cliente: true,
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    return NextResponse.json(cobrancas);
  } catch (error: any) {
    console.error('Erro ao buscar cobranças:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cobranças' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 });
    }

    const body = await request.json();
    const { clienteId, atendimentoId, descricao, valor, dataVencimento, status } = body;

    if (!descricao || valor === undefined || !dataVencimento || !status) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      );
    }

    const cobranca = await prisma.cobranca.create({
      data: {
        empresaId,
        clienteId: clienteId || null,
        atendimentoId: atendimentoId || null,
        descricao,
        valor: Number(valor),
        dataVencimento: new Date(dataVencimento),
        status,
      },
      include: {
        cliente: true,
      }
    });

    return NextResponse.json(cobranca, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cobrança' },
      { status: 500 }
    );
  }
}
