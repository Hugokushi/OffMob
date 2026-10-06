'use client'

import { useState } from 'react'
import { Check, Zap, Star, Crown, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Para começar e explorar a plataforma',
    color: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    button: 'bg-gray-800 hover:bg-gray-900 text-white',
    icon: Building2,
    iconColor: 'text-gray-500',
    features: [
      'Até 2 usuários',
      'Módulo de Clientes',
      'Agenda básica',
      'Catálogo de Serviços',
      'Financeiro básico',
      'Documentos (3 modelos)',
    ],
    maxUsers: 2,
    valorMensal: 0,
  },
  {
    id: 'SECUNDARIO',
    name: 'Secundário',
    price: 'R$ 30',
    period: '/mês',
    description: 'Para pequenas equipes em crescimento',
    color: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: Zap,
    iconColor: 'text-blue-500',
    features: [
      'Até 5 usuários',
      'Todos os módulos do Free',
      'Relatórios avançados',
      'Funcionários ilimitados',
      'Documentos ilimitados',
      'Exportação de relatórios',
    ],
    maxUsers: 5,
    valorMensal: 30,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 'R$ 50',
    period: '/mês',
    description: 'Ideal para empresas em pleno crescimento',
    color: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    icon: Star,
    iconColor: 'text-purple-500',
    highlighted: true,
    tag: 'Mais Popular',
    features: [
      'Até 20 usuários',
      'Todos os módulos do Secundário',
      'Personalização da marca',
      'Permissões granulares por módulo',
      'Prioridade no suporte',
      'Exportação PDF/DOCX',
    ],
    maxUsers: 20,
    valorMensal: 50,
  },
  {
    id: 'FULL',
    name: 'Full',
    price: 'R$ 100',
    period: '/mês',
    description: 'Acesso total, sem limites',
    color: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: Crown,
    iconColor: 'text-amber-500',
    features: [
      'Até 100 usuários',
      'Todos os módulos Pro',
      'API de integração',
      'Gerente de conta dedicado',
      'Onboarding personalizado',
      'SLA garantido',
    ],
    maxUsers: 100,
    valorMensal: 100,
  },
] as const

export default function UpgradeContent({
  planoAtual,
  empresaNome,
}: {
  planoAtual: string
  empresaNome: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const handleUpgrade = async (planId: string) => {
    if (planId === planoAtual) return
    setLoading(planId)
    setMessage('')
    try {
      const res = await fetch('/api/configuracoes/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planId }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar plano')
      setMessage(`Plano alterado para ${planId} com sucesso! Recarregue a página para ver as mudanças.`)
    } catch (err: any) {
      setMessage(err.message || 'Erro ao atualizar plano.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/configuracoes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Configurações
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Planos e Preços</h1>
        <p className="text-muted-foreground mt-2">
          Empresa: <span className="font-medium text-foreground">{empresaNome}</span> &mdash; Plano atual:{' '}
          <span className="font-semibold text-primary">{planoAtual}</span>
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isAtual = plan.id === planoAtual
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={`relative bg-card text-card-foreground rounded-xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${
                plan.color
              } ${isAtual ? 'ring-2 ring-primary' : ''} ${
                (plan as any).highlighted ? 'shadow-md' : ''
              }`}
            >
              {(plan as any).highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {(plan as any).tag}
                  </span>
                </div>
              )}
              {isAtual && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Plano Atual
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-muted`}>
                  <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.badge}`}>
                    {plan.maxUsers === 100 ? 'Até 100 usuários' : `Até ${plan.maxUsers} usuário${plan.maxUsers > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isAtual || loading === plan.id}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isAtual
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : plan.button
                }`}
              >
                {loading === plan.id
                  ? 'Processando...'
                  : isAtual
                  ? 'Plano Ativo'
                  : plan.valorMensal === 0
                  ? 'Usar Gratuitamente'
                  : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-10 bg-card text-card-foreground border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Comparativo Completo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Recurso</th>
                {PLANS.map((p) => (
                  <th key={p.id} className={`text-center py-3 px-2 font-semibold ${p.id === planoAtual ? 'text-primary' : 'text-foreground'}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: 'Usuários', values: ['2', '5', '20', '100'] },
                { label: 'Clientes', values: ['✓', '✓', '✓', '✓'] },
                { label: 'Agenda', values: ['✓', '✓', '✓', '✓'] },
                { label: 'Serviços', values: ['✓', '✓', '✓', '✓'] },
                { label: 'Financeiro', values: ['✓', '✓', '✓', '✓'] },
                { label: 'Documentos', values: ['3 modelos', 'Ilimitados', 'Ilimitados', 'Ilimitados'] },
                { label: 'Funcionários', values: ['—', '✓', '✓', '✓'] },
                { label: 'Relatórios avançados', values: ['—', '✓', '✓', '✓'] },
                { label: 'Permissões granulares', values: ['—', '—', '✓', '✓'] },
                { label: 'Personalização da marca', values: ['—', '—', '✓', '✓'] },
                { label: 'Exportação PDF/Word', values: ['—', '✓', '✓', '✓'] },
                { label: 'API de integração', values: ['—', '—', '—', '✓'] },
                { label: 'Suporte prioritário', values: ['—', '—', '✓', '✓'] },
                { label: 'Gerente dedicado', values: ['—', '—', '—', '✓'] },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-muted/40">
                  <td className="py-3 pr-4 text-foreground font-medium">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`text-center py-3 px-2 ${
                        PLANS[i].id === planoAtual ? 'text-primary font-semibold' : 'text-muted-foreground'
                      } ${v === '—' ? 'opacity-40' : ''}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

