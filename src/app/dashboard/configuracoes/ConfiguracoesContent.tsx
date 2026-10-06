'use client';

import { useState } from 'react';
import { 
  Building, 
  Palette, 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Crown,
  Settings
} from 'lucide-react';
import { MODULOS, ACOES, MODULO_LABELS, ACAO_LABELS, PLAN_LIMITS, PLAN_LABELS, PLAN_COLORS, getDefaultPermissions, type PermissoesMap, type PlanoType } from '@/lib/permissions';

type TabType = 'empresa' | 'personalizacao' | 'usuarios';

export default function ConfiguracoesContent({ 
  initialEmpresa, 
  initialUsuarios, 
  currentUser,
  initialFuncionarios = []
}: { 
  initialEmpresa: any; 
  initialUsuarios: any[]; 
  currentUser: any; 
  initialFuncionarios?: any[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>('empresa');
  const [empresa, setEmpresa] = useState(initialEmpresa);
  const [usuarios, setUsuarios] = useState(initialUsuarios);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Empresa state
  const [empresaForm, setEmpresaForm] = useState({
    nome: empresa.nome || '',
    nomeFantasia: empresa.nomeFantasia || '',
    cnpj: empresa.cnpj || '',
    email: empresa.email || '',
    telefone: empresa.telefone || ''
  });

  // Personalizacao state
  const [persForm, setPersForm] = useState({
    corPrimaria: empresa.corPrimaria || '#0ea5e9',
    corSecundaria: empresa.corSecundaria || '#f1f5f9',
    logoUrl: empresa.logoUrl || '',
    tema: empresa.tema || 'light'
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('A imagem deve ter no máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPersForm(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Usuarios state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    funcionarioId: '',
    nome: '',
    login: '',
    senha: '',
    cargo: 'PROFISSIONAL'
  });

  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingPerms, setEditingPerms] = useState<PermissoesMap | null>(null);

  const plano: PlanoType = empresa.plano || 'FREE';
  const limit = PLAN_LIMITS[plano].maxUsers;
  const currentCount = usuarios.length;
  const isAtLimit = currentCount >= limit;

  const hasConfigEdit = currentUser.isOwner || (currentUser.permissoes as any)?.find((p: any) => p.modulo === 'configuracoes')?.acoes?.editar;
  const hasConfigCreate = currentUser.isOwner || (currentUser.permissoes as any)?.find((p: any) => p.modulo === 'configuracoes')?.acoes?.criar;
  const hasConfigDelete = currentUser.isOwner || (currentUser.permissoes as any)?.find((p: any) => p.modulo === 'configuracoes')?.acoes?.excluir;

  const handleSaveEmpresa = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/configuracoes/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaForm)
      });
      if (!res.ok) throw new Error('Erro ao salvar empresa');
      const data = await res.json();
      setEmpresa(data);
      setMessage('Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/configuracoes/personalizacao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persForm)
      });
      if (!res.ok) throw new Error('Erro ao salvar personalização');
      const data = await res.json();
      setEmpresa(data);
      setMessage('Personalização salva com sucesso!');
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/configuracoes/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário');
      
      const res2 = await fetch('/api/configuracoes/usuarios');
      const data2 = await res2.json();
      setUsuarios(data2);
      
      setIsNewUserModalOpen(false);
      setNewUserForm({ funcionarioId: '', nome: '', login: '', senha: '', cargo: 'PROFISSIONAL' });
      setMessage('Usuário criado com sucesso!');
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/configuracoes/usuarios/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir usuário');
      }
      setUsuarios(usuarios.filter(u => u.id !== id));
      setMessage('Usuário excluído com sucesso!');
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const openPermsModal = (u: any) => {
    setEditingUser(u);
    setEditingPerms(Array.isArray(u.permissoes) ? u.permissoes : getDefaultPermissions());
    setIsPermsModalOpen(true);
  };

  const togglePerm = (modulo: string, acao: string) => {
    if (!editingPerms) return;
    const newPerms = [...editingPerms];
    const modIndex = newPerms.findIndex(p => p.modulo === modulo);
    if (modIndex >= 0) {
      newPerms[modIndex].acoes[acao as keyof typeof newPerms[0]['acoes']] = !newPerms[modIndex].acoes[acao as keyof typeof newPerms[0]['acoes']];
    }
    setEditingPerms(newPerms);
  };

  const markAllPerms = () => {
    const all = MODULOS.map(modulo => ({
      modulo,
      acoes: Object.fromEntries(ACOES.map(a => [a, true])) as Record<string, boolean>
    })) as PermissoesMap;
    setEditingPerms(all);
  };

  const unmarkAllPerms = () => {
    const none = MODULOS.map(modulo => ({
      modulo,
      acoes: Object.fromEntries(ACOES.map(a => [a, false])) as Record<string, boolean>
    })) as PermissoesMap;
    setEditingPerms(none);
  };

  const savePerms = async () => {
    if (!editingUser) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/configuracoes/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissoes: editingPerms })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar permissões');
      }
      
      const res2 = await fetch('/api/configuracoes/usuarios');
      const data2 = await res2.json();
      setUsuarios(data2);
      
      setIsPermsModalOpen(false);
      setMessage('Permissões atualizadas com sucesso!');
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow border border-border">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'empresa' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="w-4 h-4" />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('personalizacao')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'personalizacao' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4" />
          Personalização
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'usuarios' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários e Permissões
        </button>
      </div>

      <div className="p-6">
        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            {message}
          </div>
        )}

        {/* TAB 1: DADOS DA EMPRESA */}
        {activeTab === 'empresa' && (
          <div className="max-w-2xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={empresaForm.nome}
                  onChange={e => setEmpresaForm({...empresaForm, nome: e.target.value})}
                  className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  disabled={!hasConfigEdit}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={empresaForm.nomeFantasia}
                  onChange={e => setEmpresaForm({...empresaForm, nomeFantasia: e.target.value})}
                  className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  disabled={!hasConfigEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">CNPJ</label>
                <input
                  type="text"
                  value={empresaForm.cnpj}
                  onChange={e => setEmpresaForm({...empresaForm, cnpj: e.target.value})}
                  className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  disabled={!hasConfigEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                <input
                  type="text"
                  value={empresaForm.telefone}
                  onChange={e => setEmpresaForm({...empresaForm, telefone: e.target.value})}
                  className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  disabled={!hasConfigEdit}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Email de Contato</label>
                <input
                  type="email"
                  value={empresaForm.email}
                  onChange={e => setEmpresaForm({...empresaForm, email: e.target.value})}
                  className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  disabled={!hasConfigEdit}
                />
              </div>
            </div>
            
            {hasConfigEdit && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveEmpresa}
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERSONALIZACAO */}
        {activeTab === 'personalizacao' && (
          <div className="max-w-2xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cor Primária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={persForm.corPrimaria}
                    onChange={e => setPersForm({...persForm, corPrimaria: e.target.value})}
                    className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                    disabled={!hasConfigEdit}
                  />
                  <input
                    type="text"
                    value={persForm.corPrimaria}
                    onChange={e => setPersForm({...persForm, corPrimaria: e.target.value})}
                    className="flex-1 p-2 border border-border rounded-md focus:ring-primary focus:border-primary font-mono text-sm uppercase"
                    disabled={!hasConfigEdit}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cor Secundária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={persForm.corSecundaria}
                    onChange={e => setPersForm({...persForm, corSecundaria: e.target.value})}
                    className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                    disabled={!hasConfigEdit}
                  />
                  <input
                    type="text"
                    value={persForm.corSecundaria}
                    onChange={e => setPersForm({...persForm, corSecundaria: e.target.value})}
                    className="flex-1 p-2 border border-border rounded-md focus:ring-primary focus:border-primary font-mono text-sm uppercase"
                    disabled={!hasConfigEdit}
                  />
                </div>
              </div>

              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Tema da Interface</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-colors ${persForm.tema === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                    <input
                      type="radio"
                      name="tema"
                      value="light"
                      checked={persForm.tema === 'light'}
                      onChange={() => {
                        setPersForm({ ...persForm, tema: 'light' });
                        document.documentElement.classList.remove('dark');
                      }}
                      className="sr-only"
                      disabled={!hasConfigEdit}
                    />
                    <div className="w-10 h-7 rounded bg-white border border-gray-200 flex flex-col overflow-hidden shrink-0">
                      <div className="h-2 bg-gray-100 border-b border-gray-200" />
                      <div className="flex-1 flex gap-0.5 p-0.5">
                        <div className="w-2 bg-gray-200 rounded-sm" />
                        <div className="flex-1 bg-gray-50 rounded-sm" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">☀️ Claro</span>
                    {persForm.tema === 'light' && <span className="ml-auto text-primary text-xs font-bold">✓</span>}
                  </label>
                  <label className={`relative cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-colors ${persForm.tema === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                    <input
                      type="radio"
                      name="tema"
                      value="dark"
                      checked={persForm.tema === 'dark'}
                      onChange={() => {
                        setPersForm({ ...persForm, tema: 'dark' });
                        document.documentElement.classList.add('dark');
                      }}
                      className="sr-only"
                      disabled={!hasConfigEdit}
                    />
                    <div className="w-10 h-7 rounded bg-gray-900 border border-gray-700 flex flex-col overflow-hidden shrink-0">
                      <div className="h-2 bg-gray-800 border-b border-gray-700" />
                      <div className="flex-1 flex gap-0.5 p-0.5">
                        <div className="w-2 bg-gray-700 rounded-sm" />
                        <div className="flex-1 bg-gray-800 rounded-sm" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">🌙 Escuro</span>
                    {persForm.tema === 'dark' && <span className="ml-auto text-primary text-xs font-bold">✓</span>}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">A mudança de tema é aplicada imediatamente e salva para todos os usuários da empresa.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Logo da Empresa</label>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    {persForm.logoUrl ? (
                      <img src={persForm.logoUrl} alt="Logo da empresa" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {hasConfigEdit && (
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md bg-card hover:bg-muted transition-colors text-foreground">
                        📁 Selecionar Imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="sr-only"
                        />
                      </label>
                    )}
                    {persForm.logoUrl && hasConfigEdit && (
                      <button
                        type="button"
                        onClick={() => setPersForm({ ...persForm, logoUrl: '' })}
                        className="block text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remover logo
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máximo 2MB. Recomendado: 200×200px.</p>
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-2 mt-2">
                <h4 className="text-sm font-medium text-foreground mb-2">Pré-visualização</h4>
                <div className="border border-border rounded-lg p-6 bg-background text-foreground flex items-center justify-center gap-6">
                  {persForm.logoUrl ? (
                    <img src={persForm.logoUrl} alt="Logo preview" className="h-12 object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground">
                      <Building className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="px-4 py-2 text-white rounded font-medium shadow" style={{ backgroundColor: persForm.corPrimaria }}>
                      Botão Primário
                    </div>
                    <div className="px-4 py-2 text-foreground rounded font-medium shadow border border-border" style={{ backgroundColor: persForm.corSecundaria }}>
                      Cor Secundária
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hasConfigEdit && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSavePers}
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: persForm.corPrimaria }}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USUARIOS E PERMISSOES */}
        {activeTab === 'usuarios' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  Usuários ({currentCount} / {limit === Infinity ? 'Ilimitado' : limit})
                  <span className={`text-xs px-2 py-1 rounded-full text-white font-medium`} style={{ backgroundColor: PLAN_COLORS[plano] }}>
                    {PLAN_LABELS[plano]}
                  </span>
                </h3>
                {isAtLimit && limit !== Infinity && (
                  <p className="text-red-500 text-sm mt-1">
                    Você atingiu o limite de usuários do seu plano. Faça upgrade para adicionar mais.
                  </p>
                )}
                {plano === 'FREE' && (
                  <p className="text-muted-foreground text-sm mt-1">
                    Plano Gratuito permite apenas {limit} usuário.
                  </p>
                )}
              </div>
              
              {hasConfigCreate && (
                <button
                  onClick={() => setIsNewUserModalOpen(true)}
                  disabled={isAtLimit && limit !== Infinity}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-background text-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Login / Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-card text-card-foreground divide-y divide-gray-200">
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-foreground">{u.usuario?.nome}</div>
                          {u.isOwner && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                              <Crown className="w-3 h-3" />
                              Proprietário
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {u.usuario?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="bg-muted text-foreground px-2 py-1 rounded text-xs font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openPermsModal(u)}
                            className="text-primary hover:text-primary/80 flex items-center gap-1"
                            title="Editar Permissões"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          
                          {hasConfigDelete && !u.isOwner && u.usuarioId !== currentUser.usuarioId && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL NOVO USUARIO */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Adicionar Novo Usuário</h3>
              <button onClick={() => setIsNewUserModalOpen(false)} className="text-gray-400 hover:text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vincular a Funcionário</label>
                  {initialFuncionarios && initialFuncionarios.length > 0 ? (
                    <select
                      value={newUserForm.funcionarioId}
                      onChange={e => {
                        const funcId = e.target.value;
                        const func = initialFuncionarios.find((f: any) => f.id === funcId);
                        if (func) {
                          setNewUserForm({
                            ...newUserForm, 
                            funcionarioId: func.id, 
                            nome: func.nome, 
                            login: func.email || '',
                            cargo: 'PROFISSIONAL'
                          });
                        } else {
                          setNewUserForm({...newUserForm, funcionarioId: '', nome: '', login: ''});
                        }
                      }}
                      className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">Selecione um funcionário...</option>
                      {initialFuncionarios.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                      Nenhum funcionário cadastrado. Você precisa cadastrar um funcionário antes de criar um acesso.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Login (Email)</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.login}
                    onChange={e => setNewUserForm({...newUserForm, login: e.target.value})}
                    className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserForm.senha}
                    onChange={e => setNewUserForm({...newUserForm, senha: e.target.value})}
                    className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-background text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERMISSOES */}
      {isPermsModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Permissões de Acesso
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Usuário: <span className="font-medium text-foreground">{editingUser.usuario?.nome}</span> ({editingUser.role})
                </p>
              </div>
              <button onClick={() => setIsPermsModalOpen(false)} className="text-gray-400 hover:text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-background text-foreground">
              {editingUser.isOwner ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Crown className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Este é o usuário proprietário. Ele possui acesso total a todos os módulos e suas permissões não podem ser restritas.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !hasConfigEdit ? (
                <div className="bg-red-50 text-red-700 p-4 rounded text-sm">
                  Você não tem permissão para editar permissões de usuários.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={markAllPerms} className="text-sm text-primary hover:underline font-medium">Marcar Todos</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={unmarkAllPerms} className="text-sm text-muted-foreground hover:underline font-medium">Desmarcar Todos</button>
                  </div>

                  <div className="bg-card text-card-foreground border border-border rounded-lg overflow-x-auto shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-background text-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">Módulo</th>
                          {ACOES.map(acao => (
                            <th key={acao} className="px-2 py-3 text-center font-medium text-muted-foreground uppercase min-w-[80px]">
                              {ACAO_LABELS[acao]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MODULOS.map(modulo => {
                          const modulePerms = editingPerms?.find(p => p.modulo === modulo); const hasModule = modulePerms && Object.values(modulePerms.acoes).some(v => v);
                          return (
                            <tr key={modulo} className="hover:bg-background text-foreground">
                              <td className="px-4 py-3 font-medium text-foreground border-r border-gray-100 bg-background text-foreground/50">
                                <div className="flex items-center gap-2">
                                  {MODULO_LABELS[modulo]}
                                  {hasModule && <Check className="w-3 h-3 text-green-500" />}
                                </div>
                              </td>
                              {ACOES.map(acao => {
                                const isChecked = modulePerms?.acoes[acao as keyof typeof modulePerms.acoes];
                                return (
                                  <td key={`${modulo}-${acao}`} className="px-2 py-3 text-center">
                                    <label className="flex items-center justify-center cursor-pointer h-full w-full">
                                      <input
                                        type="checkbox"
                                        checked={!!isChecked}
                                        onChange={() => togglePerm(modulo, acao)}
                                        className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary"
                                      />
                                    </label>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-card text-card-foreground">
              <button
                type="button"
                onClick={() => setIsPermsModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-background text-foreground"
              >
                Fechar
              </button>
              {!editingUser.isOwner && hasConfigEdit && (
                <button
                  type="button"
                  onClick={savePerms}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
