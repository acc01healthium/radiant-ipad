
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [systemTexts, setSystemTexts] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const selectedCatsFromUrl = useMemo(() => {
    const cats = searchParams.get('cats');
    return cats ? cats.split(',') : [];
  }, [searchParams]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // 同步 URL 到選取狀態
  useEffect(() => {
    if (selectedCatsFromUrl.length > 0) {
      setSelectedCategoryIds(selectedCatsFromUrl);
    }
  }, [selectedCatsFromUrl]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, textsRes] = await Promise.all([
        supabase.from('improvement_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('system_texts').select('*')
      ]);
      setCategories(catsRes.data || []);
      setSystemTexts((textsRes.data || []).reduce((acc: any, curr) => ({ ...acc, [curr.key]: curr.value }), {}));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isStep2 = searchParams.get('step') === '2';

  // 獲取推薦療程
  useEffect(() => {
    if (isStep2 && selectedCategoryIds.length > 0) {
      const fetchRecs = async () => {
        setLoading(true);
        try {
          const { data } = await supabase
            .from('treatments')
            .select('*, treatment_price_options(*), treatment_improvement_categories!inner(category_id)')
            .in('treatment_improvement_categories.category_id', selectedCategoryIds)
            .order('sort_order', { ascending: true });
          
          const unique = Array.from(new Map((data || []).map(item => [item.id, item])).values());
          setRecommendations(unique);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchRecs();
    }
  }, [isStep2, selectedCategoryIds]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedCategoryIds.length === 0) return;
    const params = new URLSearchParams();
    params.set('step', '2');
    params.set('cats', selectedCategoryIds.join(','));
    router.push(`/consultation?${params.toString()}`);
  };

  const renderIcon = (cat: any, isSelected: boolean) => {
    const imageUrl = cat.icon_image_path 
      ? `${supabase.storage.from('icons').getPublicUrl(cat.icon_image_path).data.publicUrl}?v=${cat.icon_image_updated_at ? Date.parse(cat.icon_image_updated_at) : '1'}`
      : cat.icon_url;
    
    return (
      <div className={`
        relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-500
        ${isSelected ? 'bg-amber-100 ring-4 ring-white shadow-lg scale-105' : 'bg-amber-50/60 shadow-inner group-hover:bg-amber-100'}
      `}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="" 
            className={`w-full h-full object-cover object-center transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} 
          />
        ) : (
          (() => {
            const Icon = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
            return <Icon size={isSelected ? 40 : 32} className={isSelected ? 'text-amber-600' : 'text-amber-400/80'} />;
          })()
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-full"></div>
      </div>
    );
  };

  if (loading && categories.length === 0) {
    return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-clinic-cream flex flex-col p-6 md:p-10 relative overflow-x-hidden bg-pattern">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button 
          onClick={() => isStep2 ? router.push('/consultation') : router.push('/')} 
          className="p-4 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl text-gray-400 hover:text-clinic-gold transition-all border border-white"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-[0.2em] uppercase">
            {isStep2 ? '專業推薦方案' : (systemTexts['consult_step1_title'] || '改善項目')}
          </h2>
          <div className="h-1 w-20 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-14"></div>
      </header>

      {!isStep2 ? (
        <div className="flex-1 flex flex-col items-center max-w-7xl mx-auto w-full z-10 pb-32">
          <div className="mb-8 text-center animate-fade-in shrink-0">
            <h3 className="text-3xl md:text-4xl font-light text-gray-700">{systemTexts['consult_instruction'] || '想改善的問題 (可複選)'}</h3>
            <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase font-bold opacity-60">iPad 橫式優化介面</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`
                    group relative flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 animate-fade-in
                    h-[180px] md:h-[220px] lg:h-[240px] rounded-[2.5rem] border-2 shadow-sm backdrop-blur-sm p-4
                    ${isSelected 
                      ? 'bg-amber-50/60 border-amber-400 shadow-amber-200/20 z-10 scale-[1.02]' 
                      : 'bg-white/70 border-white hover:border-amber-200 hover:shadow-md'
                    }
                  `}
                >
                  {renderIcon(cat, isSelected)}
                  <span className={`mt-4 text-lg md:text-xl font-black tracking-widest ${isSelected ? 'text-amber-700' : 'text-gray-600'}`}>
                    {cat.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-amber-500 p-1 rounded-full shadow-lg border-2 border-white">
                      <Check size={14} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-clinic-cream via-clinic-cream to-transparent z-20 flex justify-center">
            <button 
              disabled={selectedCategoryIds.length === 0} 
              onClick={handleNext} 
              className={`
                flex items-center gap-4 px-16 py-6 rounded-full text-2xl font-black tracking-widest transition-all shadow-2xl
                ${selectedCategoryIds.length > 0 
                  ? 'bg-clinic-gold text-white scale-100 hover:scale-105 active:scale-95 shadow-clinic-gold/40' 
                  : 'bg-gray-200 text-gray-400 scale-90 opacity-50 cursor-not-allowed'
                }
              `}
            >
              下一步：分析方案 <ArrowRight size={28} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 animate-fade-in scrollbar-hide overflow-y-auto">
          {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div> :
            recommendations.length > 0 ? recommendations.map((t, idx) => (
              <Link 
                href={`/treatments/${t.id}`} 
                key={t.id} 
                style={{ animationDelay: `${idx * 0.1}s` }}
                className="glass-card overflow-hidden flex flex-col h-full group hover:shadow-2xl hover:border-amber-200 transition-all duration-500 animate-fade-in border border-white"
              >
                <div className="h-64 bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden shrink-0 border-b border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent z-0"></div>
                  <img 
                    src={t.image_url} 
                    className="max-w-full max-h-full object-contain relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-700" 
                    alt={t.title} 
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm z-20">
                    <div className="text-amber-600 font-black text-[10px] flex items-center gap-2 uppercase tracking-widest">詳情與案例 <ArrowRight size={12} /></div>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h4 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-clinic-gold transition-colors">{t.title}</h4>
                  <p className="text-gray-500 mb-6 flex-1 leading-relaxed text-base italic line-clamp-3">
                    {t.description || '專業醫美團隊為您量身打造的極致美學方案。'}
                  </p>
                  <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 block">最低方案價</span>
                      <div className="text-3xl font-black text-clinic-gold tracking-tight">
                        <span className="text-sm mr-1 opacity-60">NT$</span>
                        {t.treatment_price_options?.length > 0 
                          ? Math.min(...t.treatment_price_options.filter((o:any) => o.is_active).map((o:any) => o.price)).toLocaleString()
                          : (t.price ? t.price.toLocaleString() : '-')}
                      </div>
                    </div>
                    {t.treatment_price_options?.length > 0 && (
                      <div className="flex -space-x-3">
                        {t.treatment_price_options.filter((o:any) => o.is_active).sort((a:any, b:any) => (a.sessions || 0) - (b.sessions || 0)).slice(0, 3).map((o:any, i:number) => (
                          <div key={o.id} className="w-10 h-10 rounded-full bg-white border-2 border-amber-50 flex items-center justify-center text-[10px] font-black text-amber-500 shadow-sm ring-2 ring-white">
                            {o.sessions ? `${o.sessions}堂` : '方案'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-48 text-center flex flex-col items-center justify-center">
                 <Sparkles size={80} className="text-gray-200 mb-6" />
                 <h4 className="text-2xl font-black text-gray-400 tracking-widest">目前此組合查無符合方案</h4>
                 <button onClick={() => router.push('/consultation')} className="mt-8 text-clinic-gold font-bold underline underline-offset-8">返回重新選擇改善項目</button>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>}>
      <ConsultationContent />
    </Suspense>
  );
}
