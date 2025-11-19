import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';
import { User } from '../types';
import { UserPlus, Trash2, User as UserIcon, Loader2, Shield } from 'lucide-react';
import { useToast } from './ToastContext';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="w-full max-w-[1200px] animate-fade-in">
       <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
           <Shield className="w-8 h-8 text-primary-500" />
           Gerenciamento de Usuários
        </h2>
        <p className="text-gray-500 mt-1">Controle de acesso ao sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" /> Novo Usuário
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Login</label>
                    <input 
                        type="text" 
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
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
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
                >
                    {submitting ? 'Salvando...' : 'Criar Usuário'}
                </button>
            </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">Usuários Ativos</h3>
            </div>
            {loading ? (
                 <div className="p-6 text-center"><Loader2 className="animate-spin w-6 h-6 text-primary-500 mx-auto"/></div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {users.map(u => (
                        <li key={u.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-100 p-2.5 rounded-xl text-primary-600">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-800">{u.username}</span>
                            </div>
                            <button 
                                onClick={() => handleDelete(u.id)}
                                className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                title="Excluir usuário"
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