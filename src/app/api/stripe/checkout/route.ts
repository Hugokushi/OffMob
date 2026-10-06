import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { getCurrentTenantId } from '@/lib/tenant-db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    let empresaId = body.empresaId || (await getCurrentTenantId())

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa não especificada.' }, { status: 400 })
    }

    // Verificar se o usuário pertence à empresa
    const membership = await prisma.empresaUsuario.findUnique({
      where: {
        usuarioId_empresaId: {
          usuarioId: session.user.id,
          empresaId,
        },
      },
      include: { empresa: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Acesso negado à empresa.' }, { status: 403 })
    }

    const { empresa } = membership
    const plano = body.plano || empresa.plano || 'STARTER'
    const priceId = PLAN_PRICES[plano] || process.env.STRIPE_PRICE_STARTER

    if (!priceId) {
      return NextResponse.json(
        { error: 'ID do preço do plano não configurado nas variáveis de ambiente.' },
        { status: 400 }
      )
    }

    let customerId = empresa.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: empresa.email || session.user.email || undefined,
        name: empresa.nome,
        metadata: {
          empresaId: empresa.id,
        },
      })
      customerId = customer.id

      await prisma.empresa.update({
        where: { id: empresa.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        empresaId: empresa.id,
        plano,
      },
      subscription_data: {
        metadata: {
          empresaId: empresa.id,
          plano,
        },
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=canceled`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar checkout do Stripe.' },
      { status: 500 }
    )
  }
}
