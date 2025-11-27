import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';
import { User } from '../types';
import { Lock, Save, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useToast } from './ToastContext';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast('A nova senha e a confirmação não coincidem.', 'error');
      return;
    }

    if (newPassword.length < 4) {
        showToast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
        return;
    }

    setLoading(true);

    try {
      // 1. Verify current password
      const currentHash = await hashPassword(currentPassword);
      
      const { data: dbUser, error: fetchError } = await supabase
        .from('tb_usuarios')
        .select('*')
        .eq('id', user.id)
        .eq('password', currentHash)
        .single();

      if (fetchError || !dbUser) {
        showToast('A senha atual está incorreta.', 'error');
        setLoading(false);
        return;
      }

      // 2. Hash new password and update
      const newHash = await hashPassword(newPassword);

      const { error: updateError } = await supabase
        .from('tb_usuarios')
        .update({ password: newHash })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // 3. Update local session (optional, mostly for consistency if we stored hash)
      onUpdateUser({ ...user, password: newHash });
      
      showToast('Senha alterada com sucesso!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar senha. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
            Minha Conta
        </h2>
        <p className="text-gray-500 mt-1">Gerencie suas credenciais de acesso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Usuário Logado</p>
                    <h3 className="text-2xl font-bold text-gray-800">{user.username}</h3>
                </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <p>
                    Sua conta está ativa e segura. Lembre-se de não compartilhar sua senha com terceiros.
                </p>
            </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary-500" />
                Alterar Senha
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha Atual</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="password" 
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                            placeholder="Digite sua senha atual"
                        />
                    </div>
                </div>

                <hr className="border-gray-100 my-4" />

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nova Senha</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="password" 
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                            placeholder="Nova senha"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Confirmar Nova Senha</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                            placeholder="Repita a nova senha"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3.5 rounded-xl hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 font-bold shadow-lg shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : (
                            <>
                                <Save className="w-5 h-5" /> Salvar Nova Senha
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};