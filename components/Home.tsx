
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, User, Contract, FinancialType, ContractCategory, ContractType } from '../types';
import { format, parseISO, isAfter, isToday, startOfMonth, endOfMonth, isBefore, isSameDay, addMonths, addYears, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, ArrowRight, Briefcase, Plus, CheckCircle, Circle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useToast } from './ToastContext';

interface HomeProps {
  user: User;
  onNavigate: (view: any) => void;
  onQuickAction: () => void;
}

export const Home: React.FC<HomeProps> = ({ user, onNavigate, onQuickAction }) => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [financialStats, setFinancialStats] = useState({ revenue: 0, expenses: 0, investments: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const calculateFinancials = (contracts: Contract[]) => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    let rev = 0;
    let exp = 0;
    let inv = 0;

    contracts.forEach(c => {
      const valor = Number(c.valor);
      const cStart = parseISO(c.inicio_contrato);
      const cEnd = c.vencimento_contrato ? parseISO(c.vencimento_contrato) : addYears(new Date(), 1);

      if (c.categoria === ContractCategory.AVULSO) {
        if ((isAfter(cStart, start) || isSameDay(cStart, start)) && isBefore(cStart, end)) {
          if (c.tipo_financeiro === FinancialType.RECEITA) rev += valor;
          else if (c.tipo_financeiro === FinancialType.DESPESA) exp += valor;
          else inv += valor;
        }
      } else {
        let current = cStart;
        while (isBefore(current, end)) {
          if ((isAfter(current, start) || isSameDay(current, start)) && isBefore(current, end)) {
            if (c.tipo_financeiro === FinancialType.RECEITA) rev += valor;
            else if (c.tipo_financeiro === FinancialType.DESPESA) exp += valor;
            else inv += valor;
          }
          if (c.tipo === ContractType.MENSAL) current = addMonths(current, 1);
          else if (c.tipo === ContractType.SEMANAL) current = addWeeks(current, 1);
          else break;
        }
      }
    });

    setFinancialStats({
      revenue: rev,
      expenses: exp,
      investments: inv,
      balance: rev - exp
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: contracts } = await supabase.from('tb_contratos').select('*').eq('user_id', user.id).eq('status', true);
      if (contracts) calculateFinancials(contracts as Contract[]);

      const { data: appointments } = await supabase.from('tb_agendamentos').select('*, contrato:tb_contratos(*)').order('data_agendamento', { ascending: true });
      if (appointments) {
        const filtered = appointments.filter((apt: any) => 
            apt.contrato && apt.contrato.user_id === user.id && 
            (isAfter(parseISO(apt.data_agendamento), new Date()) || isToday(parseISO(apt.data_agendamento)))
        ).slice(0, 5);
        setUpcomingAppointments(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const toggleAppointmentStatus = async (id: number, currentStatus: boolean) => {
      const newStatus = !currentStatus;
      await supabase.from('tb_agendamentos').update({ feito: newStatus }).eq('id', id);
      showToast(newStatus ? 'Agendamento concluído!' : 'Agendamento reaberto.', 'success');
      fetchData();
  };

  const moneyFormat = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="w-[90%] mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Painel Financeiro</h1>
        <p className="text-gray-500 font-medium">Resumo de {format(new Date(), 'MMMM', { locale: ptBR })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-16 h-16 text-green-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Receitas do Mês</p>
            <p className="text-3xl font-black text-green-600">{moneyFormat(financialStats.revenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-16 h-16 text-red-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Despesas do Mês</p>
            <p className="text-3xl font-black text-red-600">{moneyFormat(financialStats.expenses)}</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-xl border-4 transition-all ${financialStats.balance >= 0 ? 'bg-primary-600 border-primary-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-black opacity-80 uppercase tracking-widest mb-1">Saldo Previsto</p>
                    <p className="text-4xl font-black">{moneyFormat(financialStats.balance)}</p>
                </div>
                <Wallet className="w-8 h-8 opacity-50" />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-widest text-sm">
                <Clock className="w-5 h-5 text-primary-600" /> Agenda Próxima
            </h2>
            <button onClick={() => onNavigate('contracts')} className="text-xs text-primary-600 font-black hover:underline flex items-center gap-1 uppercase tracking-widest">
                Ver Contratos <ArrowRight className="w-3 h-3" />
            </button>
        </div>

        {loading ? (
             <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : upcomingAppointments.length === 0 ? (
            <div className="p-16 text-center text-gray-400">Sem agendamentos próximos.</div>
        ) : (
            <div className="divide-y divide-gray-50">
                {upcomingAppointments.map((apt: any) => (
                    <div key={apt.id} className={`p-6 hover:bg-gray-50 transition-colors flex items-center justify-between ${apt.feito ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-6">
                            <button onClick={() => toggleAppointmentStatus(apt.id, !!apt.feito)} className={`transition-all ${apt.feito ? 'text-green-500' : 'text-gray-300'}`}>
                                {apt.feito ? <CheckCircle className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                            </button>
                            <div>
                                <h3 className="font-black text-gray-800 text-lg leading-tight">{apt.contrato?.cliente}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{apt.contrato?.nome_servico}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-xs font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                {format(parseISO(apt.data_agendamento), 'dd MMM', { locale: ptBR })}
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <button onClick={onQuickAction} className="fixed bottom-8 right-8 bg-primary-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-30 border-4 border-white">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};
