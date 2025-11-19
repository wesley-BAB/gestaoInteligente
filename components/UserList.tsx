import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';
import { User } from '../types';
import { UserPlus, Trash2, User as UserIcon, Loader2, Shield, X, Plus } from 'lucide-react';
import { useToast } from './ToastContext';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tb_usuarios').select('*').order('id');
    if (data) setUsers(data as User[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
        const hashedPassword = await hashPassword(password);
        const { error } = await supabase.from('tb_usuarios').insert([{ username, password: hashedPassword }]);
        
        if (!error) {
        setUsername('');
        setPassword('');
        setIsModalOpen(false);
        fetchUsers();
        showToast('Usuário criado com sucesso.', 'success');
        } else {
        showToast('Erro ao criar usuário. Verifique se já existe.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Erro ao processar senha.', 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if(confirm('Excluir usuário?')) {
        const { error } = await supabase.from('tb_usuarios').delete().eq('id', id);
        if(!error) {
            fetchUsers();
            showToast('Usuário excluído.', 'info');
        } else {
            showToast('Erro ao excluir usuário.', 'error');
        }
    }
  };

  return (
    <div className="w-full max-w-[1200px] animate-fade-in pb-20">
       <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-500 mt-1">Controle de acesso ao sistema.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center gap-2 font-bold hover:-translate-y-0.5"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">Usuários Ativos</h3>
            </div>
            {loading ? (
                 <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto"/></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Login</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{u.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-gray-800">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button 
                                            onClick={() => handleDelete(u.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                                            title="Excluir usuário"
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
            title="Novo Usuário"
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
                            <UserPlus className="w-6 h-6 text-primary-600" />
                        </div>
                        Novo Usuário
                    </h3>

                    <form onSubmit={handleAddUser} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Login</label>
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                placeholder="Nome de usuário"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                placeholder="••••••••"
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
                                disabled={submitting}
                                className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
                            >
                                {submitting ? 'Salvando...' : 'Criar Usuário'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};