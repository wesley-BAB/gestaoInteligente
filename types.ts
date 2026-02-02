
export interface User {
  id: number;
  username: string;
  password?: string;
}

export interface Client {
  id: number;
  created_at?: string;
  nome: string;
  email?: string;
  telefone?: string;
  user_id: number;
  ativo?: boolean;
}

export enum ContractType {
  MENSAL = 'Mensal',
  ANUAL = 'Anual',
  SEMANAL = 'Semanal'
}

export enum ContractCategory {
  RECORRENTE = 'Recorrente',
  AVULSO = 'Avulso'
}

export enum FinancialType {
  RECEITA = 'Receita',
  DESPESA = 'Despesa',
  INVESTIMENTO = 'Investimento'
}

export interface ServiceType {
  id: number;
  created_at?: string;
  nome: string;
  user_id?: number;
}

export interface Contract {
  id: number;
  user_id: number;
  created_at?: string;
  cliente: string;
  inicio_contrato: string;
  vencimento_contrato: string;
  valor: number;
  nome_servico: string;
  vencimento_parcela: number;
  tipo: ContractType;
  categoria: ContractCategory;
  status?: boolean;
  tipo_financeiro: FinancialType;
}

export interface Appointment {
  id: number;
  created_at?: string;
  contrato_id: number;
  contrato?: Contract;
  data_agendamento: string; // Mantido nome da coluna para compatibilidade com DB
  observacao: string; // Mantido nome da coluna para compatibilidade com DB
  feito?: boolean;
}

export interface FinancialRecord {
  id?: number;
  contrato_id: number;
  data_vencimento: string;
  valor: number;
  status: 'pendente' | 'pago';
  data_pagamento?: string | null;
}
