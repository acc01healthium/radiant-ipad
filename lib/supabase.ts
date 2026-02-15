
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 環境變數遺失，請檢查 .env.local 或 Vercel 設定');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
