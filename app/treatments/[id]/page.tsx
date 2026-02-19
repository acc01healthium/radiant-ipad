
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, Loader2, DollarSign, Camera } from 'lucide-react';

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<any>(null);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*, treatment_price_options(*), treatment_cases(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setTreatment(data);
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
      <div className="relative h-[45vh] w-full bg-gray-50 flex items-center justify-center p-8 overflow-hidden border-b">
        <img src={treatment.visual_path} className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl" alt={treatment.title} />
        <button onClick={() => router.back()} className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-600 z-20"><ChevronLeft size={32} /></button>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[3.5rem] p-10 md:p-16 shadow-2xl border">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-clinic-gold mb-3">
                <Sparkles size={20} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Radiant Treatment</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight">{treatment.title}</h1>
              <p className="mt-8 text-gray-500 text-lg leading-relaxed whitespace-pre-line font-light italic">
                {treatment.description}
              </p>
            </div>
            
            <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col gap-4 min-w-[320px]">
              <div className="flex items-center gap-2 text-amber-600 mb-2 border-b border-amber-100 pb-3">
                <DollarSign size={20} />
                <span className="text-sm font-black uppercase tracking-widest">課程方案</span>
              </div>
              <div className="space-y-4">
                {treatment.treatment_price_options?.length > 0 ? (
                  treatment.treatment_price_options.sort((a:any, b:any) => a.sort_order - b.sort_order).map((opt:any) => {
                    // 顯示邏輯：標籤 Mapping
                    const displayLabel = (opt.label === 'EMPTY' || !opt.label) 
                      ? (opt.sessions === 1 ? '單堂' : `${opt.sessions}堂`) 
                      : opt.label;

                    return (
                      <div key={opt.id} className="flex justify-between items-center">
                        <span className="text-gray-600 font-bold">{displayLabel} ({opt.sessions || 1}堂)</span>
                        <div className="text-2xl font-black text-clinic-gold">NT${opt.price.toLocaleString()}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 italic text-sm">洽詢專人規劃</div>
                )}
              </div>
            </div>
          </div>

          {treatment.treatment_cases?.length > 0 && (
            <div className="mt-12 border-t pt-12">
              <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3">
                <Camera className="text-clinic-gold" /> 術前後見證案例
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {treatment.treatment_cases.sort((a:any, b:any) => a.sort_order - b.sort_order).map((c: any) => (
                  <div key={c.id} className="bg-white rounded-[2rem] border overflow-hidden shadow-sm group">
                    <div className="aspect-[4/3] bg-gray-50">
                      <img src={c.image_path} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold text-gray-800">{c.title}</h4>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
