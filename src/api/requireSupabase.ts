import { supabase } from './supabaseClient';

export function requireSupabase() {
  if (!supabase) throw new Error('Thiếu cấu hình Supabase URL hoặc publishable key.');
  return supabase;
}
