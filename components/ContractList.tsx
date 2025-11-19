import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, ServiceType, User, Client, FinancialRecord } from '../types';
import { Eye, Plus, Search, Loader2, FileText, Users, Pencil, FileSignature, DollarSign, CheckCircle, X, Calendar } from 'lucide-react';
import { ContractCalendar } from './ContractCalendar';
import { useToast } from './ToastContext';
import { addMonths, format, parseISO, isBefore, startOfDay, getDate } from 'date-fns';
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
  const { showToast } = useToast();

  // Financial Modal State
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialContract, setFinancialContract] = useState<Contract | null>(null);
  const [installments, setInstallments] = useState<FinancialRecord[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    cliente: '',
    inicio_contrato: '',
    vencimento_contrato: '',
    valor: 0,
    nome_servico: '',
    vencimento_parcela: 1,
    tipo: ContractType.MENSAL,
    categoria: ContractCategory.RECORRENTE,
    status: true
  });

  const fetchData = async () => {
    setLoading(true);
    
    const { data: contractsData } = await supabase
      .from('tb_contratos')
      .select('*')
      .eq('user_id', user.id)
      .order('cliente', { ascending: true });

    const { data: typesData } = await supabase
      .from('tb_tipos_servico')
      .select('*')
      .order('nome', { ascending: true });

    const { data: clientsData } = await supabase
      .from('tb_clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true });

    if (contractsData) setContracts(contractsData as Contract[]);
    if (clientsData) setClients(clientsData as Client[]);

    if (typesData) {
        setServiceTypes(typesData as ServiceType[]);
        if(typesData.length > 0 && !newContract.nome_servico && !editingId) {
            setNewContract(prev => ({...prev, nome_servico: typesData[0].nome}));
        }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  useEffect(() => {
      if (autoOpenModal) {
          handleNewRegister();
          if (onModalProcessed) onModalProcessed();
      }
  }, [autoOpenModal]);

  const resetForm = () => {
    setEditingId(null);
    setNewContract({
      cliente: '',
      inicio_contrato: '',
      vencimento_contrato: '',
      valor: 0,
      nome_servico: serviceTypes.length > 0 ? serviceTypes[0].nome : '',
      vencimento_parcela: 1,
      tipo: ContractType.MENSAL,
      categoria: ContractCategory.RECORRENTE,
      status: true
    });
  };

  const handleNewRegister = () => {
      resetForm();
      setIsModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
      setEditingId(contract.id);
      setNewContract({
          cliente: contract.cliente,
          inicio_contrato: contract.inicio_contrato,
          vencimento_contrato: contract.vencimento_contrato || '',
          valor: contract.valor,
          nome_servico: contract.nome_servico,
          vencimento_parcela: contract.vencimento_parcela || 1,
          tipo: contract.tipo,
          categoria: contract.categoria,
          status: contract.status
      });
      setIsModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.cliente) {
        showToast('Por favor, selecione um cliente.', 'error');
        return;
    }

    // Lógica de Correção para Avulso
    // Se for avulso, preenchemos as datas de vencimento com a mesma data de início
    // para evitar erro de constraints no banco de dados
    let finalPayload = { ...newContract, user_id: user.id };

    if (finalPayload.categoria === ContractCategory.AVULSO) {
        finalPayload.vencimento_contrato = finalPayload.inicio_contrato;
        // Se inicio_contrato existir, pega o dia, senão dia 1
        const day = finalPayload.inicio_contrato ? getDate(parseISO(finalPayload.inicio_contrato)) : 1;
        finalPayload.vencimento_parcela = day;
        finalPayload.tipo = ContractType.MENSAL; // Valor padrão técnico
    }

    let error;

    if (editingId) {
        const { error: updateError } = await supabase
            .from('tb_contratos')
            .update(finalPayload)
            .eq('id', editingId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('tb_contratos')
            .insert([finalPayload]);
        error = insertError;
    }

    if (!error) {
      setIsModalOpen(false);
      resetForm();
      fetchData();
      showToast(editingId ? 'Registro atualizado!' : 'Contrato salvo com sucesso!', 'success');
    } else {
      showToast('Erro ao salvar registro.', 'error');
      console.error(error);
    }
  };

  // --- Financial Logic ---
  const handleOpenFinancial = async (contract: Contract) => {
    setFinancialContract(contract);
    setIsFinancialModalOpen(true);
    setLoadingFinancials(true);

    // 1. Fetch existing financial records
    const { data: existingRecords } = await supabase
      .from('tb_financeiro')
      .select('*')
      .eq('contrato_id', contract.id);

    const dbRecords = (existingRecords as FinancialRecord[]) || [];
    
    // 2. Generate virtual installments based on contract
    const generated: FinancialRecord[] = [];
    const start = parseISO(contract.inicio_contrato);
    
    if (contract.categoria === ContractCategory.AVULSO) {
        // Avulso: just one installment at start date
        const exists = dbRecords.find(r => r.data_vencimento === contract.inicio_contrato);
        if (exists) {
            generated.push(exists);
        } else {
            generated.push({
                contrato_id: contract.id,
                data_vencimento: contract.inicio_contrato,
                valor: contract.valor,
                status: 'pendente'
            });
        }
    } else {
        // Recorrente: Generate for next 12 months or until contract end
        const end = contract.vencimento_contrato ? parseISO(contract.vencimento_contrato) : addMonths(start, 12);
        // Limit generation to reasonable amount (e.g., 24 months max for view)
        const limitDate = addMonths(new Date(), 12); 
        const effectiveEnd = isBefore(end, limitDate) ? end : limitDate;

        let current = start;
        // Adjust current to match 'vencimento_parcela' day if needed, simplified here to month iteration
        // We use the day of 'inicio_contrato' or 'vencimento_parcela'
        const dayOfPayment = contract.vencimento_parcela || 1;
        
        // Align current date to the payment day of the starting month
        // (Logic simplified: Just iterate months from start)
        let i = 0;
        while (i < 24) { // Safety break
             const dateDate = addMonths(start, i);
             // Set the day
             const year = dateDate.getFullYear();
             const month = dateDate.getMonth();
             // Handle end of month overflow (e.g. 31st Feb)
             const paymentDate = new Date(year, month, Math.min(dayOfPayment, new Date(year, month + 1, 0).getDate()));
             
             const dateStr = format(paymentDate, 'yyyy-MM-dd');
             
             if (isBefore(effectiveEnd, paymentDate) && i > 0) break;

             // Check if exists in DB
             const exists = dbRecords.find(r => r.data_vencimento === dateStr);
             
             if (exists) {
                 generated.push(exists);
             } else {
                 generated.push({
                     contrato_id: contract.id,
                     data_vencimento: dateStr,
                     valor: contract.valor,
                     status: 'pendente'
                 });
             }
             i++;
             
             if (contract.vencimento_contrato && isBefore(parseISO(contract.vencimento_contrato), paymentDate)) break;
        }
    }
    
    // Sort by date
    generated.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
    setInstallments(generated);
    setLoadingFinancials(false);
  };

  const handleMarkAsPaid = async (record: FinancialRecord) => {
      if (record.status === 'pago') return; // Already paid

      const today = new Date().toISOString().split('T')[0];
      
      let error;

      if (record.id) {
          // Update existing
          const { error: upError } = await supabase
            .from('tb_financeiro')
            .update({ status: 'pago', data_pagamento: today })
            .eq('id', record.id);
          error = upError;
      } else {
          // Insert new as paid
          const { error: inError } = await supabase
            .from('tb_financeiro')
            .insert([{
                contrato_id: record.contrato_id,
                data_vencimento: record.data_vencimento,
                valor: record.valor,
                status: 'pago',
                data_pagamento: today
            }]);
          error = inError;
      }

      if (!error) {
          showToast('Parcela baixada com sucesso!', 'success');
          if (financialContract) handleOpenFinancial(financialContract); // Reload
      } else {
          showToast('Erro ao baixar parcela.', 'error');
          console.error(error);
      }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.nome_servico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || c.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (selectedContract) {
    return <ContractCalendar contract={selectedContract} onBack={() => setSelectedContract(null)} />;
  }

  return (
    <div className="w-full max-w-[1600px] animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-primary-600" />
            Contratos & Avulsos
          </h2>
          <p className="text-gray-500 mt-1">Gerencie seus contratos recorrentes e serviços pontuais.</p>
        </div>
        <button
          onClick={handleNewRegister}
          className="hidden bg-primary-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all items-center gap-2 font-bold hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Novo Registro
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all shadow-sm"
            placeholder="Buscar por cliente ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <button 
                onClick={() => setCategoryFilter('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === 'todos' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
                Todos
            </button>
            <button 
                onClick={() => setCategoryFilter(ContractCategory.RECORRENTE)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === ContractCategory.RECORRENTE ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
                Recorrentes
            </button>
            <button 
                onClick={() => setCategoryFilter(ContractCategory.AVULSO)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === ContractCategory.AVULSO ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
                Avulsos
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredContracts.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <FileText className="w-10 h-10 opacity-20" />
                            <p>Nenhum registro encontrado.</p>
                        </div>
                     </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-800">{contract.cliente}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{contract.nome_servico}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border ${
                            contract.categoria === ContractCategory.AVULSO
                                ? 'bg-orange-50 text-orange-600 border-orange-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {contract.categoria}
                            </span>
                            {contract.categoria === ContractCategory.RECORRENTE && (
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                                    {contract.tipo}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleOpenFinancial(contract)}
                                className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors"
                                title="Financeiro / Baixa de Parcelas"
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleEdit(contract)}
                                className="text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 p-2 rounded-lg transition-colors"
                                title="Editar Registro"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setSelectedContract(contract)}
                                className="text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 p-2 rounded-lg transition-colors"
                                title="Ver Detalhes e Agendamentos"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Button (Visible on all screens) */}
      <button
        onClick={handleNewRegister}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl shadow-primary-600/40 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center"
        title="Novo Registro"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal - Create or Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-8 border border-white/20 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-primary-100 p-3 rounded-xl">
                    {editingId ? <Pencil className="w-6 h-6 text-primary-600" /> : <Plus className="w-6 h-6 text-primary-600" />}
                </div>
                {editingId ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <form onSubmit={handleSaveContract} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Selector */}
              <div className="md:col-span-2 p-1 bg-gray-100 rounded-xl flex">
                 <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newContract.categoria === ContractCategory.RECORRENTE ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setNewContract({...newContract, categoria: ContractCategory.RECORRENTE})}
                 >
                    Contrato Recorrente
                 </button>
                 <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newContract.categoria === ContractCategory.AVULSO ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setNewContract({...newContract, categoria: ContractCategory.AVULSO})}
                 >
                    Serviço Avulso
                 </button>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cliente</label>
                {clients.length > 0 ? (
                     <div className="relative">
                        <select
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all appearance-none"
                            value={newContract.cliente}
                            onChange={(e) => setNewContract({...newContract, cliente: e.target.value})}
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                        <Users className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                ) : (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                        Você precisa cadastrar clientes primeiro na aba "Meus Clientes".
                    </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de Serviço</label>
                {serviceTypes.length > 0 ? (
                    <select
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                        value={newContract.nome_servico}
                        onChange={(e) => setNewContract({...newContract, nome_servico: e.target.value})}
                    >
                        {serviceTypes.map(type => (
                            <option key={type.id} value={type.nome}>{type.nome}</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-red-500 text-sm mb-2">Nenhum tipo de serviço cadastrado.</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                  value={newContract.valor}
                  onChange={(e) => setNewContract({...newContract, valor: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                   {newContract.categoria === ContractCategory.AVULSO ? 'Data do Serviço' : 'Início do Contrato'}
                </label>
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                  value={newContract.inicio_contrato}
                  onChange={(e) => setNewContract({...newContract, inicio_contrato: e.target.value})}
                />
              </div>

              {newContract.categoria === ContractCategory.RECORRENTE && (
                  <>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Vencimento Contrato</label>
                        <input
                        type="date"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                        value={newContract.vencimento_contrato}
                        onChange={(e) => setNewContract({...newContract, vencimento_contrato: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dia Venc. Parcela</label>
                        <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                        value={newContract.vencimento_parcela}
                        onChange={(e) => setNewContract({...newContract, vencimento_parcela: parseInt(e.target.value)})}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Periodicidade</label>
                        <select
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                        value={newContract.tipo}
                        onChange={(e) => setNewContract({...newContract, tipo: e.target.value as ContractType})}
                        >
                        <option value={ContractType.MENSAL}>Mensal</option>
                        <option value={ContractType.ANUAL}>Anual</option>
                        </select>
                    </div>
                  </>
              )}
               
              <div className="md:col-span-2 mt-4 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 font-bold"
                >
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Financial Modal */}
       {isFinancialModalOpen && financialContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      Gestão Financeira
                  </h2>
                  <p className="text-sm text-gray-500">{financialContract.cliente} - {financialContract.nome_servico}</p>
              </div>
              <button onClick={() => setIsFinancialModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                  <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               {loadingFinancials ? (
                   <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-primary-500"/></div>
               ) : (
                   <div className="space-y-1">
                       {installments.length === 0 ? (
                           <div className="text-center py-8 text-gray-400">Nenhuma parcela prevista encontrada.</div>
                       ) : (
                           <table className="w-full">
                               <thead className="bg-gray-50 text-left text-xs uppercase font-bold text-gray-500">
                                   <tr>
                                       <th className="px-4 py-3 rounded-l-lg">Vencimento</th>
                                       <th className="px-4 py-3">Valor</th>
                                       <th className="px-4 py-3">Status</th>
                                       <th className="px-4 py-3 text-right rounded-r-lg">Ação</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-50">
                                   {installments.map((inst, idx) => (
                                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                           <td className="px-4 py-3 text-gray-800 font-medium">
                                               {format(parseISO(inst.data_vencimento), 'dd/MM/yyyy')}
                                           </td>
                                           <td className="px-4 py-3 text-gray-600">
                                               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.valor)}
                                           </td>
                                           <td className="px-4 py-3">
                                               <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${inst.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                   {inst.status}
                                               </span>
                                               {inst.data_pagamento && <div className="text-[10px] text-gray-400 mt-1">Pago em: {format(parseISO(inst.data_pagamento), 'dd/MM')}</div>}
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               {inst.status === 'pendente' ? (
                                                   <button 
                                                     onClick={() => handleMarkAsPaid(inst)}
                                                     className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-sm shadow-green-600/20"
                                                   >
                                                       Baixar
                                                   </button>
                                               ) : (
                                                   <span className="text-gray-400 text-xs flex items-center justify-end gap-1">
                                                       <CheckCircle className="w-3 h-3" /> Baixado
                                                   </span>
                                               )}
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       )}
                   </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};