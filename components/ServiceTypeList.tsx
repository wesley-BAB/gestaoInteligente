import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceType } from '../types';
import { Plus, Trash2, Settings, Loader2 } from 'lucide-react';
import { useToast } from './ToastContext';

export const ServiceTypeList: React.FC = () => {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="w-full max-w-[1200px] animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
           <Settings className="w-8 h-8 text-primary-600" />
           Tipos de Serviço
        </h2>
        <p className="text-gray-500 mt-1">Gerencie as categorias de serviços oferecidos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Cadastrar Novo Tipo</h3>
            <form onSubmit={handleAdd} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Consultoria, Design, Desenvolvimento"
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 font-medium"
                >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : <><Plus className="w-5 h-5"/> Salvar</>}
                </button>
            </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">Tipos Cadastrados</h3>
            </div>
            {loading ? (
                <div className="p-6 text-center"><Loader2 className="animate-spin w-6 h-6 text-primary-500 mx-auto"/></div>
            ) : types.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nenhum tipo cadastrado.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {types.map(type => (
                        <li key={type.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span className="font-medium text-gray-800">{type.nome}</span>
                            <button 
                                onClick={() => handleDelete(type.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};