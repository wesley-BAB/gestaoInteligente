import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, ServiceType, User, Client } from '../types';
import { Eye, Plus, Search, Loader2, FileText, Filter, Users, Pencil, FileSignature } from 'lucide-react';
import { ContractCalendar } from './ContractCalendar';
import { useToast } from './ToastContext';

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
    
    // Fetch contracts
    const { data: contractsData } = await supabase
      .from('tb_contratos')
      .select('*')
      .eq('user_id', user.id)
      .order('cliente', { ascending: true });

    // Fetch service types
    const { data: typesData } = await supabase
      .from('tb_tipos_servico')
      .select('*')
      .order('nome', { ascending: true });

    // Fetch clients
    const { data: clientsData } = await supabase
      .from('tb_clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true });

    if (contractsData) setContracts(contractsData as Contract[]);
    if (clientsData) setClients(clientsData as Client[]);

    if (typesData) {
        setServiceTypes(typesData as ServiceType[]);
        // Only set default service if we are not editing and input is empty
        if(typesData.length > 0 && !newContract.nome_servico && !editingId) {
            setNewContract(prev => ({...prev, nome_servico: typesData[0].nome}));
        }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  // Handle Auto Open Modal (from Home/Revenue FAB)
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

    const payload = {
        ...newContract,
        user_id: user.id
    };

    let error;

    if (editingId) {
        // Update existing
        const { error: updateError } = await supabase
            .from('tb_contratos')
            .update(payload)
            .eq('id', editingId);
        error = updateError;
    } else {
        // Insert new
        const { error: insertError } = await supabase
            .from('tb_contratos')
            .insert([payload]);
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
        {/* Desktop Button - Hidden in favor of FAB */}
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-8 border border-white/20">
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data Início/Serviço</label>
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
    </div>
  );
};