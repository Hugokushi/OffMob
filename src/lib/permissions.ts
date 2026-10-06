// Módulos do sistema para controle de permissões
export const MODULOS = [
  'clientes',
  'agenda',
  'servicos',
  'financeiro',
  'documentos',
  'funcionarios',
  'relatorios',
  'configuracoes',
] as const

export type Modulo = (typeof MODULOS)[number]

export const MODULO_LABELS: Record<Modulo, string> = {
  clientes: 'Clientes',
  agenda: 'Agenda',
  servicos: 'Serviços',
  financeiro: 'Financeiro',
  documentos: 'Documentos',
  funcionarios: 'Funcionários',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
}

export const ACOES = ['ver', 'criar', 'editar', 'excluir', 'exportar', 'importar', 'imprimir'] as const
export type Acao = (typeof ACOES)[number]

export const ACAO_LABELS: Record<Acao, string> = {
  ver: 'Ver',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  exportar: 'Exportar',
  importar: 'Importar',
  imprimir: 'Imprimir',
}

export interface ModuloPermissao {
  modulo: Modulo
  acoes: Record<Acao, boolean>
}

export type PermissoesMap = ModuloPermissao[]

// Permissões padrão para o Owner (tudo habilitado)
export function getOwnerPermissions(): PermissoesMap {
  return MODULOS.map((modulo) => ({
    modulo,
    acoes: Object.fromEntries(ACOES.map((acao) => [acao, true])) as Record<Acao, boolean>,
  }))
}

// Permissões padrão para novo colaborador (tudo desabilitado)
export function getDefaultPermissions(): PermissoesMap {
  return MODULOS.map((modulo) => ({
    modulo,
    acoes: Object.fromEntries(ACOES.map((acao) => [acao, false])) as Record<Acao, boolean>,
  }))
}

// Verifica se o usuário tem permissão para determinada ação em um módulo
export function hasPermission(
  permissoes: PermissoesMap | null | undefined,
  modulo: Modulo,
  acao: Acao
): boolean {
  if (!permissoes || !Array.isArray(permissoes)) return false
  const moduloPerm = permissoes.find((p) => p.modulo === modulo)
  if (!moduloPerm) return false
  return moduloPerm.acoes[acao] === true
}

// Limites de usuários por plano
export const PLAN_LIMITS = {
  FREE: { maxUsers: 2, valorMensal: 0 },
  SECUNDARIO: { maxUsers: 5, valorMensal: 30 },
  PRO: { maxUsers: 20, valorMensal: 50 },
  FULL: { maxUsers: 100, valorMensal: 100 },
} as const

export type PlanoType = keyof typeof PLAN_LIMITS

export const PLAN_LABELS: Record<PlanoType, string> = {
  FREE: 'Free',
  SECUNDARIO: 'Secundário',
  PRO: 'Pro',
  FULL: 'Full',
}

export const PLAN_COLORS: Record<PlanoType, string> = {
  FREE: 'bg-muted text-foreground',
  SECUNDARIO: 'bg-blue-100 text-blue-800',
  PRO: 'bg-purple-100 text-purple-800',
  FULL: 'bg-amber-100 text-amber-800',
}
