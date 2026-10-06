import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { titulo, descricao, dataHoraInicio, dataHoraFim, clienteId, servicoId, status } = body;

    const existing = await prisma.agendamento.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId,
      }
    });

    if (!existing) {
      return new NextResponse('Not found', { status: 404 });
    }

    const agendamento = await prisma.agendamento.update({
      where: { id: resolvedParams.id },
      data: {
        titulo,
        descricao,
        dataHoraInicio: dataHoraInicio ? new Date(dataHoraInicio) : undefined,
        dataHoraFim: dataHoraFim ? new Date(dataHoraFim) : undefined,
        clienteId: clienteId || null,
        servicoId: servicoId || null,
        status,
      }
    });

    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('[AGENDAMENTO_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse('Unauthorized', { status: 401 });

    const existing = await prisma.agendamento.findFirst({
      where: {
        id: resolvedParams.id,
        empresaId,
      }
    });

    if (!existing) {
      return new NextResponse('Not found', { status: 404 });
    }

    await prisma.agendamento.delete({
      where: { id: resolvedParams.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[AGENDAMENTO_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
