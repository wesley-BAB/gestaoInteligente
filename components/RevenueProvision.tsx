import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, User } from '../types';
import { addMonths, format, parseISO, startOfMonth, isBefore, isAfter, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Loader2, Filter } from 'lucide-react';

interface RevenueProps {
    user: User;
}

interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  label: string; // "Janeiro 2024"
  amount: number;
  details: { client: string; amount: number; type: string; category: string }[];
}

export const RevenueProvision: React.FC<RevenueProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [provisions, setProvisions] = useState<MonthlyRevenue[]>([]);

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
        const monthlyDetails: { client: string; amount: number; type: string; category: string }[] = [];

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
                    client: contract.cliente,
                    amount: Number(contract.valor),
                    type: contract.tipo,
                    category: contract.categoria
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
      setLoading(false);
    };

    calculateRevenue();
  }, [user.id]);

  const endOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary-500 w-10 h-10"/></div>;

  return (
    <div className="w-full max-w-[1600px]">
       <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
           <TrendingUp className="w-8 h-8 text-primary-500" />
           Provisão de Receita
        </h2>
        <p className="text-gray-500 mt-1">Fluxo de caixa previsto (Contratos + Avulsos) para os próximos 12 meses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provisions.map((prov) => (
            <div key={prov.month} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 capitalize">{prov.label}</h3>
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">{prov.details.length} entradas</span>
                </div>
                <div className="p-5 text-center">
                    <p className="text-sm text-gray-500 mb-1 font-medium">Total Previsto</p>
                    <p className="text-3xl font-bold text-primary-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prov.amount)}
                    </p>
                </div>
                {prov.details.length > 0 && (
                    <div className="bg-gray-50/30 px-5 py-3 text-xs text-gray-500 border-t border-gray-100">
                        <div className="flex justify-between mb-1">
                            <span>Maior entrada:</span>
                            <span className="font-medium truncate max-w-[120px]">
                                {prov.details.sort((a,b) => b.amount - a.amount)[0].client}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};