import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { PLAN_LIMITS, getOwnerPermissions } from '@/lib/permissions'
import type { PlanoType } from '@/lib/permissions'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nome, email, senha, empresaNome, telefone, cnpj, plano } = body

    if (!nome || !email || !senha || !empresaNome) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não preenchidos.' },
        { status: 400 }
      )
    }

    // Verificar se e-mail já está em uso
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 400 }
      )
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const selectedPlano = (['FREE', 'SECUNDARIO', 'PRO', 'FULL'].includes(plano)
      ? plano
      : 'FREE') as PlanoType

    const planConfig = PLAN_LIMITS[selectedPlano]

    // Transação para criação do Usuário, Empresa e Vínculo ADMIN/Owner
    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
        },
      })

      const empresa = await tx.empresa.create({
        data: {
          nome: empresaNome,
          telefone: telefone || null,
          cnpj: cnpj || null,
          status: 'ACTIVE',
          plano: selectedPlano,
          maxUsers: planConfig.maxUsers,
          valorMensal: planConfig.valorMensal,
        },
      })

      await tx.empresaUsuario.create({
        data: {
          usuarioId: usuario.id,
          empresaId: empresa.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          isOwner: true,
          permissoes: getOwnerPermissions() as any,
        },
      })

      return { usuario, empresa }
    })

    // Definir cookie de tenant ativo
    const cookieStore = await cookies()
    cookieStore.set('active_tenant_id', result.empresa.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
      },
      empresa: result.empresa,
    })
  } catch (error: any) {
    console.error('Erro no onboarding:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar o cadastro.' },
      { status: 500 }
    )
  }
}
