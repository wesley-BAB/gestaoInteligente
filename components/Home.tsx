import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, User, Contract } from '../types';
import { format, parseISO, isAfter, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, DollarSign, ArrowRight, Briefcase } from 'lucide-react';

interface HomeProps {
  user: User;
  onNavigate: (view: any) => void;
}

export const Home: React.FC<HomeProps> = ({ user, onNavigate }) => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ contracts: 0, monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Contracts for stats
      const { data: contracts } = await supabase
        .from('tb_contratos')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', true);

      const userContracts = (contracts as Contract[]) || [];
      
      const revenue = userContracts.reduce((acc, curr) => {
         // Simplification: if monthly add value, if annual add value/12
         return acc + (curr.tipo === 'Mensal' ? Number(curr.valor) : Number(curr.valor) / 12);
      }, 0);

      setStats({
        contracts: userContracts.length,
        monthlyRevenue: revenue
      });

      // Fetch Appointments linked to user's contracts
      const { data: appointments } = await supabase
        .from('tb_agendamentos')
        .select(`
            *,
            contrato:tb_contratos(*)
        `)
        .order('data_agendamento', { ascending: true });

      if (appointments) {
        // Filter client-side for correct user
        const filtered = appointments.filter((apt: any) => 
            apt.contrato && apt.contrato.user_id === user.id && 
            (isAfter(parseISO(apt.data_agendamento), new Date()) || isToday(parseISO(apt.data_agendamento)))
        ).slice(0, 5); // Take top 5
        
        setUpcomingAppointments(filtered);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  return (
    <div className="w-full max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Olá, {user.username}</h1>
        <p className="text-gray-500 mt-1">Aqui está o resumo da sua gestão hoje.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                <Briefcase className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Contratos/Serviços Ativos</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contracts}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">Receita Mensal Est.</p>
                <p className="text-2xl font-bold text-gray-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
                </p>
            </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" /> Próximos Agendamentos
            </h2>
            <button onClick={() => onNavigate('contracts')} className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1">
                Ver contratos <ArrowRight className="w-3 h-3" />
            </button>
        </div>

        {loading ? (
             <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhum agendamento próximo.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-50">
                {upcomingAppointments.map((apt: any) => (
                    <div key={apt.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center justify-center bg-primary-50 text-primary-700 rounded-xl min-w-[60px] h-[60px]">
                                <span className="text-xs font-bold uppercase">{format(parseISO(apt.data_agendamento), 'MMM', { locale: ptBR })}</span>
                                <span className="text-xl font-bold">{format(parseISO(apt.data_agendamento), 'dd')}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{apt.contrato?.cliente || 'Cliente Desconhecido'}</h3>
                                <p className="text-sm text-gray-500">{apt.contrato?.nome_servico} • {apt.contrato?.categoria}</p>
                                <p className="text-sm text-gray-600 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded text-xs">{apt.observacao}</p>
                            </div>
                        </div>
                        <div className="text-right sm:text-right text-sm text-gray-500">
                             <span className="block font-medium text-primary-600">
                                {format(parseISO(apt.data_agendamento), 'EEEE', { locale: ptBR })}
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};