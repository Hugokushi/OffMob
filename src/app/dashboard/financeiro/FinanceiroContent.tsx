'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Printer, 
  MoreVertical, 
  Edit, 
  Trash2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Cliente {
  id: string;
  nome: string;
}

interface Cobranca {
  id: string;
  descricao: string;
  valor: number;
  valorPago?: number | null;
  dataVencimento: Date | string;
  dataPagamento?: Date | string | null;
  status: string;
  cliente?: Cliente | null;
  clienteId?: string | null;
}

interface FinanceiroContentProps {
  initialCobrancas: Cobranca[];
  clientes: Cliente[];
}

export default function FinanceiroContent({ initialCobrancas, clientes }: FinanceiroContentProps) {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>(initialCobrancas);
  const [activeTab, setActiveTab] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    descricao: '',
    valor: '',
    dataVencimento: '',
    status: 'PENDENTE',
    clienteId: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Compute stats
  const stats = useMemo(() => {
    let totalAReceber = 0;
    let recebido = 0;
    let vencido = 0;
    let totalGeral = 0;

    cobrancas.forEach((c) => {
      totalGeral += Number(c.valor);
      
      if (c.status === 'PENDENTE' || c.status === 'PARCIAL') {
        const remaining = Number(c.valor) - (Number(c.valorPago) || 0);
        totalAReceber += remaining;
      }
      
      if (c.status === 'PAGA') {
        recebido += Number(c.valorPago || c.valor);
      } else if (c.status === 'PARCIAL') {
        recebido += Number(c.valorPago || 0);
      }
      
      if (c.status === 'VENCIDA') {
        vencido += Number(c.valor);
      }
    });

    return { totalAReceber, recebido, vencido, totalGeral };
  }, [cobrancas]);

  // Filter cobrancas
  const filteredCobrancas = useMemo(() => {
    if (activeTab === 'TODAS') return cobrancas;
    return cobrancas.filter((c) => c.status === activeTab);
  }, [cobrancas, activeTab]);

  const tabs = ['TODAS', 'PENDENTES', 'PAGAS', 'VENCIDAS', 'PARCIAIS', 'CANCELADAS'];
  // Convert tab display names to values
  const getTabValue = (tab: string) => {
    if (tab === 'TODAS') return 'TODAS';
    if (tab === 'PENDENTES') return 'PENDENTE';
    if (tab === 'PAGAS') return 'PAGA';
    if (tab === 'VENCIDAS') return 'VENCIDA';
    if (tab === 'PARCIAIS') return 'PARCIAL';
    if (tab === 'CANCELADAS') return 'CANCELADA';
    return tab;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'PAGA':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Paga</span>;
      case 'VENCIDA':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Vencida</span>;
      case 'PARCIAL':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Parcial</span>;
      case 'CANCELADA':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">Cancelada</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">{status}</span>;
    }
  };

  const openModal = (cobranca?: Cobranca) => {
    if (cobranca) {
      setFormData({
        id: cobranca.id,
        descricao: cobranca.descricao,
        valor: String(cobranca.valor),
        dataVencimento: new Date(cobranca.dataVencimento).toISOString().split('T')[0],
        status: cobranca.status,
        clienteId: cobranca.clienteId || '',
      });
    } else {
      setFormData({
        id: '',
        descricao: '',
        valor: '',
        dataVencimento: new Date().toISOString().split('T')[0],
        status: 'PENDENTE',
        clienteId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEditing = !!formData.id;
      const url = isEditing ? `/api/cobrancas/${formData.id}` : '/api/cobrancas';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        valor: Number(formData.valor),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedCobranca = await res.json();
        if (isEditing) {
          setCobrancas(cobrancas.map(c => c.id === savedCobranca.id ? savedCobranca : c));
        } else {
          setCobrancas([savedCobranca, ...cobrancas]);
        }
        closeModal();
      } else {
        alert('Erro ao salvar cobrança');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar cobrança');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cobrança?')) return;
    
    try {
      const res = await fetch(`/api/cobrancas/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCobrancas(cobrancas.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir cobrança');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir cobrança');
    }
  };

  const handleMarkAsPaid = async (cobranca: Cobranca) => {
    try {
      const res = await fetch(`/api/cobrancas/${cobranca.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAGA',
          dataPagamento: new Date().toISOString(),
          valorPago: cobranca.valor
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCobrancas(cobrancas.map(c => c.id === updated.id ? updated : c));
      } else {
        alert('Erro ao marcar como paga');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Gerencie as cobranças e o fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-card text-card-foreground border border-border text-foreground rounded-md hover:bg-background text-foreground transition-colors"
          >
            <Printer size={18} />
            Exportar Relatório Mensal
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Nova Cobrança
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
        <p className="text-muted-foreground">Gerado em {formatDate(new Date())}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">Total a Receber</h3>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ArrowUpRight className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4">{formatCurrency(stats.totalAReceber)}</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">Recebido</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4">{formatCurrency(stats.recebido)}</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">Vencido</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4">{formatCurrency(stats.vencido)}</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">Total Geral</h3>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="text-indigo-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4">{formatCurrency(stats.totalGeral)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border print:hidden">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(getTabValue(tab))}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${getTabValue(tab) === activeTab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background text-foreground">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descrição / Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor (R$)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vencimento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pagamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider print:hidden">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-card text-card-foreground divide-y divide-gray-200">
              {filteredCobrancas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma cobrança encontrada.
                  </td>
                </tr>
              ) : (
                filteredCobrancas.map((cobranca) => (
                  <tr key={cobranca.id} className="hover:bg-background text-foreground">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{cobranca.descricao}</div>
                      <div className="text-sm text-muted-foreground">{cobranca.cliente?.nome || 'Sem cliente'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground font-medium">
                        {formatCurrency(cobranca.valor)}
                      </div>
                      {cobranca.valorPago && (
                        <div className="text-xs text-green-600">Pago: {formatCurrency(cobranca.valorPago)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(cobranca.dataVencimento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(cobranca.dataPagamento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cobranca.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                      <div className="flex justify-end items-center gap-3">
                        {cobranca.status !== 'PAGA' && (
                          <button
                            onClick={() => handleMarkAsPaid(cobranca)}
                            className="text-green-600 hover:text-green-900 text-xs font-semibold bg-green-50 px-2 py-1 rounded"
                          >
                            Marcar como Paga
                          </button>
                        )}
                        <button
                          onClick={() => openModal(cobranca)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cobranca.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova/Editar Cobrança */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {formData.id ? 'Editar Cobrança' : 'Nova Cobrança'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-muted-foreground transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Manutenção de ar condicionado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Nenhum cliente (avulso)</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGA">Paga</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="PARCIAL">Parcial</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-card text-card-foreground border border-border text-foreground rounded-md hover:bg-background text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
