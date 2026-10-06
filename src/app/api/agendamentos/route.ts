import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse('Unauthorized', { status: 401 });

    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let whereClause: any = { empresaId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      whereClause.dataHoraInicio = {
        gte: startDate,
        lte: endDate,
      };
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: whereClause,
      include: {
        cliente: true,
        servico: true,
      },
      orderBy: { dataHoraInicio: 'asc' },
    });

    return NextResponse.json(agendamentos);
  } catch (error) {
    console.error('[AGENDAMENTOS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { titulo, descricao, dataHoraInicio, dataHoraFim, clienteId, servicoId, status } = body;

    if (!titulo || !dataHoraInicio || !dataHoraFim) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo,
        descricao,
        dataHoraInicio: new Date(dataHoraInicio),
        dataHoraFim: new Date(dataHoraFim),
        clienteId: clienteId || null,
        servicoId: servicoId || null,
        status: status || 'AGENDADO',
        empresaId,
      }
    });

    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('[AGENDAMENTOS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
