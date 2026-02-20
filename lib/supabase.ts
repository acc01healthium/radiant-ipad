
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

// 使用 Proxy 實現延遲初始化，避免在模組載入時就因為缺少環境變數而崩潰
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    if (!instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        // 在伺服器端渲染或建置時，如果變數缺失，我們拋出一個更友好的錯誤
        // 或者在某些情況下返回一個 dummy 對象，但通常拋出錯誤是正確的，
        // 只是我們延後到「真正使用」時才拋出。
        throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
      instance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return Reflect.get(instance, prop, receiver);
  }
});
