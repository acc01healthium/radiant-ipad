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
            const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
            const imageUrl = t.image_url || (t.icon_name && t.icon_name.includes('/') 
              ? supabase.storage.from('icons').getPublicUrl(t.icon_name).data.publicUrl 
              : null);

            return (
              <div key={t.id} className="glass-card overflow-hidden flex flex-col lg:flex-row animate-fade-in min-h-[500px]">
               <div className="lg:w-[45%] h-[350px] lg:h-auto relative bg-gray-50 flex items-center justify-center overflow-hidden border-r border-white/40">
  {imageUrl ? (
    <img 
      src={imageUrl} 
      alt={t.title} 
      className="w-full h-full object-contain p-4"  // 改為 object-contain 並加上內距
    />
  ) : (
    <div className="text-center text-gray-200 uppercase tracking-widest flex flex-col items-center gap-4">
      <LucideImage size={80} />
      <span className="text-[10px] font-black">Treatment Image Reference</span>
    </div>
  )}
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
