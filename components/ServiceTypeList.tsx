import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceType } from '../types';
import { Plus, Trash2, Settings, Loader2, X, Tag } from 'lucide-react';
import { useToast } from './ToastContext';

export const ServiceTypeList: React.FC = () => {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tb_tipos_servico')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      setTypes(data as ServiceType[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('tb_tipos_servico').insert([{ nome: newName }]);
    
    if (!error) {
      setNewName('');
      setIsModalOpen(false);
      fetchTypes();
      showToast('Tipo de serviço adicionado!', 'success');
    } else {
      showToast('Erro ao salvar. Talvez esse nome já exista?', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza? Isso não afetará contratos existentes que já usam este nome.')) {
      const { error } = await supabase.from('tb_tipos_servico').delete().eq('id', id);
      if (!error) {
          fetchTypes();
          showToast('Tipo de serviço removido.', 'info');
      } else {
          showToast('Erro ao remover.', 'error');
      }
    }
  };

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
             <Settings className="w-8 h-8 text-primary-600" />
             Tipos de Serviço
          </h2>
          <p className="text-gray-500 mt-1">Gerencie as categorias de serviços oferecidos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all items-center gap-2 font-bold hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Novo Tipo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
                <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto"/></div>
            ) : types.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Nenhum tipo cadastrado.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Serviço</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {types.map(type => (
                                <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-gray-800 text-lg">{type.nome}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button 
                                            onClick={() => handleDelete(type.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                                            title="Excluir tipo"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

         {/* Floating Action Button (Visible on all screens) */}
        <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl shadow-primary-600/40 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center"
            title="Novo Tipo"
        >
            <Plus className="w-7 h-7" />
        </button>

         {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20 relative animate-slide-up">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <div className="bg-primary-100 p-2 rounded-lg">
                            <Plus className="w-6 h-6 text-primary-600" />
                        </div>
                        Novo Tipo de Serviço
                    </h3>
                    
                    <form onSubmit={handleAdd} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome do Serviço</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: Consultoria, Design, Desenvolvimento"
                                className="w-full rounded-xl border border-gray-300 p-3 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                required
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 font-medium"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};