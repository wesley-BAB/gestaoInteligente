
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Contract, ContractType, ContractCategory, Client, ServiceType, FinancialType } from '../types';
import { X, Calendar, FilePlus, Loader2, CheckCircle, Users, User as UserIcon, Tag, DollarSign, Clock, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { useToast } from './ToastContext';
import { getDate, parseISO } from 'date-fns';

interface QuickActionModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'appointment' | 'contract';

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ user, isOpen, onClose, onSuccess }) => {
  // Garantir que abre em "contract" (Dinheiro)
  const [activeTab, setActiveTab] = useState<TabType>('contract');
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const { showToast } = useToast();

  const [aptData, setAptData] = useState({ contrato_id: '', data: new Date().toISOString().split('T')[0], obs: '' });
  const [conData, setConData] = useState<Partial<Contract>>({
    cliente: '',
    inicio_contrato: new Date().toISOString().split('T')[0],
    vencimento_contrato: '',
    valor: 0,
    nome_servico: '',
    vencimento_parcela: 1,
    tipo: ContractType.MENSAL,
    categoria: ContractCategory.RECORRENTE,
    tipo_financeiro: FinancialType.RECEITA,
    status: true
  });

  useEffect(() => { 
    if (isOpen) {
      setActiveTab('contract'); // Reset para dinheiro ao abrir
      fetchData(); 
    }
  }, [isOpen]);

  const fetchData = async () => {
    const { data: contractsData } = await supabase.from('tb_contratos').select('*').eq('user_id', user.id).eq('status', true).order('cliente');
    const { data: clientsData } = await supabase.from('tb_clientes').select('*').eq('user_id', user.id).eq('ativo', true).order('nome');
    const { data: typesData } = await supabase.from('tb_tipos_servico').select('*').eq('user_id', user.id).order('nome');

    if (contractsData) setContracts(contractsData);
    if (clientsData) setClients(clientsData);
    if (typesData) {
      setServiceTypes(typesData);
      if (typesData.length > 0 && !conData.nome_servico) setConData(prev => ({ ...prev, nome_servico: typesData[0].nome }));
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptData.contrato_id) return showToast('Selecione um contrato.', 'error');
    setLoading(true);
    const { error } = await supabase.from('tb_agendamentos').insert([{
      contrato_id: parseInt(aptData.contrato_id),
      data_agendamento: aptData.data,
      observacao: aptData.obs,
      feito: false
    }]);
    if (!error) {
      showToast('Apontamento realizado!', 'success');
      onSuccess(); onClose();
    }
    setLoading(false);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conData.cliente) return showToast('Informe o nome do cliente/fornecedor.', 'error');
    setLoading(true);
    let finalPayload = { ...conData, user_id: user.id };
    if (finalPayload.categoria === ContractCategory.AVULSO) {
      finalPayload.vencimento_contrato = finalPayload.inicio_contrato;
      finalPayload.vencimento_parcela = finalPayload.inicio_contrato ? getDate(parseISO(finalPayload.inicio_contrato)) : 1;
      finalPayload.tipo = ContractType.MENSAL;
    }
    const { error } = await supabase.from('tb_contratos').insert([finalPayload]);
    if (!error) {
      showToast('Registro financeiro salvo!', 'success');
      onSuccess(); onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up border border-white/20">
        
        <div className="bg-gray-50 border-b border-gray-100 p-3">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex flex-col">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Movimentação</h3>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">WES Financeiro</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex p-1.5 gap-1.5 bg-gray-200/50 rounded-[30px] mx-2 mb-2">
            <button onClick={() => setActiveTab('contract')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'contract' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><DollarSign className="w-4 h-4" /> Dinheiro</button>
            <button onClick={() => setActiveTab('appointment')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'appointment' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><Clock className="w-4 h-4" /> Agenda</button>
          </div>
        </div>

        <div className="p-10">
          {activeTab === 'contract' ? (
            <form onSubmit={handleSaveContract} className="space-y-6">
              <div className="p-1.5 bg-gray-100 rounded-3xl flex gap-1.5">
                {[FinancialType.RECEITA, FinancialType.DESPESA, FinancialType.INVESTIMENTO].map(t => (
                  <button key={t} type="button" onClick={() => setConData({...conData, tipo_financeiro: t})} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${conData.tipo_financeiro === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>
                    {t === FinancialType.RECEITA ? <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" /> : t === FinancialType.DESPESA ? <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-500" /> : <Landmark className="w-4 h-4 mx-auto mb-1 text-blue-500" />}
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                 <button type="button" onClick={() => setConData({...conData, categoria: ContractCategory.RECORRENTE})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${conData.categoria === ContractCategory.RECORRENTE ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Recorrente</button>
                 <button type="button" onClick={() => setConData({...conData, categoria: ContractCategory.AVULSO})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${conData.categoria === ContractCategory.AVULSO ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Avulso</button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cliente / Fornecedor</label>
                {conData.categoria === ContractCategory.AVULSO ? (
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold outline-none focus:ring-4 focus:ring-primary-50 transition-all" value={conData.cliente} onChange={e => setConData({...conData, cliente: e.target.value})} required placeholder="Nome do favorecido..." />
                ) : (
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold appearance-none outline-none focus:ring-4 focus:ring-primary-50 transition-all" value={conData.cliente} onChange={e => setConData({...conData, cliente: e.target.value})} required>
                    <option value="">Selecionar da lista...</option>
                    {clients.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria / Serviço</label>
                   <select className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold outline-none focus:ring-4 focus:ring-primary-50 transition-all" value={conData.nome_servico} onChange={e => setConData({...conData, nome_servico: e.target.value})} required>
                        {serviceTypes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Valor (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold outline-none focus:ring-4 focus:ring-primary-50 transition-all" value={conData.valor} onChange={e => setConData({...conData, valor: parseFloat(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold outline-none focus:ring-4 focus:ring-primary-50 transition-all" value={conData.inicio_contrato} onChange={e => setConData({...conData, inicio_contrato: e.target.value})} required />
                </div>
              </div>

              <button type="submit" disabled={loading} className={`w-full py-6 rounded-[30px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${conData.tipo_financeiro === FinancialType.DESPESA ? 'bg-red-600 text-white shadow-red-600/30' : conData.tipo_financeiro === FinancialType.INVESTIMENTO ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-green-600 text-white shadow-green-600/30'}`}>
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <CheckCircle className="w-6 h-6" />} Registrar {conData.tipo_financeiro}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveAppointment} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Contrato Relacionado</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold focus:ring-4 focus:ring-primary-50 transition-all appearance-none outline-none" value={aptData.contrato_id} onChange={e => setAptData({...aptData, contrato_id: e.target.value})} required>
                  <option value="">Escolha o cliente...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.cliente} ({c.nome_servico})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold focus:ring-4 focus:ring-primary-50 transition-all outline-none" value={aptData.data} onChange={e => setAptData({...aptData, data: e.target.value})} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição do Apontamento</label>
                  <textarea className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-gray-800 font-bold focus:ring-4 focus:ring-primary-50 transition-all resize-none outline-none" rows={3} placeholder="Relate o que foi feito..." value={aptData.obs} onChange={e => setAptData({...aptData, obs: e.target.value})} required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <CheckCircle className="w-6 h-6" />} Salvar na Agenda
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
