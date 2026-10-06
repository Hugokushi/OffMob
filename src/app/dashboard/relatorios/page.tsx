import { Metadata } from "next";
import RelatoriosContent from "./RelatoriosContent";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantId } from "@/lib/tenant-db";

export const metadata: Metadata = {
  title: "Relatórios | Off Mob",
  description: "Visão geral e relatórios do sistema.",
};

export default async function RelatoriosPage() {
  const empresaId = await getCurrentTenantId();
  if (!empresaId) return <div>Acesso negado.</div>;

  let receitaTotal = 0, recebido = 0, pendente = 0, totalClientes = 0, 
      atendimentosMes = 0, agendamentosMes = 0;
  
  let receitaMensal: any[] = [];
  let statusPagamentos: any[] = [];
  let statusClientes: any[] = [];
  let statusAgendamentos: any[] = [];
  let checklistAtendimentos = { completados: 0, pendentes: 0 };
  let topServicos: any[] = [];

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Cobrancas
    const cobrancas = await prisma.cobranca.findMany({
      where: { empresaId }
    });

    receitaTotal = cobrancas.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    recebido = cobrancas.filter(c => c.status === "PAGA").reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    pendente = cobrancas.filter(c => c.status === "PENDENTE" || c.status === "PARCIAL").reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

    const pgtsMap = cobrancas.reduce((acc: any, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    statusPagamentos = Object.entries(pgtsMap).map(([name, value]) => ({ name, value }));

    // 2. Clientes
    const clientes = await prisma.cliente.findMany({
      where: { empresaId }
    });
    totalClientes = clientes.length;

    const cliMap = clientes.reduce((acc: any, c) => {
      const st = c.status || 'ATIVO';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    statusClientes = Object.entries(cliMap).map(([name, value]) => ({ name, value }));

    // 3. Atendimentos (Mes atual)
    const atendimentos = await prisma.atendimento.findMany({
      where: { empresaId, dataAtendimento: { gte: startOfMonth } },
      include: { servico: true }
    });
    atendimentosMes = atendimentos.length;
    
    let checklistConcluidos = 0;
    atendimentos.forEach(a => {
      if (a.clienteConfirmado && a.servicoRealizado && a.cobrancaGerada && a.pagamentoRecebido) {
        checklistConcluidos++;
      }
    });
    checklistAtendimentos.completados = checklistConcluidos;
    checklistAtendimentos.pendentes = atendimentos.length - checklistConcluidos;

    const servicosMap = atendimentos.reduce((acc: any, a) => {
      if (a.servico) {
        acc[a.servico.nome] = (acc[a.servico.nome] || 0) + 1;
      }
      return acc;
    }, {});
    topServicos = Object.entries(servicosMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    // 4. Agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      where: { empresaId, dataHoraInicio: { gte: startOfMonth } }
    });
    agendamentosMes = agendamentos.length;

    const agMap = agendamentos.reduce((acc: any, a) => {
      const st = a.status || 'AGENDADO';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    statusAgendamentos = Object.entries(agMap).map(([name, value]) => ({ name, value }));

    // Receita Mensal (Ultimos 6 meses)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const recebidoMes = cobrancas
        .filter(c => c.status === "PAGA" && c.dataPagamento && c.dataPagamento >= d && c.dataPagamento < nextMonth)
        .reduce((acc, c) => acc + Number(c.valor), 0);
      
      receitaMensal.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }),
        valor: recebidoMes
      });
    }

  } catch (error) {
    console.error("[RELATORIOS_PAGE]", error);
  }

  const data = {
    receitaTotal,
    recebido,
    pendente,
    totalClientes,
    atendimentosMes,
    agendamentosMes,
    receitaMensal,
    statusPagamentos,
    statusClientes,
    statusAgendamentos,
    checklistAtendimentos,
    topServicos,
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Acompanhe as métricas e o desempenho da sua empresa.</p>
      </div>

      <RelatoriosContent data={data} />
    </div>
  );
}
