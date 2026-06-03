import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (typeof window === 'undefined') {
  console.log('--- Supabase Auth Check ---');
  console.log('URL:', supabaseUrl ? `Configurada (${supabaseUrl.substring(0, 15)}...)` : 'FALTA');
  console.log('KEY:', supabaseAnonKey ? `Configurada (empieza por ${supabaseAnonKey.substring(0, 8)}...)` : 'FALTA');
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.error('⚠️ ALERTA: Las credenciales de Supabase no son válidas o son de prueba.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
