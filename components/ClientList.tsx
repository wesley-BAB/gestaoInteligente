import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client, User } from '../types';
import { Plus, Trash2, Users, Loader2, Phone, Mail, Search } from 'lucide-react';
import { useToast } from './ToastContext';

interface ClientListProps {
  user: User;
}

export const ClientList: React.FC<ClientListProps> = ({ user }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Fail silently if table doesn't exist yet, or show error
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
    <div className="w-full max-w-[1400px] animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
           <Users className="w-8 h-8 text-primary-600" />
           Meus Clientes
        </h2>
        <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes para facilitar os contratos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Novo Cliente</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo</label>
                        <input 
                            type="text" 
                            value={newClient.nome}
                            onChange={e => setNewClient({...newClient, nome: e.target.value})}
                            placeholder="Ex: Empresa ABC Ltda"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Telefone</label>
                        <input 
                            type="tel" 
                            value={newClient.telefone}
                            onChange={e => setNewClient({...newClient, telefone: e.target.value})}
                            placeholder="(00) 00000-0000"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 font-bold shadow-lg shadow-primary-600/20"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : <><Plus className="w-5 h-5"/> Cadastrar Cliente</>}
                    </button>
                </form>
            </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-700">Clientes Cadastrados</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-primary-500 outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto"/></div>
                ) : filteredClients.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Users className="w-10 h-10 opacity-20 mb-2" />
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <div key={client.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group gap-4">
                                <div>
                                    <div className="font-bold text-gray-800 text-lg">{client.nome}</div>
                                    <div className="flex flex-wrap gap-3 mt-1">
                                        {client.email && (
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {client.email}
                                            </span>
                                        )}
                                        {client.telefone && (
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {client.telefone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(client.id)}
                                    className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all self-start sm:self-center opacity-0 group-hover:opacity-100"
                                    title="Excluir cliente"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};