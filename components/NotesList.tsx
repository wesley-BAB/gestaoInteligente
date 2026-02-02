
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, User } from '../types';
import { format, parseISO, isAfter, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotebookPen, Search, Loader2, CheckCircle, Circle, Trash2, Plus } from 'lucide-react';
import { useToast } from './ToastContext';

export const NotesList: React.FC<{ user: User }> = ({ user }) => {
  const [notes, setNotes] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tb_agendamentos')
        .select('*, contrato:tb_contratos(*)')
        .order('data_agendamento', { ascending: false });

      if (data) {
        // Filtra pelo usuário atual (através do contrato vinculado)
        const userNotes = data.filter((n: any) => n.contrato && n.contrato.user_id === user.id);
        setNotes(userNotes as Appointment[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [user.id]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('tb_agendamentos').update({ feito: !currentStatus }).eq('id', id);
    if (!error) {
      showToast(!currentStatus ? 'Concluído!' : 'Reaberto.', 'success');
      fetchNotes();
    }
  };

  const deleteNote = async (id: number) => {
    if (confirm('Deseja excluir esta anotação?')) {
      const { error } = await supabase.from('tb_agendamentos').delete().eq('id', id);
      if (!error) {
        showToast('Anotação removida.', 'info');
        fetchNotes();
      }
    }
  };

  const filtered = notes.filter(n => 
    n.observacao.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.contrato?.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-4">
          <NotebookPen className="w-10 h-10 text-primary-600" />
          Central de Anotações
        </h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 ml-14">Histórico e Observações de Contratos</p>
      </div>

      <div className="mb-8 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 shadow-sm" 
            placeholder="Buscar nas anotações..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 text-primary-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma anotação encontrada</div>
            ) : (
              filtered.map((note) => (
                <div key={note.id} className={`p-8 hover:bg-gray-50 transition-colors flex items-center justify-between group ${note.feito ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-6 flex-1">
                    <button onClick={() => toggleStatus(note.id, !!note.feito)} className={`transition-all ${note.feito ? 'text-green-500' : 'text-gray-300 hover:text-primary-400'}`}>
                      {note.feito ? <CheckCircle className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                    </button>
                    <div>
                      <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">
                        {format(parseISO(note.data_agendamento), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <h3 className={`font-black text-gray-800 text-lg leading-tight ${note.feito ? 'line-through' : ''}`}>{note.observacao}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{note.contrato?.cliente}</span>
                         <span className="text-[10px] text-gray-300">•</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{note.contrato?.nome_servico}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
