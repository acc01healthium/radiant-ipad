
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
            treatment_improvement_categories!inner (improvement_category_id)
          `)
          .in('treatment_improvement_categories.improvement_category_id', cats)
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
      <p className="text-gray-400 font-bold tracking-[0.3em] uppercase animate-pulse">正在為您篩選方案</p>
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
          <button onClick={() => router.push('/consultation')} className="mt-8 text-clinic-gold font-bold underline underline-offset-8">返回重新選擇</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 md:gap-20 max-w-7xl mx-auto w-full pb-32">
          {treatments.map((t) => {
            // 計算最低價格時，對標正確的欄位與 table
            const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
            return (
              <div key={t.id} className="glass-card overflow-hidden flex flex-col lg:flex-row animate-fade-in min-h-[500px]">
                <div className="lg:w-[45%] h-[350px] lg:h-auto relative bg-gray-50 flex items-center justify-center p-8 border-r border-white/40">
                  <img src={t.visual_path} alt={t.title} className="max-w-full max-h-full object-contain relative z-10" />
                </div>

                <div className="lg:w-[55%] p-8 md:p-12 flex flex-col">
                  <div className="flex justify-between items-start gap-4 mb-6 shrink-0">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mb-2">{t.title}</h3>
                      <div className="flex items-center gap-2 text-clinic-gold">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Radiant Recommended</span>
                      </div>
                    </div>
                    {cheapestOption && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">方案最低起</p>
                        <p className="text-3xl font-black text-clinic-gold">NT${cheapestOption.price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-500 text-lg leading-relaxed mb-8 italic font-light line-clamp-3">
                    {t.description}
                  </p>

                  <div className="space-y-6 flex-1">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Info size={14} className="text-clinic-gold" /> 見證案例
                    </h4>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                      {t.treatment_cases && t.treatment_cases.length > 0 ? (
                        t.treatment_cases.map((c: any) => (
                          <div key={c.id} className="min-w-[280px] bg-white rounded-3xl p-4 shadow-sm border border-gray-100 snap-start">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 mb-3">
                              <img src={c.image_path} className="w-full h-full object-cover" />
                            </div>
                            <h5 className="font-black text-gray-800 text-sm truncate">{c.title}</h5>
                          </div>
                        ))
                      ) : (
                        <div className="w-full p-8 text-center text-gray-300 text-xs italic">尚無案例</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <Link href={`/treatments/${t.id}`} className="btn-gold w-full py-5 text-lg tracking-widest uppercase font-black">
                      查看療程細節 <ArrowRight size={20} />
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
