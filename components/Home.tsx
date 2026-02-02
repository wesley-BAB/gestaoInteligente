
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Contract, FinancialType, ContractCategory, ContractType } from '../types';
import { format, parseISO, isAfter, startOfMonth, endOfMonth, isBefore, isSameDay, addMonths, addWeeks, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, Loader2, Plus, ArrowRight } from 'lucide-react';

interface HomeProps {
  user: User;
  onNavigate: (view: any) => void;
  onQuickAction: () => void;
}

interface MonthlyItem {
  id: number;
  cliente: string;
  servico: string;
  valor: number;
  data: string;
  tipo: FinancialType;
}

export const Home: React.FC<HomeProps> = ({ user, onNavigate, onQuickAction }) => {
  const [financialStats, setFinancialStats] = useState({ revenue: 0, expenses: 0, balance: 0 });
  const [incomes, setIncomes] = useState<MonthlyItem[]>([]);
  const [outcomes, setOutcomes] = useState<MonthlyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: contracts } = await supabase.from('tb_contratos').select('*').eq('user_id', user.id).eq('status', true);
      if (contracts) {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        
        let rev = 0;
        let exp = 0;
        const incItems: MonthlyItem[] = [];
        const outItems: MonthlyItem[] = [];

        (contracts as Contract[]).forEach(c => {
          const valor = Number(c.valor);
          const cStart = parseISO(c.inicio_contrato);
          const cEnd = c.vencimento_contrato ? parseISO(c.vencimento_contrato) : addYears(new Date(), 1);

          const pushItem = (date: Date) => {
            const item: MonthlyItem = {
              id: c.id,
              cliente: c.cliente,
              servico: c.nome_servico,
              valor,
              data: format(date, 'yyyy-MM-dd'),
              tipo: c.tipo_financeiro || FinancialType.RECEITA
            };
            if (item.tipo === FinancialType.RECEITA) {
              rev += valor;
              incItems.push(item);
            } else {
              exp += valor;
              outItems.push(item);
            }
          };

          if (c.categoria === ContractCategory.AVULSO) {
            if ((isAfter(cStart, start) || isSameDay(cStart, start)) && isBefore(cStart, end)) {
              pushItem(cStart);
            }
          } else {
            let current = cStart;
            while (isBefore(current, end)) {
              if (isAfter(current, cEnd)) break;
              if ((isAfter(current, start) || isSameDay(current, start)) && isBefore(current, end)) {
                pushItem(current);
              }
              if (c.tipo === ContractType.MENSAL) current = addMonths(current, 1);
              else if (c.tipo === ContractType.SEMANAL) current = addWeeks(current, 1);
              else break;
            }
          }
        });

        incItems.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        outItems.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        
        setIncomes(incItems);
        setOutcomes(outItems);
        setFinancialStats({
          revenue: rev,
          expenses: exp,
          balance: rev - exp
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const moneyFormat = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="w-[90%] mx-auto pb-20 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Painel Financeiro</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">Extrato de {format(new Date(), 'MMMM', { locale: ptBR })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-16 h-16 text-green-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Entradas</p>
            <p className="text-3xl font-black text-green-600">{moneyFormat(financialStats.revenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-16 h-16 text-red-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Saídas</p>
            <p className="text-3xl font-black text-red-600">{moneyFormat(financialStats.expenses)}</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-xl transition-all ${financialStats.balance >= 0 ? 'bg-primary-600 text-white' : 'bg-red-600 text-white'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-black opacity-80 uppercase tracking-widest mb-1">Resultado Líquido</p>
                    <p className="text-4xl font-black">{moneyFormat(financialStats.balance)}</p>
                </div>
                <Wallet className="w-8 h-8 opacity-50" />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin w-10 h-10 text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tabela de Entradas */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-green-50/20">
              <h3 className="font-black text-green-700 uppercase tracking-widest text-[11px] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Entradas do Mês
              </h3>
              <button onClick={() => onNavigate('revenue')} className="text-[9px] font-black text-green-600 hover:underline flex items-center gap-1 uppercase">Ver Todos <ArrowRight className="w-3 h-3"/></button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <tbody className="bg-white divide-y divide-gray-50">
                  {incomes.length === 0 ? (
                    <tr><td className="p-10 text-center text-gray-400 text-xs font-bold uppercase">Nenhuma entrada</td></tr>
                  ) : (
                    incomes.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-[10px] font-black text-gray-400">{format(parseISO(item.data), 'dd/MM')}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-gray-800">{item.cliente}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">{item.servico}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="text-sm font-black text-green-600">{moneyFormat(item.valor)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Saídas */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-red-50/20">
              <h3 className="font-black text-red-700 uppercase tracking-widest text-[11px] flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Saídas do Mês
              </h3>
              <button onClick={() => onNavigate('revenue')} className="text-[9px] font-black text-red-600 hover:underline flex items-center gap-1 uppercase">Ver Todos <ArrowRight className="w-3 h-3"/></button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <tbody className="bg-white divide-y divide-gray-50">
                  {outcomes.length === 0 ? (
                    <tr><td className="p-10 text-center text-gray-400 text-xs font-bold uppercase">Nenhuma saída</td></tr>
                  ) : (
                    outcomes.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-[10px] font-black text-gray-400">{format(parseISO(item.data), 'dd/MM')}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-gray-800">{item.cliente}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">{item.servico}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="text-sm font-black text-red-600">-{moneyFormat(item.valor)}</div>
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

      <button onClick={onQuickAction} className="fixed bottom-8 right-8 bg-primary-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-30 border-4 border-white">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};
