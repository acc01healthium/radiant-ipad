'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, MapPin, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * 強制 Next.js 進入完全動態渲染模式
 * 確保 Vercel 不會快取 HTML 頁面
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState('亮立美學');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        /**
         * 1. 欄位對齊：使用 logo_url 與 clinic_name
         * 2. ID 過濾：鎖定 clinic_main
         * 3. 無快取抓取：雖然 supabase-js 在客戶端不走 Next.js fetch cache，
         *    但我們透過 page-level 的 force-dynamic 確保整體流程最新。
         */
        const { data, error } = await supabase
          .from('settings')
          .select('logo_url, clinic_name')
          .eq('id', 'clinic_main')
          .single();
        
        if (error) {
          console.warn("[Client] 讀取配置失敗 (PGRST116 可能為未設定):", error.message);
          
          // 備援抓取：如果 clinic_main 不存在，抓取任何一筆
          const { data: fallback } = await supabase
            .from('settings')
            .select('logo_url, clinic_name')
            .limit(1)
            .single();
            
          if (fallback) {
            setLogoUrl(fallback.logo_url);
            setClinicName(fallback.clinic_name || '亮立美學');
          }
        } else if (data) {
          // 成功取得最新雲端設定
          setLogoUrl(data.logo_url);
          setClinicName(data.clinic_name || '亮立美學');
        }
      } catch (err) {
        console.error("[Client] 嚴重連線錯誤:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-clinic-cream relative overflow-hidden bg-pattern">
      {/* 裝飾性環境背景 */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-clinic-rose/20 blur-3xl animate-float"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-clinic-gold/10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-fade-in">
        <div className="mb-12 text-center">
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white p-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-clinic-rose/5 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="animate-spin text-clinic-gold/30" size={32} />
                ) : logoUrl ? (
                  <img 
                    // 核心修正：使用 logo_url 並加上 timestamp 徹底防止瀏覽器圖片快取
                    src={`${logoUrl}?t=${new Date().getTime()}`} 
                    alt={clinicName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Sparkles size={64} className="text-clinic-gold" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-clinic-gold p-3 rounded-full text-white shadow-lg border-2 border-white">
              <Sparkles size={24} />
            </div>
          </div>
          
          <h1 className="text-6xl font-light tracking-[0.3em] text-clinic-dark mb-4 transition-all uppercase">
            {clinicName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-clinic-gold tracking-widest uppercase text-sm font-medium opacity-60">
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
            Radiant Medical Aesthetic
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
          </div>
        </div>

        <div className="glass-card p-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8 border-white/60">
          <p className="text-gray-500 text-lg font-light leading-relaxed">
            歡迎來到{clinicName}專業諮詢系統。<br />
            請點擊下方按鈕開始您的客製化美麗分析。
          </p>
          
          <Link 
            href="/consultation"
            className="btn-gold text-2xl px-12 py-6 w-full max-w-md shadow-clinic-gold/20 flex items-center justify-center gap-4 group"
          >
            開始專業諮詢
            <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
          </Link>
          
          <div className="flex items-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={16} className="text-clinic-rose" />
              <span>頂級沙龍環境</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock size={16} className="text-clinic-rose" />
              <span>1對1 專屬服務</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-gray-400">
        <p className="text-[10px] tracking-[0.3em] font-black uppercase opacity-40">Radiant Cloud System | iPad Pro Edition</p>
        <Link href="/admin/login" className="text-xs hover:text-clinic-gold transition-colors underline underline-offset-8 decoration-clinic-gold/30">
          管理員安全存取
        </Link>
      </div>
    </div>
  );
}
