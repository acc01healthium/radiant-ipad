
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, ArrowRight, Loader2, Camera } from 'lucide-react';
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

      const { data } = await supabase
        .from('treatments')
        .select(`
          *,
          treatment_price_options (*),
          treatment_categories!inner (category_id)
        `)
        .in('treatment_categories.category_id', cats)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      setTreatments(data || []);
      setLoading(false);
    };
    fetchRecommendations();
  }, [searchParams, router]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;

  return (
    <div className="min-h-screen bg-clinic-cream flex flex-col p-6 md:p-10 bg-pattern">
      <header className="flex items-center justify-between mb-10 shrink-0">
        <button onClick={() => router.back()} className="p-3 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all"><ChevronLeft size={28} /></button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-widest uppercase">專業推薦方案</h2>
          <div className="h-1 w-12 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full pb-20">
        {treatments.map((t) => {
          const cheapestOption = t.treatment_price_options?.sort((a: any, b: any) => a.price - b.price)[0];
          return (
            <div key={t.id} className="glass-card overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
              {/* Poster Container: Full display strategy */}
              <div className="aspect-[4/3] relative bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-0 bg-white/20"></div>
                <img 
                  src={t.image_url} 
                  alt={t.title} 
                  className="max-w-full max-h-full object-contain relative z-10 drop-shadow-md group-hover:scale-105 transition-transform duration-700" 
                />
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{t.title}</h3>
                  {cheapestOption && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">方案起</p>
                      <p className="text-xl font-black text-clinic-gold tracking-tighter">NT$ {cheapestOption.price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1 italic line-clamp-3">
                  {t.description || '專業醫美團隊為您量身打造的極致美學方案。'}
                </p>

                <div className="flex gap-4">
                  <Link href={`/treatments/${t.id}`} className="btn-gold flex-1 py-4 text-sm tracking-widest uppercase font-bold">
                    詳情與案例 <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
