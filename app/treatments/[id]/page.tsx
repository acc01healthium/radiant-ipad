
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, Loader2, ArrowRight, CheckCircle2, DollarSign, Info } from 'lucide-react';

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        supabase.from('treatments').select('*, treatment_price_options(*)').eq('id', id).single(),
        supabase.from('cases').select('*').order('created_at', { ascending: false })
      ]);
      setTreatment(tRes.data);
      setCases(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;
  if (!treatment) return <div className="p-20 text-center">療程不存在</div>;

  return (
    <div className="min-h-screen bg-clinic-cream pb-20 bg-pattern overflow-x-hidden">
      {/* Hero Visual Area: object-contain + filled background */}
      <div className="relative h-[45vh] md:h-[50vh] w-full bg-gray-50 flex items-center justify-center p-8 md:p-12 overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-clinic-cream/80 to-transparent z-0"></div>
        <img 
          src={treatment.image_url} 
          className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl" 
          alt={treatment.title} 
        />
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-600 hover:text-clinic-gold transition-all z-20 border border-white"
        >
          <ChevronLeft size={32} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 md:-mt-32 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 text-clinic-gold mb-3">
                <Sparkles size={20} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Radiant Treatment</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 tracking-tight leading-tight">{treatment.title}</h1>
            </div>
            
            {/* Price Menu */}
            <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col gap-4 min-w-[320px] shadow-inner">
              <div className="flex items-center gap-2 text-amber-600 mb-2 border-b border-amber-100 pb-3">
                <DollarSign size={20} />
                <span className="text-sm font-black uppercase tracking-widest">課程方案清單</span>
              </div>
              
              <div className="space-y-4">
                {treatment.treatment_price_options?.length > 0 ? (
                  treatment.treatment_price_options.filter((o:any) => o.is_active).sort((a:any, b:any) => a.sort_order - b.sort_order).map((opt:any) => (
                    <div key={opt.id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-gray-600 font-bold">{opt.label}</span>
                      </div>
                      <div className="text-2xl font-black text-clinic-gold tracking-tighter">
                        <span className="text-xs mr-1 opacity-60">NT$</span>
                        {opt.price.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold italic">基本單堂方案</span>
                    <div className="text-2xl font-black text-clinic-gold tracking-tighter">
                      <span className="text-xs mr-1 opacity-60">NT$</span>
                      {treatment.price?.toLocaleString() || '-'}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-amber-100 flex justify-center">
                <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">實際課程建議以醫師評估為準</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t pt-12">
            <div className="md:col-span-2 space-y-6">
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-800">
                <Info className="text-clinic-gold" size={24} /> 療程特色與美學規劃
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed whitespace-pre-line font-light italic opacity-80">
                {treatment.description || '專業醫美團隊為您量身打造的極致美學方案。結合最新科技與藝術美感，針對您的特定需求進行深度優化，打造專屬於您的細緻質感。'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {['頂尖原廠設備', '1對1 深度諮詢', '客製化減痛流程', '全方位術後追蹤'].map(t => (
                  <div key={t} className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <CheckCircle2 className="text-clinic-gold" size={20} />
                    <span className="font-bold text-gray-700 text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-clinic-rose/5 p-8 rounded-[2rem] border border-clinic-rose/10">
                  <h4 className="text-xs font-black text-clinic-rose uppercase tracking-[0.2em] mb-4">Radiant Tips</h4>
                  <ul className="text-sm text-gray-500 space-y-3 font-medium">
                    <li className="flex gap-2">• 術前一週避免雷射或酸類換膚</li>
                    <li className="flex gap-2">• 治療區域若有感染應延後療程</li>
                    <li className="flex gap-2">• 懷孕或計畫懷孕請務必告知</li>
                    <li className="flex gap-2">• 術後加強保濕與物理性防曬</li>
                  </ul>
               </div>
            </div>
          </div>
        </div>
        
        {/* Back Button */}
        <div className="mt-12 text-center">
          <button onClick={() => router.back()} className="btn-outline px-16 py-6 text-xl tracking-widest uppercase font-black">
             返回推薦列表
          </button>
        </div>
      </div>
    </div>
  );
}
