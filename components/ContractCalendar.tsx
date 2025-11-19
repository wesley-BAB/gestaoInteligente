import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Pencil, CheckCircle, Circle } from 'lucide-react';
import { Contract, Appointment } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface ContractCalendarProps {
  contract: Contract;
  onBack: () => void;
}

export const ContractCalendar: React.FC<ContractCalendarProps> = ({ contract, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newObs, setNewObs] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tb_agendamentos')
      .select('*')
      .eq('contrato_id', contract.id);

    if (!error && data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.id]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
      const { error } = await supabase
        .from('tb_agendamentos')
        .update({ feito: !currentStatus })
        .eq('id', id);

      if(!error) {
          fetchAppointments();
          showToast(!currentStatus ? 'Marcado como feito' : 'Marcado como pendente', 'success');
      }
  }

  const openNewModal = () => {
      setEditingId(null);
      setNewDate('');
      setNewObs('');
      setIsModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
      setEditingId(apt.id);
      setNewDate(apt.data_agendamento);
      setNewObs(apt.observacao);
      setIsModalOpen(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    if (editingId) {
        // Update existing
        const { error } = await supabase
            .from('tb_agendamentos')
            .update({
                data_agendamento: newDate,
                observacao: newObs
            })
            .eq('id', editingId);

        if (!error) {
            setIsModalOpen(false);
            setEditingId(null);
            setNewDate('');
            setNewObs('');
            fetchAppointments();
            showToast('Agendamento atualizado!', 'success');
        } else {
            showToast('Erro ao atualizar agendamento', 'error');
        }

    } else {
        // Create new
        const { error } = await supabase.from('tb_agendamentos').insert([
        {
            contrato_id: contract.id,
            data_agendamento: newDate,
            observacao: newObs,
            feito: false
        }
        ]);

        if (!error) {
            setIsModalOpen(false);
            setNewDate('');
            setNewObs('');
            fetchAppointments();
            showToast('Agendamento criado!', 'success');
        } else {
            showToast('Erro ao criar agendamento', 'error');
        }
    }
    
    setSubmitLoading(false);
  };

  const handleDelete = async (id: number) => {
    if(confirm('Deseja realmente excluir este agendamento?')) {
        const { error } = await supabase.from('tb_agendamentos').delete().eq('id', id);
        if(!error) {
            fetchAppointments();
            showToast('Agendamento excluído.', 'info');
        } else {
            showToast('Erro ao excluir.', 'error');
        }
    }
  }

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday

  // Create empty slots for days before the 1st of the month
  const prefixDays = Array.from({ length: startDayOfWeek });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-primary-600 hover:text-primary-800 font-medium flex items-center mb-2">
             &larr; Voltar para lista
          </button>
          <h2 className="text-3xl font-bold text-gray-800">{contract.cliente}</h2>
          <p className="text-gray-500">{contract.nome_servico} - {contract.tipo}</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-50 border-b border-primary-100">
          <button onClick={prevMonth} className="p-1 hover:bg-primary-200 rounded-full text-primary-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-lg font-bold text-primary-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button onClick={nextMonth} className="p-1 hover:bg-primary-200 rounded-full text-primary-700">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-gray-200 gap-px">
          {/* Weekday Headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Empty slots */}
          {prefixDays.map((_, i) => (
            <div key={`prefix-${i}`} className="bg-white min-h-[120px]"></div>
          ))}

          {/* Days */}
          {daysInMonth.map((day) => {
            const dayAppointments = appointments.filter(apt => 
              isSameDay(parseISO(apt.data_agendamento), day)
            );

            return (
              <div key={day.toString()} className={`bg-white min-h-[120px] p-2 relative group hover:bg-gray-50 transition-colors ${isToday(day) ? 'bg-primary-50/30' : ''}`}>
                <div className={`text-right mb-1 ${isToday(day) ? 'font-bold text-primary-600' : 'text-gray-500'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.map(apt => (
                    <div key={apt.id} className={`text-xs p-1.5 rounded border truncate relative group/apt pr-12 ${apt.feito ? 'bg-gray-100 text-gray-500 line-through border-gray-200' : 'bg-primary-100 text-primary-800 border-primary-200'}`}>
                      <span title={apt.observacao}>{apt.observacao}</span>
                      
                      {/* Actions */}
                      <div className="absolute right-1 top-1 hidden group-hover/apt:flex gap-1 bg-white/80 rounded p-0.5">
                         <button 
                            onClick={(e) => { e.stopPropagation(); toggleStatus(apt.id, !!apt.feito); }}
                            className={`${apt.feito ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                            title="Marcar como feito"
                          >
                            {apt.feito ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                          </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(apt); }}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(apt.id); }}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New/Edit Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            <form onSubmit={handleSaveAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                  <textarea
                    required
                    value={newObs}
                    onChange={(e) => setNewObs(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Detalhes do agendamento..."
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitLoading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};