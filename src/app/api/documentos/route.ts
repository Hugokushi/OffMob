import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantId } from "@/lib/tenant-db";

export async function GET() {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const modelos = await prisma.documentoModelo.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(modelos);
  } catch (error) {
    console.error("[DOCUMENTOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { titulo, conteudo, camposDinamicos } = body;

    if (!titulo || !conteudo) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const modelo = await prisma.documentoModelo.create({
      data: {
        titulo,
        conteudo,
        camposDinamicos: camposDinamicos || [],
        empresaId,
      },
    });

    return NextResponse.json(modelo);
  } catch (error) {
    console.error("[DOCUMENTOS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
