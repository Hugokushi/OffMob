"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Edit, Trash, Printer, X } from "lucide-react";

export default function DocumentosContent() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGerarModalOpen, setIsGerarModalOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<any>(null);

  // Form states
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [camposDinamicos, setCamposDinamicos] = useState<string[]>([]);

  // Generation states
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchModelos();
  }, []);

  useEffect(() => {
    // Auto-detect dynamic fields
    const matches = conteudo.match(/{{([^}]+)}}/g);
    if (matches) {
      const uniqueFields = Array.from(new Set(matches.map(m => m.replace(/{{|}}/g, "").trim())));
      setCamposDinamicos(uniqueFields);
    } else {
      setCamposDinamicos([]);
    }
  }, [conteudo]);

  const fetchModelos = async () => {
    const res = await fetch("/api/documentos");
    if (res.ok) {
      const data = await res.json();
      setModelos(data);
    }
  };

  const openModal = (modelo: any = null) => {
    setCurrentModelo(modelo);
    setTitulo(modelo?.titulo || "");
    setConteudo(modelo?.conteudo || "");
    setCamposDinamicos(modelo?.camposDinamicos || []);
    setIsModalOpen(true);
  };

  const saveModelo = async () => {
    const method = currentModelo ? "PUT" : "POST";
    const url = currentModelo ? `/api/documentos/${currentModelo.id}` : "/api/documentos";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, conteudo, camposDinamicos }),
    });

    setIsModalOpen(false);
    fetchModelos();
  };

  const deleteModelo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await fetch(`/api/documentos/${id}`, { method: "DELETE" });
    fetchModelos();
  };

  const openGerarModal = (modelo: any) => {
    setCurrentModelo(modelo);
    setFormData({});
    setGeneratedDoc("");
    setShowPreview(false);
    setIsGerarModalOpen(true);
  };

  const handleGerarDocumento = () => {
    let finalDoc = currentModelo.conteudo;
    currentModelo.camposDinamicos.forEach((campo: string) => {
      const regex = new RegExp(`{{\\s*${campo}\\s*}}`, "g");
      finalDoc = finalDoc.replace(regex, formData[campo] || `[${campo}]`);
    });
    setGeneratedDoc(finalDoc);
    setShowPreview(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("print-area")?.innerHTML;
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Quick restore of React event listeners
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modelos de Documentos</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelos.map((m) => (
          <div key={m.id} className="bg-card text-card-foreground p-4 rounded-lg shadow border border-border">
            <h3 className="font-semibold text-lg mb-2">{m.titulo}</h3>
            <p className="text-sm text-muted-foreground mb-4">{m.camposDinamicos.length} variáveis dinâmicas</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {m.camposDinamicos.slice(0, 3).map((c: string) => (
                <span key={c} className="bg-muted text-xs px-2 py-1 rounded">{"{{"}{c}{"}}"}</span>
              ))}
              {m.camposDinamicos.length > 3 && <span className="text-xs text-muted-foreground">...</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openGerarModal(m)} className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                <FileText className="w-4 h-4" /> Preencher
              </button>
              <button onClick={() => openModal(m)} className="p-2 border rounded hover:bg-background text-foreground text-muted-foreground">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => deleteModelo(m.id)} className="p-2 border rounded hover:bg-red-50 text-red-600">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{currentModelo ? "Editar Modelo" : "Novo Modelo"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full p-2 border rounded" placeholder="Ex: Contrato de Prestação de Serviços" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Conteúdo</label>
                <p className="text-xs text-muted-foreground mb-2">Use {'{{nome_da_variavel}}'} para criar campos dinâmicos preenchíveis.</p>
                <textarea
                  value={conteudo}
                  onChange={e => setConteudo(e.target.value)}
                  className="w-full p-2 border rounded h-64 font-mono text-sm"
                  placeholder="Eu, {{nome_cliente}}, portador do CPF {{cpf_cliente}}..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Campos Detectados:</label>
                <div className="flex flex-wrap gap-2">
                  {camposDinamicos.length > 0 ? camposDinamicos.map(c => (
                    <span key={c} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">{c}</span>
                  )) : <span className="text-xs text-muted-foreground">Nenhum campo detectado.</span>}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={saveModelo} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {isGerarModalOpen && currentModelo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Preencher: {currentModelo.titulo}</h2>
              <button onClick={() => setIsGerarModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {!showPreview ? (
                <div className="p-6 flex-1 space-y-4">
                  {currentModelo.camposDinamicos.map((campo: string) => (
                    <div key={campo}>
                      <label className="block text-sm font-medium mb-1 capitalize">{campo.replace(/_/g, ' ')}</label>
                      <input
                        className="w-full p-2 border rounded"
                        value={formData[campo] || ""}
                        onChange={(e) => setFormData({ ...formData, [campo]: e.target.value })}
                        placeholder={`Digite ${campo.replace(/_/g, ' ')}...`}
                      />
                    </div>
                  ))}
                  {currentModelo.camposDinamicos.length === 0 && (
                    <p className="text-muted-foreground">Este modelo não possui variáveis dinâmicas.</p>
                  )}
                  <button onClick={handleGerarDocumento} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded">Gerar Documento</button>
                </div>
              ) : (
                <div className="p-6 flex-1 flex flex-col">
                  <div id="print-area" className="flex-1 border p-8 bg-card text-card-foreground min-h-[500px] whitespace-pre-wrap font-serif text-black">
                    {generatedDoc}
                  </div>
                </div>
              )}
            </div>
            {showPreview && (
              <div className="p-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowPreview(false)} className="px-4 py-2 border rounded">Voltar à Edição</button>
                <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
