
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, ArrowRight, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

function RecommendationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const cats = searchParams.get('cats')?.split(',') || [];
      if (cats.length === 0) {
        router.push('/consultation');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('treatments')
          .select(`
            *,
            treatment_price_options (*),
            treatment_cases (*),
            treatment_improvement_categories!inner (category_id)
          `)
          .in('treatment_improvement_categories.category_id', cats)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setTreatments(data || []);
      } catch (err) {
        console.error("Fetch recommendations error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [searchParams, router]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-clinic-cream">
      <Loader2 className="animate-spin text-clinic-gold mb-4" size={48} />
      <p className="text-gray-400 font-bold tracking-[0.3em] uppercase animate-pulse">正在為您篩選極致美學方案</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-clinic-cream flex flex-col p-6 md:p-10 bg-pattern overflow-x-hidden">
      <header className="flex items-center justify-between mb-10 shrink-0">
        <button onClick={() => router.back()} className="p-4 bg-white/80 backdrop-blur shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all border border-white">
          <ChevronLeft size={28} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-[0.2em] uppercase">專業推薦方案</h2>
          <div className="h-1 w-20 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-12"></div>
      </header>

      {treatments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
          <Sparkles size={80} className="text-gray-200 mb-6" />
          <h3 className="text-2xl font-black text-gray-400 tracking-widest">目前此組合尚無推薦療程</h3>
          <button onClick={() => router.push('/consultation')} className="mt-8 text-clinic-gold font-bold underline underline-offset-8">返回重新選擇改善項目</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 md:gap-20 max-w-7xl mx-auto w-full pb-32">
          {treatments.map((t) => {
            const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
            return (
              <div key={t.id} className="glass-card overflow-hidden flex flex-col lg:flex-row animate-fade-in border-white/60 min-h-[500px]">
                {/* 修復點：使用 h-[350px]~[500px] 並 object-contain 確保療程海報完整 */}
                <div className="lg:w-[45%] h-[350px] lg:h-auto relative bg-gray-50 flex items-center justify-center p-8 border-r border-white/40 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                  <img 
                    src={t.image_url} 
                    alt={t.title} 
                    className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl transition-transform duration-500 hover:scale-105" 
                  />
                </div>

                <div className="lg:w-[55%] p-8 md:p-12 flex flex-col overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 shrink-0">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mb-2">{t.title}</h3>
                      <div className="flex items-center gap-2 text-clinic-gold">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Radiant Recommended</span>
                      </div>
                    </div>
                    {cheapestOption && (
                      <div className="text-left md:text-right shrink-0">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">方案最低起</p>
                        <p className="text-3xl font-black text-clinic-gold tracking-tighter">
                          <span className="text-sm mr-1 opacity-60">NT$</span>
                          {cheapestOption.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-500 text-lg leading-relaxed mb-8 italic font-light opacity-80 shrink-0">
                    {t.description || '專業醫美團隊為您量身打造的極致美學方案。結合最新科技與藝術美感，針對您的特定需求進行深度優化。'}
                  </p>

                  <div className="space-y-6 flex-1 min-h-0">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                      <Info size={14} className="text-clinic-gold" /> 術前後見證案例
                    </h4>
                    
                    {/* 修復點：案例輪播給予固定高度防止抖動，並確保圖片物體填滿容器 */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x h-full">
                      {t.treatment_cases && t.treatment_cases.length > 0 ? (
                        t.treatment_cases.map((c: any) => (
                          <div key={c.id} className="min-w-[280px] md:min-w-[320px] bg-white rounded-3xl p-4 shadow-sm border border-gray-100 snap-start group flex flex-col">
                            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                                <img src={c.before_image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Before</div>
                              </div>
                              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                                <img src={c.after_image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute top-2 left-2 bg-clinic-gold/80 backdrop-blur text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">After</div>
                              </div>
                            </div>
                            <div className="flex-1 min-h-0">
                              <h5 className="font-black text-gray-800 text-sm truncate">{c.title}</h5>
                              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5 italic">{c.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="w-full p-8 bg-gray-50/50 rounded-[2rem] border border-dashed text-center text-gray-300 text-sm font-bold italic flex items-center justify-center">
                          目前此療程尚無術前後見證案例
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4 shrink-0">
                    <Link href={`/treatments/${t.id}`} className="btn-gold flex-1 py-5 text-lg tracking-widest uppercase font-black shadow-clinic-gold/20">
                      查看完整療程細節 <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationContent />
    </Suspense>
  );
}
