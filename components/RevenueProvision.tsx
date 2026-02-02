
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractType, ContractCategory, User, FinancialType } from '../types';
import { addMonths, addYears, addWeeks, format, parseISO, isBefore, isAfter, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, Loader2, Calendar, Plus, Filter, TrendingDown, Landmark, PieChart } from 'lucide-react';

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
    financialType: FinancialType;
}

export const RevenueProvision: React.FC<RevenueProps> = ({ user, onQuickAction }) => {
  const [loading, setLoading] = useState(true);
  const [provisionItems, setProvisionItems] = useState<ProvisionItem[]>([]);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, investments: 0 });
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    const calculateData = async () => {
      setLoading(true);
      const { data } = await supabase.from('tb_contratos').select('*').eq('status', true).eq('user_id', user.id);
      const contracts = data as Contract[] || [];
      const items: ProvisionItem[] = [];
      const startRange = parseISO(startDate);
      const endRange = parseISO(endDate);
      endRange.setHours(23, 59, 59, 999);

      let rev = 0, exp = 0, inv = 0;

      contracts.forEach(contract => {
          const contractStart = parseISO(contract.inicio_contrato);
          const val = Number(contract.valor);
          
          const addItem = (date: string) => {
              items.push({
                  id: contract.id,
                  client: contract.cliente,
                  amount: val,
                  type: contract.tipo,
                  category: contract.categoria,
                  service: contract.nome_servico,
                  date: date,
                  financialType: contract.tipo_financeiro || FinancialType.RECEITA
              });
              if (contract.tipo_financeiro === FinancialType.RECEITA) rev += val;
              else if (contract.tipo_financeiro === FinancialType.DESPESA) exp += val;
              else inv += val;
          };

          if (contract.categoria === ContractCategory.AVULSO) {
              if ((isAfter(contractStart, startRange) || isSameDay(contractStart, startRange)) && isBefore(contractStart, endRange)) {
                  addItem(contract.inicio_contrato);
              }
          } else {
              const contractEnd = contract.vencimento_contrato ? parseISO(contract.vencimento_contrato) : addYears(new Date(), 2);
              let current = contractStart;
              while (isBefore(current, endRange)) {
                  if (isAfter(current, contractEnd)) break;
                  if ((isAfter(current, startRange) || isSameDay(current, startRange)) && isBefore(current, endRange)) {
                      addItem(format(current, 'yyyy-MM-dd'));
                  }
                  if (contract.tipo === ContractType.MENSAL) current = addMonths(current, 1);
                  else if (contract.tipo === ContractType.SEMANAL) current = addWeeks(current, 1);
                  else if (contract.tipo === ContractType.ANUAL) current = addYears(current, 1);
                  else break;
              }
          }
      });

      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setProvisionItems(items);
      setStats({ revenue: rev, expenses: exp, investments: inv });
      setLoading(false);
    };
    calculateData();
  }, [user.id, startDate, endDate]);

  const moneyFormat = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="w-[90%] mx-auto animate-fade-in pb-20">
       <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h2 className="text-4xl font-black text-gray-800 flex items-center gap-4">
            <PieChart className="w-10 h-10 text-primary-600" />
            Relatório Geral
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 ml-14">Projeção de Fluxo de Caixa</p>
        </div>
        
        <div className="bg-white p-3 rounded-[30px] border border-gray-100 shadow-xl flex items-center gap-4 px-6">
            <Calendar className="w-4 h-4 text-primary-500" />
            <div className="flex items-center gap-3">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent font-black text-xs outline-none" />
                <span className="text-gray-300">/</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent font-black text-xs outline-none" />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-12 h-12"/></div>
      ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 col-span-1">
                    <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Entradas</p>
                    <p className="text-2xl font-black text-green-600">{moneyFormat(stats.revenue)}</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 col-span-1">
                    <TrendingDown className="w-6 h-6 text-red-500 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Saídas</p>
                    <p className="text-2xl font-black text-red-600">{moneyFormat(stats.expenses)}</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 col-span-1">
                    <Landmark className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Investimentos</p>
                    <p className="text-2xl font-black text-blue-600">{moneyFormat(stats.investments)}</p>
                </div>
                <div className={`p-8 rounded-[40px] shadow-2xl col-span-1 flex flex-col justify-center ${stats.revenue - stats.expenses >= 0 ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">Saldo do Período</p>
                    <p className="text-3xl font-black">{moneyFormat(stats.revenue - stats.expenses)}</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h3 className="font-black text-gray-700 uppercase tracking-widest text-xs">Lançamentos Detalhados</h3>
                    <div className="text-[10px] font-black text-gray-400">{provisionItems.length} registros no período</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente/Fornecedor</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {provisionItems.map((detail, idx) => (
                                <tr key={`${detail.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-10 py-6 whitespace-nowrap text-xs font-black text-gray-500">
                                        {format(parseISO(detail.date), 'dd/MM/yy')}
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <div className="font-black text-gray-800 text-sm">{detail.client}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{detail.service}</div>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-xl border ${
                                            detail.financialType === FinancialType.DESPESA ? 'bg-red-50 text-red-600 border-red-100' :
                                            detail.financialType === FinancialType.INVESTIMENTO ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-green-50 text-green-600 border-green-100'
                                        }`}>
                                            {detail.financialType}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-gray-400 uppercase">{detail.category}</div>
                                    </td>
                                    <td className={`px-10 py-6 whitespace-nowrap text-right text-sm font-black ${detail.financialType === FinancialType.DESPESA ? 'text-red-600' : 'text-gray-800'}`}>
                                        {detail.financialType === FinancialType.DESPESA ? '-' : ''}{moneyFormat(detail.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      <button onClick={onQuickAction} className="fixed bottom-8 right-8 bg-primary-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-20">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};
