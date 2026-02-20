
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (instance) return instance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  instance = createClient(supabaseUrl, supabaseAnonKey);
  return instance;
};

// 為了相容性保留原本的導出，但改用 getter 模式
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
