import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantId } from "@/lib/tenant-db";

export async function GET() {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const funcionarios = await prisma.funcionario.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(funcionarios);
  } catch (error) {
    console.error("[FUNCIONARIOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { nome, cpf, email, telefone, cargo, dataAdmissao, salario, dadosBancarios, status } = body;

    const funcionario = await prisma.funcionario.create({
      data: {
        nome,
        cpf,
        email,
        telefone,
        cargo,
        dataAdmissao: new Date(dataAdmissao),
        salario: parseFloat(salario),
        dadosBancarios: dadosBancarios || {},
        status: status || "ATIVO",
        empresaId,
      },
    });

    return NextResponse.json(funcionario);
  } catch (error) {
    console.error("[FUNCIONARIOS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
