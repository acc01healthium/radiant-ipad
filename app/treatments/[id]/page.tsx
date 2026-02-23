'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Sparkles, Loader2, DollarSign, Camera, Image as LucideImage, X, ZoomIn } from 'lucide-react';

export default function TreatmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select(`
          id, title, description, icon_name, image_url, sort_order,
          treatment_price_options (id, label, sessions, price)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      let associatedCases: any[] = [];

      try {
        const { data: rels } = await supabase
          .from('treatment_case_relations')
          .select('case_id')
          .eq('treatment_id', id)
          .eq('is_active', true)
          .order('display_order');
      
        if (rels && rels.length > 0) {
          const caseIds = rels.map(r => r.case_id);
          const { data: casesDataRel } = await supabase
            .from('cases')
            .select('*')
            .in('id', caseIds);
          
          if (casesDataRel) {
            associatedCases = [...casesDataRel];
          }
        }

        if (associatedCases.length === 0) {
          const { data: oldRels } = await supabase
            .from('treatment_categories')
            .select('case_id')
            .eq('treatment_id', id);
          
          if (oldRels && oldRels.length > 0) {
            const oldCaseIds = oldRels.map(r => r.case_id);
            const { data: oldCasesData } = await supabase
              .from('cases')
              .select('*')
              .in('id', oldCaseIds);
            
            if (oldCasesData) {
              associatedCases = [...oldCasesData];
            }
          }
        }

        if (associatedCases.length === 0 && data?.title) {
          const { data: titleMatched } = await supabase
            .from('cases')
            .select('*')
            .eq('title', data.title.trim());
          
          if (titleMatched && titleMatched.length > 0) {
            associatedCases = [...associatedCases, ...titleMatched];
          }
        }

        associatedCases = associatedCases.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }

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
      {/* 置頂圖 - 微調版本 */}
      <div className="relative w-full bg-gradient-to-br from-clinic-gold/10 to-gray-900 flex items-end justify-start overflow-hidden border-b" 
           style={{ minHeight: '400px', height: 'min(55vh, 700px)' }}>
        {imageUrl ? (
          <>
            {/* 背景模糊圖層 - 增加色彩濾鏡 */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${imageUrl})`,
                filter: 'brightness(0.7) blur(8px)',
                transform: 'scale(1.1)'
              }}
            />
            {/* 額外漸層覆蓋，讓文字更清楚 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            
            {/* 前景清晰圖片 - 加上輕微陰影和邊框 */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-8 md:p-12">
              <img 
                src={imageUrl} 
                alt={treatment.title} 
                className="max-h-full max-w-full object-contain rounded-3xl shadow-2xl border-4 border-white/20"
                style={{ maxHeight: 'min(85%, 550px)' }}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-200 flex-col gap-4">
            <Sparkles size={120} />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Radiant Aesthetic</span>
          </div>
        )}
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-600 z-20 hover:bg-white transition-all"
        >
          <ChevronLeft size={32} />
        </button>
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
  
  {/* 新增的注意事項 */}
  <div className="mt-4 pt-4 border-t border-amber-200/50 text-center">
    <p className="text-xs text-gray-400 italic font-light tracking-wide">
      * 實際價格以診所價目表為主
    </p>
  </div>
</div>
          </div>
        </div>
      </div>

      {treatment.cases && treatment.cases.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mt-24">
          <div className="flex items-center gap-4 text-clinic-gold mb-12">
            <div className="w-14 h-14 bg-clinic-gold/10 rounded-2xl flex items-center justify-center">
              <Camera size={28} className="text-clinic-gold" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
                術前術後<span className="text-clinic-gold">案例</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1 tracking-wide">真實客戶見證・改變看得見</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {treatment.cases.map((c: any) => (
              <div key={c.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                {/* 圖片區塊 - 加入點擊放大功能 */}
                <div 
                  className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-gray-50 cursor-pointer group/case"
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="aspect-[4/3] w-full">
                    {(c.image_url || c.image_path || c.before_image_url) ? (
                      <>
                        <img 
                          src={c.image_url || c.image_path || c.before_image_url} 
                          alt={c.title} 
                          className="w-full h-full object-contain p-4 group-hover/case:scale-105 transition-transform duration-700"
                        />
                        {/* 懸浮時顯示放大鏡圖示 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/case:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={48} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <LucideImage size={64} />
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-black text-clinic-gold shadow-lg border border-clinic-gold/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-clinic-gold rounded-full animate-pulse"></span>
                    BEFORE × AFTER
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-gray-800 mb-3 line-clamp-1 group-hover:text-clinic-gold transition-colors">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-gray-500 text-sm line-clamp-3 font-medium italic leading-relaxed">
                      {c.description}
                    </p>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      真實案例
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 圖片放大 Modal */}
      {selectedCase && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-10"
          onClick={() => setSelectedCase(null)}
        >
          <div className="relative max-w-5xl w-full max-h-full bg-white/10 backdrop-blur-lg rounded-3xl p-6 flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedCase(null)} 
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white z-10 transition-all"
            >
              <X size={24} />
            </button>
            
            {/* 左側：大圖 */}
            <div className="md:w-3/5 flex items-center justify-center bg-black/20 rounded-2xl p-4">
              <img 
                src={selectedCase.image_url || selectedCase.image_path || selectedCase.before_image_url} 
                alt={selectedCase.title} 
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            
            {/* 右側：詳細文字 */}
            <div className="md:w-2/5 text-white flex flex-col">
              <h3 className="text-3xl font-black mb-4">{selectedCase.title}</h3>
              {selectedCase.description && (
                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                  {selectedCase.description}
                </p>
              )}
              
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex gap-4">
                  <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold">術前</div>
                  <div className="bg-clinic-gold/20 px-4 py-2 rounded-full text-sm font-bold">術後</div>
                </div>
                <p className="mt-4 text-sm text-gray-300 italic">點擊圖片外部或按 ESC 可關閉</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
