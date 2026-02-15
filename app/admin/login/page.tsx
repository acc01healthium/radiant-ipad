
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: any) {
      setError('登入失敗，請檢查帳號密碼。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-clinic-cream p-6 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50 animate-fade-in">
        {/* Header Section with enhanced visibility */}
        <div className="rose-gold-gradient p-12 text-center relative overflow-hidden">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/5 rounded-full -ml-8 -mb-8 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full mb-6 border border-white/30">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">管理者登入</h1>
            <p className="text-white/90 text-sm font-light tracking-widest uppercase">
              Radiant Clinic 諮詢後台管理系統
            </p>
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
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-clinic-gold transition-colors" size={20} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-14"
                placeholder="admin@radiant.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">登入密碼</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-clinic-gold transition-colors" size={20} />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-14"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-clinic-dark text-white font-bold rounded-2xl shadow-xl hover:shadow-clinic-gold/20 hover:bg-black transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                驗證中...
              </>
            ) : (
              '進入管理系統'
            )}
          </button>
        </form>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <button 
            type="button"
            onClick={() => router.push('/')}
            className="text-xs text-gray-400 hover:text-clinic-gold transition-colors font-medium tracking-widest uppercase"
          >
            ← 返回諮詢首頁
          </button>
        </div>
      </div>
    </div>
  );
}
