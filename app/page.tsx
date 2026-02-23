
import React from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // 1. 同時獲取診所設定、系統文字與分類資料 (移除 is_active)
  const [settingsRes, textsRes, categoriesRes] = await Promise.all([
    supabase.from('settings').select('logo_url, clinic_name, updated_at').eq('id', 'clinic_main').single(),
    supabase.from('system_texts').select('key, value'),
    supabase.from('improvement_categories').select('*').order('sort_order', { ascending: true })
  ]);

  const settings = settingsRes.data;
  const systemTexts = (textsRes.data || []).reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  
  const clinicName = systemTexts['home_title'] || settings?.clinic_name || '亮立美學';
  const logoUrl = settings?.logo_url;
  const version = settings?.updated_at ? new Date(settings.updated_at).getTime() : Date.now();

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-clinic-cream relative overflow-hidden bg-pattern">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-clinic-rose/20 blur-3xl animate-float"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-clinic-gold/10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-fade-in">
        <div className="mb-12 text-center">
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white p-2">
              <div className="w-full h-full rounded-full overflow-hidden bg-clinic-rose/5 flex items-center justify-center">
                {logoUrl ? (
                  <img src={`${logoUrl}?v=${version}`} alt={clinicName} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles size={64} className="text-clinic-gold" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-clinic-gold p-3 rounded-full text-white shadow-lg border-2 border-white">
              <Sparkles size={24} />
            </div>
          </div>
          
          <h1 className="text-6xl font-light tracking-[0.3em] text-clinic-dark mb-4 transition-all uppercase text-center">
            {clinicName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-clinic-gold tracking-widest uppercase text-sm font-medium opacity-60">
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
            {systemTexts['home_subtitle'] || 'Radiant Medical Aesthetic'}
            <span className="h-[1px] w-8 bg-clinic-gold/30"></span>
          </div>
        </div>

        <div className="glass-card p-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8 border-white/60">
          <div className="text-gray-500 text-lg font-light leading-relaxed text-center">
  <p>美得不著痕跡，是最高級的愛自己。</p>
  <p className="mt-2">亮立美學，為妳立下美的標竿。</p>
</div>
          
          <Link 
  href="/consultation"
  className="btn-gold text-base sm:text-lg md:text-2xl px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 w-full max-w-md shadow-clinic-gold/20 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 group whitespace-nowrap"
>
  {systemTexts['home_start_btn']}
  <ChevronRight size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
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
        <p className="text-[10px] tracking-[0.3em] font-black uppercase opacity-40">Dynamic Asset Management | v2.0</p>
        <Link href="/admin/login" className="text-xs hover:text-clinic-gold transition-colors underline underline-offset-8 decoration-clinic-gold/30">
          管理員安全存取
        </Link>
      </div>
    </div>
  );
}
