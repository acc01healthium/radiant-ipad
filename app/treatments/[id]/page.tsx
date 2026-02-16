'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, DollarSign, Camera, ArrowRight, Loader2, Info } from 'lucide-react';

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
        supabase.from('treatments').select('*').eq('id', id).single(),
        // 假設案例 table 為 cases 或透過關聯查詢，這裡以 category 匹配作為範例，若有直接關聯 table 請修改
        supabase.from('cases').select('*').order('created_at', { ascending: false })
      ]);
      
      setTreatment(tRes.data);
      // 過濾出相關案例 (範例邏輯)
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
    <div className="min-h-screen bg-clinic-cream pb-20 bg-pattern">
      {/* Top Hero / Header */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img src={treatment.image_url} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-clinic-cream via-transparent to-black/30"></div>
        
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-600 hover:text-clinic-gold transition-all z-20"
        >
          <ChevronLeft size={32} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/60">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 text-clinic-gold mb-2">
                <Sparkles size={20} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Radiant Treatment</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">{treatment.title}</h1>
            </div>
            <div className="bg-clinic-gold/5 border border-clinic-gold/20 px-8 py-4 rounded-3xl text-center shrink-0">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">建議預算</p>
               <div className="text-4xl font-black text-clinic-gold tracking-tighter">
                <span className="text-xl mr-1">NT$</span>
                {treatment.price ? treatment.price.toLocaleString() : '-'}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 mb-4">
                <Info className="text-clinic-gold" size={24} /> 療程特色說明
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed whitespace-pre-line font-light italic">
                {treatment.description || '專業醫美團隊為您提供的極致美學方案。本療程針對您的肌膚困擾進行深度優化，結合最新科技與藝術美感，打造亮立美學標誌性的精緻質感。'}
              </p>
            </div>
            
            <div className="space-y-6">
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">術前提醒</h4>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li className="flex gap-2">• 術前一週避免過度曝曬</li>
                    <li className="flex gap-2">• 停用酸類或美白保養品</li>
                    <li className="flex gap-2">• 懷孕或特殊體質請告知醫師</li>
                  </ul>
               </div>
            </div>
          </div>
        </div>

        {/* Before & After Cases */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-800">術前術後見證</h2>
              <p className="text-gray-400 mt-1">REAL PATIENT RESULTS</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-clinic-gold shadow-sm border border-gray-100">
              <Camera size={24} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cases.length > 0 ? cases.map((c, idx) => (
              <div key={c.id} className="glass-card overflow-hidden group border border-white">
                <div className="h-80 md:h-[400px] relative overflow-hidden bg-gray-100">
                  <img src={c.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-xl">
                      <p className="text-[10px] text-clinic-gold font-black uppercase tracking-widest mb-1">{c.category || '案例'}</p>
                      <h4 className="text-lg font-black text-gray-800">{c.title}</h4>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white/40 rounded-[3rem] border-4 border-dashed border-white/60">
                <Camera size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">目前暫無相關案例展示</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-20 text-center">
          <button onClick={() => router.back()} className="btn-outline px-16 py-6 text-xl">
             返回推薦列表
          </button>
        </div>
      </div>
    </div>
  );
}
