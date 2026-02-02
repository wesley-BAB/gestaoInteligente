
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, ServiceType, User, Client, FinancialRecord, FinancialType } from '../types';
import { Eye, Plus, Search, Loader2, FileText, Users, Pencil, FileSignature, DollarSign, CheckCircle, X, Calendar, Trash2, RotateCcw, User as UserIcon, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { ContractCalendar } from './ContractCalendar';
import { useToast } from './ToastContext';
import { addMonths, addWeeks, format, parseISO, isBefore, startOfDay, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractListProps {
  user: User;
  autoOpenModal?: boolean;
  onModalProcessed?: () => void;
}

export const ContractList: React.FC<ContractListProps> = ({ user, autoOpenModal, onModalProcessed }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [displayValue, setDisplayValue] = useState('');
  const { showToast } = useToast();

  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialContract, setFinancialContract] = useState<Contract | null>(null);
  const [installments, setInstallments] = useState<FinancialRecord[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<Partial<Contract>>({
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: contractsData } = await supabase.from('tb_contratos').select('*').eq('user_id', user.id).order('cliente', { ascending: true });
      const { data: typesData } = await supabase.from('tb_tipos_servico').select('*').eq('user_id', user.id).order('nome', { ascending: true });
      const { data: clientsData } = await supabase.from('tb_clientes').select('*').eq('user_id', user.id).order('nome', { ascending: true });

      if (contractsData) setContracts(contractsData as Contract[]);
      if (clientsData) setClients(clientsData as Client[]);
      if (typesData) {
          setServiceTypes(typesData as ServiceType[]);
          if(typesData.length > 0 && !newContract.nome_servico && !editingId) {
              setNewContract(prev => ({...prev, nome_servico: typesData[0].nome}));
          }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  useEffect(() => {
      if (autoOpenModal) {
          handleNewRegister();
          if (onModalProcessed) onModalProcessed();
      }
  }, [autoOpenModal]);

  const formatCurrency = (value: number | string) => {
    if (typeof value === 'number') {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    const numericValue = value.replace(/\D/g, "");
    const floatValue = parseFloat(numericValue) / 100;
    if (isNaN(floatValue)) return "";
    return floatValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setDisplayValue(formatCurrency(rawValue));
    const numericValue = parseFloat(rawValue.replace(/\D/g, "")) / 100;
    setNewContract({ ...newContract, valor: numericValue || 0 });
  };

  const resetForm = () => {
    setEditingId(null);
    setDisplayValue('');
    setNewContract({
      cliente: '',
      inicio_contrato: new Date().toISOString().split('T')[0],
      vencimento_contrato: '',
      valor: 0,
      nome_servico: serviceTypes.length > 0 ? serviceTypes[0].nome : '',
      vencimento_parcela: 1,
      tipo: ContractType.MENSAL,
      categoria: ContractCategory.RECORRENTE,
      tipo_financeiro: FinancialType.RECEITA,
      status: true
    });
  };

  const handleNewRegister = () => { resetForm(); setIsModalOpen(true); };

  const handleEdit = (contract: Contract) => {
      setEditingId(contract.id);
      setDisplayValue(formatCurrency(contract.valor));
      setNewContract({
          cliente: contract.cliente,
          inicio_contrato: contract.inicio_contrato,
          vencimento_contrato: contract.vencimento_contrato || '',
          valor: contract.valor,
          nome_servico: contract.nome_servico,
          vencimento_parcela: contract.vencimento_parcela || 1,
          tipo: contract.tipo,
          categoria: contract.categoria,
          tipo_financeiro: contract.tipo_financeiro || FinancialType.RECEITA,
          status: contract.status
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
      if (confirm('Tem certeza que deseja excluir este contrato? Todos os agendamentos e registros financeiros vinculados também serão excluídos.')) {
          const { error } = await supabase.from('tb_contratos').delete().eq('id', id);
          if (!error) {
              fetchData();
              showToast('Contrato excluído com sucesso.', 'info');
          } else {
              showToast('Erro ao excluir contrato.', 'error');
          }
      }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.cliente) return showToast('Por favor, informe o nome do cliente.', 'error');

    let finalPayload: any = { 
      ...newContract, 
      user_id: user.id,
      vencimento_contrato: newContract.vencimento_contrato || null
    };

    if (finalPayload.categoria === ContractCategory.AVULSO) {
        finalPayload.vencimento_contrato = finalPayload.inicio_contrato;
        finalPayload.vencimento_parcela = finalPayload.inicio_contrato ? getDate(parseISO(finalPayload.inicio_contrato)) : 1;
        finalPayload.tipo = ContractType.MENSAL;
    }

    let error;
    if (editingId) {
        const { error: updateError } = await supabase.from('tb_contratos').update(finalPayload).eq('id', editingId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('tb_contratos').insert([finalPayload]);
        error = insertError;
    }

    if (!error) {
      setIsModalOpen(false);
      resetForm();
      fetchData();
      showToast(editingId ? 'Registro atualizado!' : 'Registro salvo com sucesso!', 'success');
    } else {
      showToast(error.message || 'Erro ao salvar registro.', 'error');
    }
  };

  const handleOpenFinancial = async (contract: Contract) => {
    setFinancialContract(contract);
    setIsFinancialModalOpen(true);
    setLoadingFinancials(true);
    const { data: existingRecords } = await supabase.from('tb_financeiro').select('*').eq('contrato_id', contract.id);
    const dbRecords = (existingRecords as FinancialRecord[]) || [];
    const generated: FinancialRecord[] = [];
    const start = parseISO(contract.inicio_contrato);
    
    if (contract.categoria === ContractCategory.AVULSO) {
        const exists = dbRecords.find(r => r.data_vencimento === contract.inicio_contrato);
        generated.push(exists || { contrato_id: contract.id, data_vencimento: contract.inicio_contrato, valor: contract.valor, status: 'pendente' });
    } else {
        const end = contract.vencimento_contrato ? parseISO(contract.vencimento_contrato) : addMonths(start, 12);
        const limitDate = addMonths(new Date(), 24); 
        const effectiveEnd = isBefore(end, limitDate) ? end : limitDate;
        let i = 0;
        const maxIter = contract.tipo === ContractType.SEMANAL ? 104 : 24;
        while (i < maxIter) {
             let paymentDate = start;
             if (contract.tipo === ContractType.MENSAL || contract.tipo === ContractType.ANUAL) {
                 const dateDate = contract.tipo === ContractType.MENSAL ? addMonths(start, i) : addMonths(start, i * 12);
                 paymentDate = new Date(dateDate.getFullYear(), dateDate.getMonth(), Math.min(contract.vencimento_parcela || 1, new Date(dateDate.getFullYear(), dateDate.getMonth() + 1, 0).getDate()));
             } else if (contract.tipo === ContractType.SEMANAL) paymentDate = addWeeks(start, i);
             if (isBefore(effectiveEnd, paymentDate) && i > 0) break;
             if (contract.vencimento_contrato && isBefore(parseISO(contract.vencimento_contrato), paymentDate)) break;
             const dateStr = format(paymentDate, 'yyyy-MM-dd');
             const exists = dbRecords.find(r => r.data_vencimento === dateStr);
             generated.push(exists || { contrato_id: contract.id, data_vencimento: dateStr, valor: contract.valor, status: 'pendente' });
             i++;
        }
    }
    generated.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
    setInstallments(generated);
    setLoadingFinancials(false);
  };

  const toggleFinancialStatus = async (record: FinancialRecord, newStatus: 'pago' | 'pendente') => {
      const today = new Date().toISOString().split('T')[0];
      let error;
      if (record.id) {
          error = (await supabase.from('tb_financeiro').update(newStatus === 'pago' ? { status: 'pago', data_pagamento: today } : { status: 'pendente', data_pagamento: null }).eq('id', record.id)).error;
      } else if (newStatus === 'pago') {
          error = (await supabase.from('tb_financeiro').insert([{ contrato_id: record.contrato_id, data_vencimento: record.data_vencimento, valor: record.valor, status: 'pago', data_pagamento: today }])).error;
      }
      if (!error) { showToast(newStatus === 'pago' ? 'Parcela baixada!' : 'Parcela reaberta!', 'success'); if (financialContract) handleOpenFinancial(financialContract); }
      else showToast('Erro ao atualizar parcela.', 'error');
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || c.nome_servico.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (categoryFilter === 'todos' || c.categoria === categoryFilter);
  });

  if (selectedContract) return <ContractCalendar contract={selectedContract} onBack={() => setSelectedContract(null)} />;

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-primary-600" />
            Movimentações Financeiras
          </h2>
          <p className="text-gray-500 mt-1">Gerencie suas receitas, despesas e contratos.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
            <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 shadow-sm" placeholder="Buscar cliente ou serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['todos', ContractCategory.RECORRENTE, ContractCategory.AVULSO].map(f => (
                <button key={f} onClick={() => setCategoryFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === f ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {f === 'todos' ? 'Tudo' : f === ContractCategory.RECORRENTE ? 'Recorrentes' : 'Avulsos'}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 text-primary-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Favorecido</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço/Cat.</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fluxo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold text-gray-800">{contract.cliente}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-600">{contract.nome_servico} <span className="text-[10px] bg-gray-100 px-1 rounded">{contract.categoria}</span></div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border ${
                            contract.tipo_financeiro === FinancialType.DESPESA ? 'bg-red-50 text-red-600 border-red-100' :
                            contract.tipo_financeiro === FinancialType.INVESTIMENTO ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-green-50 text-green-600 border-green-100'
                        }`}>
                            {contract.tipo_financeiro}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${contract.tipo_financeiro === FinancialType.DESPESA ? 'text-red-600' : 'text-gray-700'}`}>
                        {contract.tipo_financeiro === FinancialType.DESPESA ? '-' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenFinancial(contract)} className="text-green-600 hover:text-green-700 bg-green-50 p-2 rounded-lg transition-colors"><DollarSign className="w-4 h-4" /></button>
                            <button onClick={() => handleEdit(contract)} className="text-gray-500 hover:text-primary-600 bg-gray-50 p-2 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setSelectedContract(contract)} className="text-primary-600 hover:text-primary-700 bg-primary-50 p-2 rounded-lg transition-colors"><Eye className="w-5 h-5" /></button>
                            <button onClick={() => handleDelete(contract.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button onClick={handleNewRegister} className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center"><Plus className="w-7 h-7" /></button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-8 border border-white/20 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-primary-100 p-3 rounded-xl">{editingId ? <Pencil className="w-6 h-6 text-primary-600" /> : <Plus className="w-6 h-6 text-primary-600" />}</div>
                {editingId ? 'Editar Movimentação' : 'Nova Movimentação'}
            </h2>
            <form onSubmit={handleSaveContract} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2 p-1 bg-gray-100 rounded-2xl flex gap-1">
                {[FinancialType.RECEITA, FinancialType.DESPESA, FinancialType.INVESTIMENTO].map(t => (
                  <button key={t} type="button" onClick={() => setNewContract({...newContract, tipo_financeiro: t})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${newContract.tipo_financeiro === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="md:col-span-2 p-1 bg-gray-50 rounded-2xl flex gap-1">
                 <button type="button" className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${newContract.categoria === ContractCategory.RECORRENTE ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => setNewContract({...newContract, categoria: ContractCategory.RECORRENTE})}>Recorrente</button>
                 <button type="button" className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${newContract.categoria === ContractCategory.AVULSO ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => setNewContract({...newContract, categoria: ContractCategory.AVULSO})}>Avulso</button>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cliente / Favorecido</label>
                <input 
                    type="text" 
                    required 
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" 
                    value={newContract.cliente} 
                    onChange={(e) => setNewContract({...newContract, cliente: e.target.value})} 
                    placeholder="Nome do favorecido..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de Serviço</label>
                <select className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" value={newContract.nome_servico} onChange={(e) => setNewContract({...newContract, nome_servico: e.target.value})}>
                    {serviceTypes.map(type => <option key={type.id} value={type.nome}>{type.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Valor</label>
                <input 
                    type="text" 
                    required 
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" 
                    value={displayValue} 
                    onChange={handleValueChange} 
                    placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data</label>
                <input type="date" required className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" value={newContract.inicio_contrato} onChange={(e) => setNewContract({...newContract, inicio_contrato: e.target.value})} />
              </div>

              {newContract.categoria === ContractCategory.RECORRENTE && (
                  <>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Vencimento Contrato</label>
                        <input type="date" required className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" value={newContract.vencimento_contrato} onChange={(e) => setNewContract({...newContract, vencimento_contrato: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dia Venc. Parcela</label>
                        <input type="number" min="1" max="31" required className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" value={newContract.vencimento_parcela} onChange={(e) => setNewContract({...newContract, vencimento_parcela: parseInt(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Periodicidade</label>
                        <select className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 focus:ring-2 focus:ring-primary-200 outline-none" value={newContract.tipo} onChange={(e) => setNewContract({...newContract, tipo: e.target.value as ContractType})}>
                            <option value={ContractType.MENSAL}>Mensal</option>
                            <option value={ContractType.SEMANAL}>Semanal</option>
                            <option value={ContractType.ANUAL}>Anual</option>
                        </select>
                    </div>
                  </>
              )}
               
              <div className="md:col-span-2 mt-4 flex gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-bold">Cancelar</button>
                <button type="submit" className={`flex-1 px-6 py-4 rounded-xl transition-all shadow-lg font-bold text-white ${newContract.tipo_financeiro === FinancialType.DESPESA ? 'bg-red-600' : 'bg-primary-600'}`}>{editingId ? 'Atualizar' : 'Salvar Registro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

       {isFinancialModalOpen && financialContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-600" /> Gestão de Parcelas</h2><p className="text-sm text-gray-500">{financialContract.cliente}</p></div>
              <button onClick={() => setIsFinancialModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               {loadingFinancials ? (<div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-primary-500"/></div>) : (
                   <table className="w-full text-left">
                       <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                           <tr><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ação</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                           {installments.map((inst, idx) => (
                               <tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-800 font-medium">{format(parseISO(inst.data_vencimento), 'dd/MM/yyyy')}</td><td className="px-4 py-3 text-gray-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.valor)}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${inst.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inst.status}</span></td><td className="px-4 py-3 text-right">{inst.status === 'pendente' ? (<button onClick={() => toggleFinancialStatus(inst, 'pago')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold">Baixar</button>) : (<div className="flex items-center justify-end gap-2"><span className="text-gray-400 text-xs"><CheckCircle className="w-3 h-3 inline mr-1" /> Pago</span><button onClick={() => toggleFinancialStatus(inst, 'pendente')} className="text-red-500 hover:bg-red-50 p-1 rounded"><RotateCcw className="w-4 h-4" /></button></div>)}</td></tr>
                           ))}
                       </tbody>
                   </table>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
