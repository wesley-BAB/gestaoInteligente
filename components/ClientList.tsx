import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client, User } from '../types';
import { Plus, Trash2, Users, Loader2, Phone, Mail, Search, X } from 'lucide-react';
import { useToast } from './ToastContext';

interface ClientListProps {
  user: User;
}

export const ClientList: React.FC<ClientListProps> = ({ user }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({ nome: '', email: '', telefone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tb_clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true });

    if (!error && data) {
      setClients(data as Client[]);
    } else if (error) {
        console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [user.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nome?.trim()) return;
    setIsSubmitting(true);

    const payload = { ...newClient, user_id: user.id };
    const { error } = await supabase.from('tb_clientes').insert([payload]);
    
    if (!error) {
      setNewClient({ nome: '', email: '', telefone: '' });
      setIsModalOpen(false);
      fetchClients();
      showToast('Cliente cadastrado com sucesso!', 'success');
    } else {
      showToast('Erro ao salvar cliente. Verifique os dados.', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja excluir este cliente?')) {
      const { error } = await supabase.from('tb_clientes').delete().eq('id', id);
      if (!error) {
        fetchClients();
        showToast('Cliente removido.', 'info');
      } else {
        showToast('Erro ao excluir cliente.', 'error');
      }
    }
  };

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Meus Clientes
          </h2>
          <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all items-center gap-2 font-bold hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar por nome, email ou telefone..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none w-full transition-all"
            />
         </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto"/></div>
        ) : filteredClients.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <Users className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-lg">Nenhum cliente encontrado.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-gray-800">{client.nome}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {client.email ? (
                                        <span className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400" /> {client.email}
                                        </span>
                                    ) : <span className="text-gray-300 text-sm">-</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {client.telefone ? (
                                        <span className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" /> {client.telefone}
                                        </span>
                                    ) : <span className="text-gray-300 text-sm">-</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                        onClick={() => handleDelete(client.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                                        title="Excluir cliente"
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
        title="Novo Cliente"
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
                    Novo Cliente
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo</label>
                        <input 
                            type="text" 
                            value={newClient.nome}
                            onChange={e => setNewClient({...newClient, nome: e.target.value})}
                            placeholder="Ex: Empresa ABC Ltda"
                            className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                        <input 
                            type="email" 
                            value={newClient.email}
                            onChange={e => setNewClient({...newClient, email: e.target.value})}
                            placeholder="contato@empresa.com"
                            className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Telefone</label>
                        <input 
                            type="tel" 
                            value={newClient.telefone}
                            onChange={e => setNewClient({...newClient, telefone: e.target.value})}
                            placeholder="(00) 00000-0000"
                            className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
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
                            className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 font-bold shadow-lg shadow-primary-600/20"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : 'Salvar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};