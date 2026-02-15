
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查帳號密碼。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-clinic-cream p-6 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50 animate-fade-in">
        <div className="rose-gold-gradient p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full mb-6 border border-white/30">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">管理者登入</h1>
            <p className="text-white/90 text-sm font-light tracking-widest uppercase">Supabase Secure Access</p>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-8 bg-white">
          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 animate-fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">電子郵件</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field py-4"
              placeholder="admin@radiant.com"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">登入密碼</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field py-4"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-5 text-xl disabled:opacity-50"
          >
            {loading ? '驗證中...' : '進入管理系統'}
          </button>
        </form>
      </div>
    </div>
  );
}
