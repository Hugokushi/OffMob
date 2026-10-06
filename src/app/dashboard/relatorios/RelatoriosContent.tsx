"use client";

import { DollarSign, CheckCircle2, Clock, Users, Calendar, ClipboardCheck } from "lucide-react";

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
};

export default function RelatoriosContent({ data }: { data: any }) {
  const {
    receitaTotal, recebido, pendente, totalClientes, atendimentosMes, agendamentosMes,
    receitaMensal, statusPagamentos, statusClientes, statusAgendamentos, checklistAtendimentos, topServicos
  } = data;

  const maxReceita = Math.max(...receitaMensal.map((r: any) => r.valor));
  const maxServico = Math.max(...topServicos.map((s: any) => s.count));

  const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"];

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard & Relatórios</h1>

      {/* Row 1: Big Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
            <h3 className="text-2xl font-bold text-foreground">{formatMoney(receitaTotal)}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><DollarSign className="w-6 h-6" /></div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Recebido</p>
            <h3 className="text-2xl font-bold text-green-600">{formatMoney(recebido)}</h3>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">A Receber</p>
            <h3 className="text-2xl font-bold text-yellow-600">{formatMoney(pendente)}</h3>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><Clock className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Row 2: Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600"><Users className="w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-bold">{totalClientes}</h3>
            <p className="text-sm text-muted-foreground">Total de Clientes</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 bg-pink-100 rounded-full text-pink-600"><ClipboardCheck className="w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-bold">{atendimentosMes}</h3>
            <p className="text-sm text-muted-foreground">Atendimentos no Mês</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 bg-teal-100 rounded-full text-teal-600"><Calendar className="w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-bold">{agendamentosMes}</h3>
            <p className="text-sm text-muted-foreground">Agendamentos no Mês</p>
          </div>
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Receita */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Receita Mensal (Últimos 6 Meses)</h3>
          <div className="flex items-end justify-between h-48 mt-4 gap-2">
            {receitaMensal.map((r: any, i: number) => {
              const height = maxReceita > 0 ? (r.valor / maxReceita) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold bg-gray-800 text-white px-2 py-1 rounded">
                    {formatMoney(r.valor)}
                  </div>
                  <div className="w-full bg-blue-500 rounded-t-sm transition-all duration-500" style={{ height: `${height}%` }}></div>
                  <span className="text-xs text-muted-foreground truncate w-full text-center">{r.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Servicos */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Top 5 Serviços</h3>
          <div className="space-y-4">
            {topServicos.map((s: any, i: number) => {
              const width = maxServico > 0 ? (s.count / maxServico) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-24 truncate">{s.name}</span>
                  <div className="flex-1 bg-muted h-4 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${width}%` }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status de Pagamentos */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Status de Pagamentos</h3>
          <div className="space-y-2">
            {statusPagamentos.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`}></div>
                  <span className="text-sm text-foreground capitalize">{s.name}</span>
                </div>
                <span className="text-sm font-medium">{s.value}</span>
              </div>
            ))}
            {statusPagamentos.length === 0 && <p className="text-xs text-gray-400">Sem dados</p>}
          </div>
        </div>

        {/* Clientes por Status */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Clientes por Status</h3>
          <div className="space-y-2 flex flex-col">
            {statusClientes.map((s: any, i: number) => (
              <div key={i} className={`px-3 py-2 rounded flex justify-between items-center text-sm font-medium border
                ${s.name === 'ATIVO' ? 'bg-green-50 text-green-700 border-green-200' : 
                  s.name === 'INATIVO' ? 'bg-background text-foreground text-foreground border-border' : 
                  'bg-blue-50 text-blue-700 border-blue-200'}`}>
                <span>{s.name}</span>
                <span>{s.value}</span>
              </div>
            ))}
            {statusClientes.length === 0 && <p className="text-xs text-gray-400">Sem dados</p>}
          </div>
        </div>

        {/* Agendamentos */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Compromissos</h3>
          <div className="space-y-2">
            {statusAgendamentos.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-1 last:border-0">
                <span className="text-sm text-muted-foreground">{s.name}</span>
                <span className="text-sm font-bold bg-muted px-2 py-0.5 rounded text-foreground">{s.value}</span>
              </div>
            ))}
            {statusAgendamentos.length === 0 && <p className="text-xs text-gray-400">Sem dados</p>}
          </div>
        </div>

        {/* Checklist Atendimentos */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Conclusão (Checklist)</h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concluídos</span>
              <span className="text-sm font-bold text-green-600">{checklistAtendimentos.completados}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pendentes</span>
              <span className="text-sm font-bold text-yellow-600">{checklistAtendimentos.pendentes}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${(checklistAtendimentos.completados / (checklistAtendimentos.completados + checklistAtendimentos.pendentes || 1)) * 100}%` }}>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
