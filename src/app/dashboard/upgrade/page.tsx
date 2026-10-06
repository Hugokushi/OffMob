import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentTenantId, getCurrentTenant } from '@/lib/tenant-db'
import UpgradeContent from './UpgradeContent'

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth')

  const tenantId = await getCurrentTenantId()
  if (!tenantId) redirect('/workspaces')

  const empresa = await getCurrentTenant()
  if (!empresa) redirect('/workspaces')

  return <UpgradeContent planoAtual={empresa.plano} empresaNome={empresa.nome} />
}

