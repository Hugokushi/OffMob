"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash, Search, X } from "lucide-react";

export default function FuncionariosContent() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFunc, setCurrentFunc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [formData, setFormData] = useState({
    nome: "", cpf: "", email: "", telefone: "", cargo: "", 
    dataAdmissao: "", salario: "", status: "ATIVO",
    banco: "", agencia: "", conta: "", tipoConta: "Corrente"
  });

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const fetchFuncionarios = async () => {
    const res = await fetch("/api/funcionarios");
    if (res.ok) {
      const data = await res.json();
      setFuncionarios(data);
    }
  };

  const openModal = (func: any = null) => {
    setCurrentFunc(func);
    if (func) {
      const d = new Date(func.dataAdmissao);
      const formattedDate = d.toISOString().split("T")[0];
      setFormData({
        nome: func.nome || "", cpf: func.cpf || "", email: func.email || "", telefone: func.telefone || "",
        cargo: func.cargo || "", dataAdmissao: formattedDate, salario: String(func.salario), status: func.status,
        banco: func.dadosBancarios?.banco || "", agencia: func.dadosBancarios?.agencia || "", 
        conta: func.dadosBancarios?.conta || "", tipoConta: func.dadosBancarios?.tipoConta || "Corrente"
      });
    } else {
      setFormData({
        nome: "", cpf: "", email: "", telefone: "", cargo: "", dataAdmissao: "", salario: "", status: "ATIVO",
        banco: "", agencia: "", conta: "", tipoConta: "Corrente"
      });
    }
    setIsModalOpen(true);
  };

  const saveFunc = async () => {
    const method = currentFunc ? "PUT" : "POST";
    const url = currentFunc ? `/api/funcionarios/${currentFunc.id}` : "/api/funcionarios";

    const payload = {
      ...formData,
      dadosBancarios: {
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        tipoConta: formData.tipoConta
      }
    };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    fetchFuncionarios();
  };

  const deleteFunc = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await fetch(`/api/funcionarios/${id}`, { method: "DELETE" });
    fetchFuncionarios();
  };

  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(f => {
      const matchName = f.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "TODOS" || f.status === statusFilter;
      return matchName && matchStatus;
    });
  }, [funcionarios, searchTerm, statusFilter]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Funcionários</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 p-2 w-full border rounded"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="p-2 border rounded md:w-48"
        >
          <option value="TODOS">Todos Status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
          <option value="FERIAS">Férias</option>
          <option value="DESLIGADO">Desligado</option>
        </select>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-background text-foreground">
            <tr>
              <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider">Nome / Email</th>
              <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider">CPF / Telefone</th>
              <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider">Cargo / Salário</th>
              <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card text-card-foreground divide-y divide-gray-200">
            {filteredFuncionarios.map((f) => (
              <tr key={f.id} className="hover:bg-background text-foreground">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{f.nome}</div>
                  <div className="text-muted-foreground">{f.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{f.cpf}</div>
                  <div className="text-muted-foreground">{f.telefone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{f.cargo}</div>
                  <div className="text-muted-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(f.salario)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${f.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 
                      f.status === 'INATIVO' ? 'bg-muted text-foreground' : 
                      f.status === 'FERIAS' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openModal(f)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteFunc(f.id)} className="text-red-600 hover:text-red-900"><Trash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filteredFuncionarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">Nenhum funcionário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card text-card-foreground rounded-lg w-full max-w-3xl flex flex-col my-8">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-card text-card-foreground z-10 rounded-t-lg">
              <h2 className="text-xl font-bold">{currentFunc ? "Editar Funcionário" : "Novo Funcionário"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo</label>
                  <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cargo</label>
                  <input value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Admissão</label>
                  <input type="date" value={formData.dataAdmissao} onChange={e => setFormData({...formData, dataAdmissao: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salário (R$)</label>
                  <input type="number" step="0.01" value={formData.salario} onChange={e => setFormData({...formData, salario: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded">
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="FERIAS">Férias</option>
                    <option value="DESLIGADO">Desligado</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-foreground">Dados Bancários</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Banco</label>
                    <input value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Agência</label>
                    <input value={formData.agencia} onChange={e => setFormData({...formData, agencia: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Conta</label>
                    <input value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select value={formData.tipoConta} onChange={e => setFormData({...formData, tipoConta: e.target.value})} className="w-full p-2 border rounded">
                      <option value="Corrente">Corrente</option>
                      <option value="Poupança">Poupança</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 sticky bottom-0 bg-card text-card-foreground rounded-b-lg">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-muted-foreground">Cancelar</button>
              <button onClick={saveFunc} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
