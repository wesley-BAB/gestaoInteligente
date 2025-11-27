export interface User {
  id: number;
  username: string;
  password?: string; // Optional for update payloads
}

export interface Client {
  id: number;
  created_at?: string;
  nome: string;
  email?: string;
  telefone?: string;
  user_id: number;
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

export interface ServiceType {
  id: number;
  created_at?: string;
  nome: string;
  user_id?: number;
}

export interface Contract {
  id: number;
  user_id: number; // Owner of the contract
  created_at?: string;
  cliente: string;
  inicio_contrato: string; // YYYY-MM-DD
  vencimento_contrato: string; // YYYY-MM-DD
  valor: number;
  nome_servico: string;
  vencimento_parcela: number; // Day of month
  tipo: ContractType;
  categoria: ContractCategory; // New field
  status?: boolean; // true = active
}

export interface Appointment {
  id: number;
  created_at?: string;
  contrato_id: number;
  contrato?: Contract; // Join result
  data_agendamento: string; // YYYY-MM-DD or ISO string
  observacao: string;
  feito?: boolean; // Status done/pending
}

export interface FinancialRecord {
  id?: number; // Optional because it might be virtual until saved
  contrato_id: number;
  data_vencimento: string;
  valor: number;
  status: 'pendente' | 'pago';
  data_pagamento?: string | null;
}