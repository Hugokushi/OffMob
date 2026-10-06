import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTenantId } from '@/lib/tenant-db';

export async function GET(req: Request) {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const servicos = await prisma.servicoCatalogo.findMany({
      where: { empresaId },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(servicos);
  } catch (error) {
    console.error('Error fetching services:', error);
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
    const { nome, descricao, preco, duracaoMinutos, status } = json;

    if (!nome || preco === undefined || duracaoMinutos === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const servico = await prisma.servicoCatalogo.create({
      data: {
        nome,
        descricao: descricao || '',
        preco: Number(preco),
        duracaoMinutos: Number(duracaoMinutos),
        status: status || 'ATIVO',
        empresaId,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
