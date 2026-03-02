//app/consultation/recommendation/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Fixed: Added Image as LucideImage to the imports to resolve the missing name error
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
        // 1. 找出符合分類的療程 ID
        const { data: relData } = await supabase.from('treatment_improvement_categories').select('treatment_id, category_id');
        
        const treatmentIds = Array.from(new Set(
          (relData || [])
            .filter(r => cats.includes(r.category_id))
            .map(r => r.treatment_id)
        ));

        console.log("Recommended Treatment IDs:", treatmentIds);

        if (treatmentIds.length === 0) {
          setTreatments([]);
          setLoading(false);
          return;
        }

        // 2. 抓取療程詳情
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
          // 如果 400，嘗試不帶價格方案抓取
          const { data: fallbackData } = await supabase.from('treatments').select('*').in('id', treatmentIds);
          setTreatments(fallbackData || []);
        } else {
          // 確保價格方案也正確排序
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
        <div className="grid grid-cols-1 gap-4 md:gap-6 max-w-7xl mx-auto w-full pb-20">
          {treatments.map((t) => {
            const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
            const imageUrl = t.image_url || (t.icon_name && t.icon_name.includes('/') 
              ? supabase.storage.from('icons').getPublicUrl(t.icon_name).data.publicUrl 
              : null);

            return (
              <div key={t.id} className="glass-card overflow-hidden flex flex-col md:flex-row animate-fade-in min-h-[200px] md:min-h-[240px]">
                {/* 左側圖片區 - 縮小比例 */}
                <div className="md:w-[30%] lg:w-[25%] h-[160px] md:h-auto relative bg-gray-50 flex items-center justify-center overflow-hidden border-r border-white/40">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={t.title} 
                      className="w-full h-full object-contain p-3 md:p-4"
                    />
                  ) : (
                    <div className="text-center text-gray-200 uppercase tracking-widest flex flex-col items-center gap-2">
                      <LucideImage size={40} className="md:w-12 md:h-12" />
                      <span className="text-[8px] md:text-[10px] font-black">Treatment Image</span>
                    </div>
                  )}
                </div>

                {/* 右側內容區 - 調整內距 */}
                <div className="md:w-[70%] lg:w-[75%] p-4 md:p-5 lg:p-6 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-2 shrink-0">
                    <div>
                      <h3 className="text-lg md:text-xl lg:text-2xl font-black text-gray-800 tracking-tight mb-1 line-clamp-1">{t.title}</h3>
                      <div className="flex items-center gap-1 text-clinic-gold">
                        <Sparkles size={12} className="md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Radiant Recommended</span>
                      </div>
                    </div>
                    {cheapestOption && (
                      <div className="text-right">
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">方案最低起</p>
                        <p className="text-lg md:text-xl lg:text-2xl font-black text-clinic-gold">NT${cheapestOption.price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-2 italic font-light line-clamp-2">
                    {t.description}
                  </p>

                  {/* 療程標籤 - 可選的簡單資訊 */}
                  {t.treatment_price_options && t.treatment_price_options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.treatment_price_options.slice(0, 3).map((opt: any, idx: number) => (
                        <span key={idx} className="text-[8px] md:text-[10px] bg-clinic-gold/10 text-clinic-gold px-2 py-0.5 rounded-full">
                          {opt.label || `${opt.sessions || 1}堂`}
                        </span>
                      ))}
                      {t.treatment_price_options.length > 3 && (
                        <span className="text-[8px] md:text-[10px] text-gray-400">+{t.treatment_price_options.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2">
                    <Link href={`/treatments/${t.id}`} className="inline-flex items-center gap-1 text-clinic-gold hover:gap-2 transition-all text-xs md:text-sm font-black uppercase tracking-wider">
                      查看療程細節 <ArrowRight size={14} className="md:w-4 md:h-4" />
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
