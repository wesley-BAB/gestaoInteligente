import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, User } from '../types';
import { addMonths, addYears, format, parseISO, isBefore, isAfter, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, Loader2, Calendar, Plus, Filter } from 'lucide-react';

interface RevenueProps {
    user: User;
    onQuickAction: () => void;
}

interface ProvisionItem {
    id: number;
    client: string;
    amount: number;
    type: string;
    category: string;
    service: string;
    date: string;
}

export const RevenueProvision: React.FC<RevenueProps> = ({ user, onQuickAction }) => {
  const [loading, setLoading] = useState(true);
  const [provisionItems, setProvisionItems] = useState<ProvisionItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Date Range State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    const calculateRevenue = async () => {
      setLoading(true);
      
      const { data } = await supabase.from('tb_contratos').select('*').eq('status', true).eq('user_id', user.id);
      const contracts = data as Contract[] || [];

      const items: ProvisionItem[] = [];
      const startRange = parseISO(startDate);
      const endRange = parseISO(endDate);
      // Set endRange to end of day to include matches
      endRange.setHours(23, 59, 59, 999);

      contracts.forEach(contract => {
          const contractStart = parseISO(contract.inicio_contrato);
          
          if (contract.categoria === ContractCategory.AVULSO) {
              // Avulso: Single date check
              // We check if contractStart is within range
              if ((isAfter(contractStart, startRange) || isSameDay(contractStart, startRange)) && 
                  (isBefore(contractStart, endRange) || isSameDay(contractStart, endRange))) {
                  
                  items.push({
                      id: contract.id,
                      client: contract.cliente,
                      amount: Number(contract.valor),
                      type: contract.tipo,
                      category: contract.categoria,
                      service: contract.nome_servico,
                      date: contract.inicio_contrato
                  });
              }
          } else {
              // Recorrente: Generate occurrences
              const contractEnd = contract.vencimento_contrato ? parseISO(contract.vencimento_contrato) : addYears(new Date(), 5); // Limit infinite
              
              let currentPaymentDate = contractStart;
              // Adjust start based on pay day if needed, simplified to start date loop
              
              // We loop from contract start until we pass the range end or pass contract end
              while (isBefore(currentPaymentDate, endRange) || isSameDay(currentPaymentDate, endRange)) {
                  
                  // If current payment date is AFTER contract end, stop
                  if (contract.vencimento_contrato && isAfter(currentPaymentDate, contractEnd)) break;

                  // Check if current payment date is inside the selection range
                  if ((isAfter(currentPaymentDate, startRange) || isSameDay(currentPaymentDate, startRange)) &&
                      (isBefore(currentPaymentDate, endRange) || isSameDay(currentPaymentDate, endRange))) {
                      
                      items.push({
                        id: contract.id,
                        client: contract.cliente,
                        amount: Number(contract.valor),
                        type: contract.tipo,
                        category: contract.categoria,
                        service: contract.nome_servico,
                        date: format(currentPaymentDate, 'yyyy-MM-dd')
                    });
                  }

                  // Increment date based on periodicity
                  if (contract.tipo === ContractType.MENSAL) {
                      currentPaymentDate = addMonths(currentPaymentDate, 1);
                  } else {
                      currentPaymentDate = addYears(currentPaymentDate, 1);
                  }
              }
          }
      });

      // Sort by date
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setProvisionItems(items);
      setTotalAmount(items.reduce((acc, item) => acc + item.amount, 0));
      
      setLoading(false);
    };

    calculateRevenue();
  }, [user.id, startDate, endDate]);

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
       <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            Provisão de Receita
            </h2>
            <p className="text-gray-500 mt-1">Fluxo de caixa previsto por período.</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">Período:</span>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <span className="text-gray-400">até</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary-500 w-10 h-10"/></div>
      ) : (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-600/20 overflow-hidden text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="text-primary-100 font-medium text-lg mb-1">Total no Período</p>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                    </h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[150px] text-center border border-white/10">
                    <p className="text-2xl font-bold">{provisionItems.length}</p>
                    <p className="text-sm text-primary-100">Lançamentos</p>
                </div>
            </div>

            {/* Details Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700">Detalhamento das Entradas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {provisionItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhuma entrada prevista para este período.</td>
                                </tr>
                            ) : (
                                provisionItems.map((detail, idx) => (
                                    <tr key={`${detail.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                                            {format(parseISO(detail.date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-800">{detail.client}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {detail.service}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                                detail.category === ContractCategory.AVULSO
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {detail.category} {detail.category === ContractCategory.RECORRENTE ? `(${detail.type})` : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-700">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onQuickAction}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl shadow-primary-600/40 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center"
        title="Novo Registro"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};