'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  X,
  Trash2
} from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
}

interface Agendamento {
  id: string;
  titulo: string;
  descricao: string | null;
  dataHoraInicio: string;
  dataHoraFim: string;
  clienteId: string | null;
  servicoId: string | null;
  status: string;
  cliente?: Cliente;
  servico?: Servico;
}

interface AgendaContentProps {
  clientes: Cliente[];
  servicos: Servico[];
}

const statusColors: Record<string, string> = {
  'AGENDADO': 'bg-blue-500',
  'CONFIRMADO': 'bg-green-500',
  'CANCELADO': 'bg-red-500',
  'CONCLUIDO': 'bg-background text-foreground0',
};

const statusLabels: Record<string, string> = {
  'AGENDADO': 'Agendado',
  'CONFIRMADO': 'Confirmado',
  'CANCELADO': 'Cancelado',
  'CONCLUIDO': 'Concluído',
};

export default function AgendaContent({ clientes, servicos }: AgendaContentProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Agendamento[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    titulo: '',
    descricao: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    clienteId: '',
    servicoId: '',
    status: 'AGENDADO'
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchAgendamentos = async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agendamentos?year=${y}&month=${m + 1}`);
      if (res.ok) {
        const data = await res.json();
        setAgendamentos(data);
      }
    } catch (error) {
      console.error('Error fetching agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos(year, month);
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const daysArray = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      arr.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(i);
    }
    return arr;
  }, [firstDayOfMonth, daysInMonth]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const openModal = (agendamento?: Agendamento, dateObj?: Date) => {
    if (agendamento) {
      setFormData({
        id: agendamento.id,
        titulo: agendamento.titulo,
        descricao: agendamento.descricao || '',
        dataHoraInicio: formatDateTimeForInput(agendamento.dataHoraInicio),
        dataHoraFim: formatDateTimeForInput(agendamento.dataHoraFim),
        clienteId: agendamento.clienteId || '',
        servicoId: agendamento.servicoId || '',
        status: agendamento.status
      });
    } else {
      let start = new Date();
      if (dateObj) {
        start = new Date(dateObj);
        start.setHours(9, 0, 0, 0);
      }
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      setFormData({
        id: '',
        titulo: '',
        descricao: '',
        dataHoraInicio: formatDateTimeForInput(start.toISOString()),
        dataHoraFim: formatDateTimeForInput(end.toISOString()),
        clienteId: '',
        servicoId: '',
        status: 'AGENDADO'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      id: '',
      titulo: '',
      descricao: '',
      dataHoraInicio: '',
      dataHoraFim: '',
      clienteId: '',
      servicoId: '',
      status: 'AGENDADO'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = formData.id ? `/api/agendamentos/${formData.id}` : '/api/agendamentos';
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        closeModal();
        fetchAgendamentos(year, month);
        if (selectedDay) {
            setSelectedDayEvents(null); 
            setSelectedDay(null);
        }
      } else {
        alert('Erro ao salvar agendamento');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro ao salvar agendamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      const res = await fetch(`/api/agendamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        closeModal();
        fetchAgendamentos(year, month);
        setSelectedDayEvents(null);
        setSelectedDay(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getEventsForDay = (day: number) => {
    return agendamentos.filter(a => {
      const aDate = new Date(a.dataHoraInicio);
      return aDate.getFullYear() === year && aDate.getMonth() === month && aDate.getDate() === day;
    });
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="text-xl font-semibold text-foreground w-48 text-center">
            {monthNames[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted/80 border border-border rounded-lg overflow-hidden">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-background text-foreground py-2 text-center text-sm font-semibold text-foreground">
            {day}
          </div>
        ))}
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-card text-card-foreground min-h-[120px]" />;
          }
          const dayEvents = getEventsForDay(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div
              key={day}
              className={`bg-card text-card-foreground min-h-[100px] sm:min-h-[120px] p-2 hover:bg-background text-foreground transition cursor-pointer border-t border-gray-100 relative group`}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDayEvents(dayEvents);
                  setSelectedDay(day);
                } else {
                  openModal(undefined, new Date(year, month, day));
                }
              }}
            >
              <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-foreground'}`}>
                {day}
              </span>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); openModal(event); }}
                    className={`text-xs px-1.5 py-1 rounded-sm text-white truncate shadow-sm cursor-pointer hover:opacity-80 ${statusColors[event.status] || 'bg-blue-500'}`}
                    title={`${new Date(event.dataHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.titulo}`}
                  >
                    {new Date(event.dataHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.titulo}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground font-medium pl-1">
                    + {dayEvents.length - 3} mais
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition hidden sm:block">
                 <button 
                    onClick={(e) => { e.stopPropagation(); openModal(undefined, new Date(year, month, day)); }}
                    className="text-gray-400 hover:text-blue-600 p-1"
                 >
                    <Plus className="w-4 h-4"/>
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Panel */}
      {selectedDayEvents && selectedDay && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Agendamentos - {selectedDay} de {monthNames[month]}</h3>
              <button onClick={() => { setSelectedDayEvents(null); setSelectedDay(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {selectedDayEvents.map(event => (
                <div key={event.id} className="border rounded-md p-3 hover:border-blue-300 transition cursor-pointer" onClick={() => { openModal(event); setSelectedDayEvents(null); setSelectedDay(null); }}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                            <h4 className="font-medium text-foreground">{event.titulo}</h4>
                            {event.cliente && (
                              <p className="text-sm text-muted-foreground mt-0.5">Cliente: {event.cliente.nome}</p>
                            )}
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="w-3.5 h-3.5 mr-1"/>
                                {new Date(event.dataHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                {' - '}
                                {new Date(event.dataHoraFim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full text-white whitespace-nowrap ${statusColors[event.status] || 'bg-blue-500'}`}>
                            {statusLabels[event.status] || event.status}
                        </span>
                    </div>
                </div>
              ))}
              <div className="pt-2 flex justify-center">
                 <button 
                    onClick={() => {
                        setSelectedDayEvents(null); 
                        openModal(undefined, new Date(year, month, selectedDay));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                 >
                    <Plus className="w-4 h-4 mr-1"/> Adicionar Novo
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg my-8">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Reunião de Alinhamento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Início *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dataHoraInicio}
                    onChange={e => setFormData({ ...formData, dataHoraInicio: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fim *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dataHoraFim}
                    onChange={e => setFormData({ ...formData, dataHoraFim: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Serviço</label>
                  <select
                    value={formData.servicoId}
                    onChange={e => setFormData({ ...formData, servicoId: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum</option>
                    {servicos.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AGENDADO">Agendado</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="CONCLUIDO">Concluído</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-4 border-t mt-6">
                {formData.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(formData.id)}
                    className="text-red-600 hover:text-red-800 flex items-center px-3 py-2 rounded-md hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                ) : <div></div>}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-background text-foreground transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
