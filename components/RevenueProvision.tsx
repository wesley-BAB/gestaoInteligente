import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, User } from '../types';
import { addMonths, format, parseISO, startOfMonth, isBefore, isAfter, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Loader2, Calendar, ChevronDown, Plus } from 'lucide-react';

interface RevenueProps {
    user: User;
    onQuickAction: () => void;
}

interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  label: string; // "Janeiro 2024"
  amount: number;
  details: { id: number; client: string; amount: number; type: string; category: string; service: string }[];
}

export const RevenueProvision: React.FC<RevenueProps> = ({ user, onQuickAction }) => {
  const [loading, setLoading] = useState(true);
  const [provisions, setProvisions] = useState<MonthlyRevenue[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const calculateRevenue = async () => {
      setLoading(true);
      // Filter by user_id
      const { data } = await supabase.from('tb_contratos').select('*').eq('status', true).eq('user_id', user.id);
      const contracts = data as Contract[] || [];

      const months: MonthlyRevenue[] = [];
      const today = startOfMonth(new Date());

      for (let i = 0; i < 12; i++) {
        const currentMonthDate = addMonths(today, i);
        const monthKey = format(currentMonthDate, 'yyyy-MM');
        
        let monthlyTotal = 0;
        const monthlyDetails: { id: number; client: string; amount: number; type: string; category: string; service: string }[] = [];

        contracts.forEach(contract => {
            const start = parseISO(contract.inicio_contrato);
            let include = false;

            if (contract.categoria === ContractCategory.AVULSO) {
                // One time payment on the start date month
                if (isSameMonth(start, currentMonthDate)) {
                    include = true;
                }
            } else {
                // Recorrente logic
                const end = parseISO(contract.vencimento_contrato);
                
                // Check date range overlap
                if (isAfter(start, endOfMonth(currentMonthDate))) return; 
                if (isBefore(end, currentMonthDate)) return;

                if (contract.tipo === ContractType.MENSAL) {
                    include = true;
                } else if (contract.tipo === ContractType.ANUAL) {
                    if (start.getMonth() === currentMonthDate.getMonth()) {
                        include = true;
                    }
                }
            }

            if (include) {
                monthlyTotal += Number(contract.valor);
                monthlyDetails.push({
                    id: contract.id,
                    client: contract.cliente,
                    amount: Number(contract.valor),
                    type: contract.tipo,
                    category: contract.categoria,
                    service: contract.nome_servico
                });
            }
        });

        months.push({
            month: monthKey,
            label: format(currentMonthDate, 'MMMM yyyy', { locale: ptBR }),
            amount: monthlyTotal,
            details: monthlyDetails
        });
      }

      setProvisions(months);
      // Default to current month
      if(months.length > 0) setSelectedMonth(months[0].month);
      
      setLoading(false);
    };

    calculateRevenue();
  }, [user.id]);

  const endOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const selectedProvision = provisions.find(p => p.month === selectedMonth);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary-500 w-10 h-10"/></div>;

  return (
    <div className="w-full max-w-[1200px] animate-fade-in pb-20">
       <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            Provisão de Receita
            </h2>
            <p className="text-gray-500 mt-1">Fluxo de caixa previsto (Contratos + Avulsos).</p>
        </div>
        
        {/* Month Filter */}
        <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer capitalize"
            >
                {provisions.map(p => (
                    <option key={p.month} value={p.month} className="capitalize">{p.label}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
      </div>

      {selectedProvision && (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-600/20 overflow-hidden text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="text-primary-100 font-medium text-lg mb-1 capitalize">{selectedProvision.label}</p>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProvision.amount)}
                    </h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[150px] text-center border border-white/10">
                    <p className="text-2xl font-bold">{selectedProvision.details.length}</p>
                    <p className="text-sm text-primary-100">Entradas Previstas</p>
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {selectedProvision.details.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhuma entrada prevista para este mês.</td>
                                </tr>
                            ) : (
                                selectedProvision.details.map((detail, idx) => (
                                    <tr key={`${detail.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
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