import { createClient } from '@supabase/supabase-js';

// Configurações fornecidas
const supabaseUrl = 'https://jpcwyawkqobafdmcmdxm.supabase.co';
// Nota: Em produção, esta chave deve estar em variáveis de ambiente e RLS deve ser configurado no backend.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwY3d5YXdrcW9iYWZkbWNtZHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzA3NjYsImV4cCI6MjA3OTEwNjc2Nn0.fAtGugxzi8ued7zlr0ujhOb-GFIq1Do5o2CgtTgNL2A';

export const supabase = createClient(supabaseUrl, supabaseKey);
