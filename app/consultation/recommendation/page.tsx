//app/consultation/recommendation/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, ArrowRight, Loader2, Info, Image as LucideImage } from 'lucide-react';
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
        const { data: relData } = await supabase.from('treatment_improvement_categories').select('treatment_id, category_id');
        
        const treatmentIds = Array.from(new Set(
          (relData || [])
            .filter(r => cats.includes(r.category_id))
            .map(r => r.treatment_id)
        ));

        if (treatmentIds.length === 0) {
          setTreatments([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('treatments')
          .select(`
            id, title, description, icon_name, image_url, sort_order,
            treatment_price_options (id, label, sessions, price)
          `)
          .in('id', treatmentIds)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error("Fetch treatments error:", error);
          const { data: fallbackData } = await supabase.from('treatments').select('*').in('id', treatmentIds);
          setTreatments(fallbackData || []);
        } else {
          const sortedData = (data || []).map(t => ({
            ...t,
            treatment_price_options: (t.treatment_price_options || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0) || a.price - b.price)
          }));
          setTreatments(sortedData);
        }
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
    <div className="min-h-[100dvh] bg-clinic-cream flex flex-col p-4 md:p-6 lg:p-8 bg-pattern overflow-x-hidden">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => router.back()} className="p-3 md:p-4 bg-white/80 backdrop-blur shadow-md rounded-xl md:rounded-2xl text-gray-400 hover:text-clinic-gold transition-all border border-white">
          <ChevronLeft size={24} className="md:w-7 md:h-7" />
        </button>
        <div className="text-center">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-clinic-dark tracking-[0.2em] uppercase">專業推薦方案</h2>
          <div className="h-1 w-full max-w-[200px] md:max-w-[280px] lg:max-w-[400px] bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-10 md:w-12"></div>
      </header>

      {treatments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 md:p-20">
          <Sparkles size={60} className="text-gray-200 mb-4" />
          <h3 className="text-xl md:text-2xl font-black text-gray-400 tracking-widest">目前此組合尚無推薦療程</h3>
          <button onClick={() => router.push('/consultation')} className="mt-6 text-clinic-gold font-bold underline underline-offset-8">返回重新選擇</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-7xl mx-auto w-full pb-20">
          {treatments.map((t) => {
            const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
            const imageUrl = t.image_url || (t.icon_name && t.icon_name.includes('/') 
              ? supabase.storage.from('icons').getPublicUrl(t.icon_name).data.publicUrl 
              : null);

            return (
              <Link 
                href={`/treatments/${t.id}`} 
                key={t.id} 
                className="group glass-card overflow-hidden flex flex-col animate-fade-in hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* 圖片區 */}
                <div className="h-[140px] sm:h-[160px] relative bg-gray-50 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={t.title} 
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center text-gray-200 uppercase tracking-widest flex flex-col items-center gap-2">
                      <LucideImage size={40} />
                      <span className="text-[8px] font-black">療程圖片</span>
                    </div>
                  )}
                </div>

                {/* 內容區 */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-gray-800 tracking-tight mb-1 line-clamp-1">{t.title}</h3>
                      <div className="flex items-center gap-1 text-clinic-gold">
                        <Sparkles size={10} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Radiant Recommended</span>
                      </div>
                    </div>
                    {cheapestOption && (
                      <div className="text-right">
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">最低起</p>
                        <p className="text-sm sm:text-base font-black text-clinic-gold">NT${cheapestOption.price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-3 italic font-light line-clamp-3">
                    {t.description}
                  </p>

                  {/* 價格標籤 */}
                  {t.treatment_price_options && t.treatment_price_options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.treatment_price_options.slice(0, 2).map((opt: any, idx: number) => (
                        <span key={idx} className="text-[8px] bg-clinic-gold/10 text-clinic-gold px-2 py-0.5 rounded-full">
                          {opt.label || `${opt.sessions || 1}堂`}
                        </span>
                      ))}
                      {t.treatment_price_options.length > 2 && (
                        <span className="text-[8px] text-gray-400">+{t.treatment_price_options.length - 2}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2 border-t border-gray-100 flex justify-end items-center">
                    <span className="inline-flex items-center gap-1 text-clinic-gold group-hover:gap-2 transition-all text-xs font-black uppercase tracking-wider">
                      查看療程細節 <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
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
