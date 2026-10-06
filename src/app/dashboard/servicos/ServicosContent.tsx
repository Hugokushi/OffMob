'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, Calendar, 
  CheckCircle2, Circle, Clock, DollarSign,
  Activity, Briefcase, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function ServicosContent({ 
  initialServicos, 
  initialAtendimentos, 
  clientes 
}: { 
  initialServicos: any[];
  initialAtendimentos: any[];
  clientes: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'atendimentos' | 'relatorios'>('catalogo');
  const [servicos, setServicos] = useState(initialServicos);
  const [atendimentos, setAtendimentos] = useState(initialAtendimentos);

  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);
  const [isAtendimentoModalOpen, setIsAtendimentoModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<any>(null);

  const stats = useMemo(() => {
    const totalAtendimentos = atendimentos.length;
    const faturamentoTotal = atendimentos.reduce((acc: any, curr: any) => acc + curr.valor, 0);
    const mediaPorAtendimento = totalAtendimentos > 0 ? faturamentoTotal / totalAtendimentos : 0;
    
    const serviceCounts = atendimentos.reduce((acc: any, curr: any) => {
      const name = (curr as any).servico?.nome || 'Desconhecido';
      acc[name] = ((acc[name] as any) || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServices = Object.entries(serviceCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    return { totalAtendimentos, faturamentoTotal, mediaPorAtendimento, topServices };
  }, [atendimentos]);

  const handleCreateServico = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      preco: formData.get('preco'),
      duracaoMinutos: formData.get('duracaoMinutos'),
      status: formData.get('status'),
    };

    try {
      if (editingServico) {
        const res = await fetch(`/api/servicos/${editingServico.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setServicos(servicos.map(s => s.id === updated.id ? updated : s));
        }
      } else {
        const res = await fetch('/api/servicos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const novo = await res.json();
          setServicos([...servicos, novo]);
        }
      }
      setIsServicoModalOpen(false);
      setEditingServico(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteServico = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await fetch(`/api/servicos/${id}`, { method: 'DELETE' });
      setServicos(servicos.filter(s => s.id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateAtendimento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      clienteId: formData.get('clienteId'),
      servicoId: formData.get('servicoId'),
      dataAtendimento: formData.get('dataAtendimento'),
      valor: formData.get('valor'),
      observacoes: formData.get('observacoes'),
      lembrarNaAgenda: formData.get('lembrarNaAgenda') === 'on',
    };

    try {
      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const novo = await res.json();
        setAtendimentos([novo, ...atendimentos]);
        setIsAtendimentoModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleAtendimentoChecklist = async (id: string, field: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/atendimentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAtendimentos(atendimentos.map(a => a.id === updated.id ? updated : a));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={cn(
            "px-4 py-2 border-b-2 font-medium text-sm",
            activeTab === 'catalogo' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Catálogo de Serviços</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('atendimentos')}
          className={cn(
            "px-4 py-2 border-b-2 font-medium text-sm",
            activeTab === 'atendimentos' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Atendimentos</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('relatorios')}
          className={cn(
            "px-4 py-2 border-b-2 font-medium text-sm",
            activeTab === 'relatorios' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Relatórios</span>
          </div>
        </button>
      </div>

      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingServico(null);
                setIsServicoModalOpen(true);
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Serviço</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicos.map((servico) => (
              <div key={servico.id} className="border rounded-lg p-4 shadow-sm bg-card">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{servico.nome}</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingServico(servico);
                        setIsServicoModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteServico(servico.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{servico.descricao}</p>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>R$ {Number(servico.preco).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{servico.duracaoMinutos} min</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <span className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full",
                    servico.status === 'ATIVO' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {servico.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'atendimentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAtendimentoModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Atendimento</span>
            </button>
          </div>
          <div className="grid gap-4">
            {atendimentos.map((atendimento) => {
              const checklistItems = [
                { id: 'clienteConfirmado', label: 'Cliente Confirmado', value: atendimento.clienteConfirmado },
                { id: 'servicoRealizado', label: 'Serviço Realizado', value: atendimento.servicoRealizado },
                { id: 'cobrancaGerada', label: 'Cobrança Gerada', value: atendimento.cobrancaGerada },
                { id: 'pagamentoRecebido', label: 'Pagamento Recebido', value: atendimento.pagamentoRecebido },
              ];
              const completedCount = checklistItems.filter(i => i.value).length;
              const progress = (completedCount / checklistItems.length) * 100;

              return (
                <div key={atendimento.id} className="border rounded-lg p-4 shadow-sm bg-card flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {atendimento.servico?.nome} - {atendimento.cliente?.nome}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(atendimento.dataAtendimento).toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        R$ {Number(atendimento.valor).toFixed(2)}
                      </div>
                    </div>
                    {atendimento.observacoes && (
                      <p className="text-sm mt-2">{atendimento.observacoes}</p>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-2">Checklist de Progresso</h4>
                    <div className="w-full bg-muted/80 rounded-full h-2 mb-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {checklistItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleAtendimentoChecklist(atendimento.id, item.id, item.value)}
                          className={cn(
                            "flex items-center gap-2 text-sm p-2 rounded hover:bg-muted text-left transition-colors",
                            item.value ? "text-green-600 font-medium" : "text-muted-foreground"
                          )}
                        >
                          {item.value ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-6 bg-card text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Total de Atendimentos</h3>
              <p className="text-4xl font-bold">{stats.totalAtendimentos}</p>
            </div>
            <div className="border rounded-lg p-6 bg-card text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Faturamento Total</h3>
              <p className="text-4xl font-bold text-green-600">
                R$ {stats.faturamentoTotal.toFixed(2)}
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-card text-center">
              <h3 className="text-muted-foreground font-medium mb-2">Média por Atendimento</h3>
              <p className="text-4xl font-bold text-blue-600">
                R$ {stats.mediaPorAtendimento.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Top 5 Serviços Realizados</h3>
            {stats.topServices.length > 0 ? (
              <div className="space-y-4">
                {stats.topServices.map(([nome, count]: [string, any], index) => (
                  <div key={nome} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{nome}</span>
                    </div>
                    <span className="text-muted-foreground">{count} atendimentos</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum atendimento registrado ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* Servico Modal */}
      {isServicoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <form onSubmit={handleCreateServico} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input 
                  name="nome" 
                  defaultValue={editingServico?.nome} 
                  required 
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea 
                  name="descricao" 
                  defaultValue={editingServico?.descricao} 
                  className="w-full border rounded p-2"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                  <input 
                    name="preco" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingServico?.preco} 
                    required 
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duração (min)</label>
                  <input 
                    name="duracaoMinutos" 
                    type="number" 
                    defaultValue={editingServico?.duracaoMinutos} 
                    required 
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  name="status" 
                  defaultValue={editingServico?.status || 'ATIVO'} 
                  className="w-full border rounded p-2"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsServicoModalOpen(false)}
                  className="px-4 py-2 border rounded text-muted-foreground hover:bg-background text-foreground"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Atendimento Modal */}
      {isAtendimentoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Atendimento</h2>
            <form onSubmit={handleCreateAtendimento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <select name="clienteId" required className="w-full border rounded p-2">
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Serviço</label>
                <select 
                  name="servicoId" 
                  required 
                  className="w-full border rounded p-2"
                  onChange={(e) => {
                    const servico = servicos.find(s => s.id === e.target.value);
                    const valorInput = document.getElementById('valorAtendimento') as HTMLInputElement;
                    if (servico && valorInput) {
                      valorInput.value = servico.preco;
                    }
                  }}
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.filter(s => s.status === 'ATIVO').map(s => (
                    <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data e Hora</label>
                  <input 
                    name="dataAtendimento" 
                    type="datetime-local" 
                    required 
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                  <input 
                    id="valorAtendimento"
                    name="valor" 
                    type="number" 
                    step="0.01" 
                    required 
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea 
                  name="observacoes" 
                  className="w-full border rounded p-2"
                  rows={2}
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="lembrarNaAgenda" 
                  name="lembrarNaAgenda" 
                  className="rounded border-border"
                />
                <label htmlFor="lembrarNaAgenda" className="text-sm font-medium">
                  Adicionar ao Agendamento
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAtendimentoModalOpen(false)}
                  className="px-4 py-2 border rounded text-muted-foreground hover:bg-background text-foreground"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Criar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
