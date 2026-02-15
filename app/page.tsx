
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, MapPin, Clock } from 'lucide-react';
import { getGeneralSettings } from '@/lib/firebase';

export default function HomePage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getGeneralSettings();
        if (settings && settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
        }
      } catch (err) {
        console.error("Failed to fetch settings.", err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-clinic-cream relative overflow-hidden bg-pattern">
      {/* Decorative Circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-clinic-rose/20 blur-3xl animate-float"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-clinic-gold/10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-fade-in">
        {/* Brand Header */}
        <div className="mb-12 text-center">
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white p-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-clinic-rose/10 flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Radiant Clinic" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles size={64} className="text-clinic-gold" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-clinic-gold p-3 rounded-full text-white shadow-lg">
              <Sparkles size={24} />
            </div>
          </div>
          
          <h1 className="text-6xl font-light tracking-[0.3em] text-clinic-dark mb-4">亮立美學</h1>
          <div className="flex items-center justify-center gap-4 text-clinic-gold tracking-widest uppercase text-sm font-medium">
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
            Radiant Medical Aesthetic
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
          </div>
        </div>

        {/* Main Action Card */}
        <div className="glass-card p-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8">
          <p className="text-gray-500 text-lg font-light leading-relaxed">
            歡迎來到亮立美學專業諮詢系統。<br />
            請點擊下方按鈕開始您的客製化美麗分析。
          </p>
          
          <Link 
            href="/consultation"
            className="btn-gold text-2xl px-12 py-6 w-full max-w-md shadow-clinic-gold/20"
          >
            開始專業諮詢
            <ChevronRight size={32} />
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
      
      {/* Footer Info */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-gray-400">
        <p className="text-xs tracking-widest uppercase">Admin Secure Access Available</p>
        <Link href="/admin/login" className="text-xs hover:text-clinic-gold transition-colors underline underline-offset-4">管理員登入</Link>
      </div>
    </div>
  );
}
