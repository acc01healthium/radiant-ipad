
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, Loader2, DollarSign, Camera, Image as LucideImage } from 'lucide-react';

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
      // 修正：明確指定 select 欄位，避免包含非 DB 欄位導致 400
      const { data, error } = await supabase
        .from('treatments')
        .select(`
          id, title, description, icon_name, image_url, sort_order,
          treatment_price_options (id, label, sessions, price)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // 抓取關聯案例
      let associatedCases: any[] = [];
      
      try {
        // 策略 1: 嘗試從 cases 表抓取 (1-to-many 模式)
        const { data: casesData } = await supabase
          .from('cases')
          .select('*')
          .eq('treatment_id', id);
        if (casesData && casesData.length > 0) {
          associatedCases = [...casesData];
        }

        // 策略 2: 標題精確匹配 (這是用戶特別要求的備案)
        if (data?.title) {
          const { data: titleMatched } = await supabase
            .from('cases')
            .select('*')
            .eq('title', data.title.trim());
          
          if (titleMatched && titleMatched.length > 0) {
            associatedCases = [...associatedCases, ...titleMatched];
          }
        }

        // 去重
        associatedCases = associatedCases.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        console.log("Associated Cases for treatment:", associatedCases);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }

      // 手動排序價格方案
      if (data && data.treatment_price_options) {
        data.treatment_price_options.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0) || a.price - b.price);
      }

      setTreatment({ ...data, cases: associatedCases });
    } catch (err) {
      console.error("Fetch Detail Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;
  if (!treatment) return <div className="p-20 text-center">療程不存在</div>;

  const imageUrl = treatment.image_url || (treatment.icon_name && treatment.icon_name.includes('/') 
    ? supabase.storage.from('icons').getPublicUrl(treatment.icon_name).data.publicUrl 
    : null);

  return (
    <div className="min-h-screen bg-clinic-cream pb-20 bg-pattern">
      <div className="relative h-[25vh] min-h-[300px] w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b">
        {imageUrl ? (
          <img src={imageUrl} alt={treatment.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-200 flex flex-col items-center gap-4">
            <Sparkles size={120} />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Radiant Aesthetic</span>
          </div>
        )}
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
        </div>
      </div>

      {/* 術前術後案例 */}
      {treatment.cases && treatment.cases.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mt-16">
          <div className="flex items-center gap-3 text-clinic-gold mb-8">
            <Camera size={24} />
            <h2 className="text-2xl font-black uppercase tracking-[0.2em]">術前術後案例</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {treatment.cases.map((c: any) => (
              <div key={c.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border group hover:shadow-2xl transition-all">
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  {(c.image_url || c.image_path || c.before_image_url) ? (
                    <img src={c.image_url || c.image_path || c.before_image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <LucideImage size={64} />
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black text-gray-800 mb-2 truncate">{c.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 font-medium italic">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
