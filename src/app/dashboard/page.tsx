import { getCurrentTenantId } from '@/lib/tenant-db'
import { prisma } from '@/lib/prisma'
import { Users, Calendar, DollarSign, Activity } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) {
    redirect('/workspaces')
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [totalClientes, atendimentosMes, agendamentosHoje, faturamentoData] =
    await Promise.all([
      prisma.cliente.count({
        where: { empresaId: tenantId },
      }),
      prisma.atendimento.count({
        where: {
          empresaId: tenantId,
          dataAtendimento: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.agendamento.count({
        where: {
          empresaId: tenantId,
          dataHoraInicio: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.cobranca.aggregate({
        _sum: { valor: true },
        where: {
          empresaId: tenantId,
          status: 'PAGA',
          dataPagamento: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ])

  const faturamento = faturamentoData._sum.valor || 0

  const cards = [
    {
      title: 'Total de Clientes',
      value: totalClientes.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Atendimentos do Mês',
      value: atendimentosMes.toString(),
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Faturamento Realizado',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(faturamento)),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Agendamentos de Hoje',
      value: agendamentosHoje.toString(),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Visão Geral
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as principais métricas da sua empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-card text-card-foreground rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4"
          >
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
