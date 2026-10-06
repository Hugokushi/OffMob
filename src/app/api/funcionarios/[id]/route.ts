import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantId } from "@/lib/tenant-db";

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { nome, cpf, email, telefone, cargo, dataAdmissao, salario, dadosBancarios, status } = body;

    const funcionario = await prisma.funcionario.updateMany({
      where: { id: resolvedParams.id, empresaId },
      data: {
        nome,
        cpf,
        email,
        telefone,
        cargo,
        dataAdmissao: new Date(dataAdmissao),
        salario: parseFloat(salario),
        dadosBancarios: dadosBancarios || {},
        status,
      },
    });

    if (funcionario.count === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FUNCIONARIOS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const deleted = await prisma.funcionario.deleteMany({
      where: { id: resolvedParams.id, empresaId },
    });

    if (deleted.count === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FUNCIONARIOS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
