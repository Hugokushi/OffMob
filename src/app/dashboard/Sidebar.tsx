'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  FileText, 
  UserCog, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PLAN_COLORS, PLAN_LABELS, PlanoType } from '@/lib/permissions';

interface SidebarProps {
  empresa: {
    id: string;
    nome: string;
    logoUrl: string | null;
    plano: string;
  };
  membership: {
    role: string;
    isOwner: boolean;
    permissoes: any;
  };
  userName: string;
}

const MENU_ITEMS = [
  {
    title: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
      { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { name: 'Serviços', href: '/dashboard/servicos', icon: Briefcase },
    ]
  },
  {
    title: 'GESTÃO',
    items: [
      { name: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign },
      { name: 'Documentos', href: '/dashboard/documentos', icon: FileText },
      { name: 'Funcionários', href: '/dashboard/funcionarios', icon: UserCog },
      { name: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
    ]
  }
];

export default function Sidebar({ empresa, membership, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const planoLabel = PLAN_LABELS[empresa.plano as PlanoType] || empresa.plano;
  const planoColor = PLAN_COLORS[empresa.plano as PlanoType] || 'bg-background text-foreground0';

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card text-card-foreground rounded-md shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card text-card-foreground border-r border-border transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden">
              {empresa.logoUrl ? (
                <img src={empresa.logoUrl} alt={empresa.nome} className="w-full h-full object-cover" />
              ) : (
                empresa.nome.charAt(0)
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground truncate max-w-[160px]">{empresa.nome}</span>
              <span className="text-xs text-muted-foreground">{membership.role}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {MENU_ITEMS.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-6 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-1 px-3">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-blue-50 text-blue-700" 
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon size={18} className={cn(isActive ? "text-blue-700" : "text-muted-foreground")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Plano Atual</span>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", planoColor)}>
                {planoLabel}
              </span>
            </div>
            {empresa.plano === 'FREE' && (
              <Link
                href="/dashboard/upgrade"
                className="block w-full py-1.5 text-xs font-medium text-center text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                ⚡ Fazer Upgrade
              </Link>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex flex-col truncate pr-2">
              <span className="text-sm font-medium text-foreground truncate">{userName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth' })}
              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
