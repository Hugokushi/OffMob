import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { Plano } from '@prisma/client'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado.')
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const empresaId =
            session.metadata?.empresaId || subscription.metadata?.empresaId

          if (empresaId) {
            const priceId = subscription.items.data[0]?.price.id
            const planoMeta = session.metadata?.plano as Plano | undefined

            await prisma.empresa.update({
              where: { id: empresaId },
              data: {
                status: 'ACTIVE',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                ...(planoMeta ? { plano: planoMeta } : {}),
              },
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const empresaId = subscription.metadata?.empresaId

        let empresa = null
        if (empresaId) {
          empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
        }
        if (!empresa && subscription.customer) {
          empresa = await prisma.empresa.findUnique({
            where: { stripeCustomerId: subscription.customer as string },
          })
        }

        if (empresa) {
          let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' = 'ACTIVE'
          if (subscription.status === 'past_due') status = 'PAST_DUE'
          if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
            status = 'CANCELED'
          }

          const priceId = subscription.items.data[0]?.price.id

          await prisma.empresa.update({
            where: { id: empresa.id },
            data: {
              status,
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const empresaId = subscription.metadata?.empresaId

        let empresa = null
        if (empresaId) {
          empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
        }
        if (!empresa && subscription.customer) {
          empresa = await prisma.empresa.findUnique({
            where: { stripeCustomerId: subscription.customer as string },
          })
        }

        if (empresa) {
          await prisma.empresa.update({
            where: { id: empresa.id },
            data: {
              status: 'CANCELED',
            },
          })
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erro ao processar webhook do Stripe:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook.' },
      { status: 500 }
    )
  }
}
