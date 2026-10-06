'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, ArrowRight, CheckCircle, Clock, Shield } from 'lucide-react'

interface WorkspacesListProps {
  memberships: Array<{
    id: string
    role: string
    empresa: {
      id: string
      nome: string
      cnpj: string | null
      status: string
      trialExpiresAt: Date | string
      plano: string
    }
  }>
  activeTenantId: string | null
  userName: string
}

export default function WorkspacesList({
  memberships,
  activeTenantId,
  userName,
}: WorkspacesListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSelectWorkspace = async (empresaId: string) => {
    setLoadingId(empresaId)
    try {
      const res = await fetch('/api/workspaces/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId }),
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('Erro ao selecionar empresa.')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const getDaysLeft = (date: Date | string) => {
    const expires = new Date(date)
    const diff = expires.getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seus Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Olá, <span className="font-semibold text-foreground">{userName}</span>. Selecione a empresa que deseja acessar:
          </p>
        </div>
        <Link
          href="/auth?tab=register"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="text-center py-12 bg-background text-foreground rounded-xl border border-dashed border-border">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Nenhuma empresa encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Você ainda não faz parte de nenhum workspace.</p>
          <Link
            href="/auth?tab=register"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cadastrar Empresa
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map(({ role, empresa }) => {
            const isActive = activeTenantId === empresa.id
            const isTrial = empresa.status === 'TRIAL'
            const daysLeft = getDaysLeft(empresa.trialExpiresAt)

            return (
              <div
                key={empresa.id}
                onClick={() => handleSelectWorkspace(empresa.id)}
                className={`group flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                    : 'border-border hover:border-blue-300 hover:shadow-md bg-card text-card-foreground'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    {empresa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                        {empresa.nome}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Ativa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        {role}
                      </span>
                      <span>•</span>
                      <span className="uppercase font-semibold text-muted-foreground">{empresa.plano}</span>
                      {isTrial && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Trial ({daysLeft} dias restantes)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {loadingId === empresa.id ? (
                    <span className="text-xs text-blue-600 font-medium animate-pulse">Entrando...</span>
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
