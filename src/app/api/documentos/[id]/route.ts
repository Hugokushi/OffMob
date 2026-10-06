import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantId } from "@/lib/tenant-db";

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { titulo, conteudo, camposDinamicos } = body;

    const modelo = await prisma.documentoModelo.updateMany({
      where: { id: resolvedParams.id, empresaId },
      data: { titulo, conteudo, camposDinamicos },
    });

    if (modelo.count === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENTOS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const empresaId = await getCurrentTenantId();
    if (!empresaId) return new NextResponse("Unauthorized", { status: 401 });

    const deleted = await prisma.documentoModelo.deleteMany({
      where: { id: resolvedParams.id, empresaId },
    });

    if (deleted.count === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENTOS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
