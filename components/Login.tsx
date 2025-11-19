import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2, ArrowRight, Leaf } from 'lucide-react';
import { useToast } from './ToastContext';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      const { data, error: dbError } = await supabase
        .from('tb_usuarios')
        .select('*')
        .eq('username', username)
        .eq('password', hashedPassword)
        .single();

      if (dbError || !data) {
        // Fallback para usuários legados
        const { data: legacyData } = await supabase
            .from('tb_usuarios')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
            
        if (legacyData) {
             onLoginSuccess(legacyData as User);
             return;
        }

        throw new Error('Credenciais inválidas.');
      }

      onLoginSuccess(data as User);
    } catch (err: any) {
      showToast(err.message || 'Erro ao tentar logar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-300 rounded-full blur-3xl opacity-50"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="h-16 w-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200 transform rotate-3">
                 <Leaf className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">WES</h1>
              <p className="text-primary-600 font-medium text-sm tracking-widest uppercase mt-1">Gestão Inteligente</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">Usuário</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 focus:bg-white transition-all"
                    placeholder="Seu nome de usuário"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider ml-1">Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-500/30 mt-8"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <span className="flex items-center gap-2">
                    Entrar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};