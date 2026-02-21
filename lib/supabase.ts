
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
    // 允許訪問某些屬性而不觸發初始化
    if (prop === 'then' || prop === 'constructor' || typeof prop === 'symbol') return undefined;
    
    try {
      const client = getSupabase();
      const value = (client as any)[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (err) {
      // 如果是環境變數缺失，且正在訪問資料庫方法，則拋出錯誤
      const dbMethods = ['from', 'auth', 'storage', 'rpc', 'functions'];
      if (dbMethods.includes(prop as string)) {
        throw err;
      }
      // 否則返回 undefined 避免崩潰
      return undefined;
    }
  }
});
