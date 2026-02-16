'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

export default function ConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [systemTexts, setSystemTexts] = useState<Record<string, string>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

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

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategoryIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*, treatment_improvement_categories!inner(category_id)')
        .in('treatment_improvement_categories.category_id', selectedCategoryIds)
        .order('sort_order', { ascending: true });
      
      const uniqueTreatments = Array.from(new Map((data || []).map(item => [item.id, item])).values());
      setRecommendations(uniqueTreatments);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIconUrl = (cat: any) => {
    if (cat.icon_image_path) {
      return `${supabase.storage.from('icons').getPublicUrl(cat.icon_image_path).data.publicUrl}?v=${cat.icon_image_updated_at ? Date.parse(cat.icon_image_updated_at) : '1'}`;
    }
    return cat.icon_url || null;
  };

  const renderIcon = (cat: any, isSelected: boolean) => {
    const imageUrl = getIconUrl(cat);
    
    return (
      <div className={`
        relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center overflow-hidden transition-all duration-500
        ${isSelected ? 'bg-amber-100 ring-4 ring-white shadow-lg' : 'bg-amber-50/60 shadow-inner group-hover:bg-amber-100'}
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
            return <Icon size={isSelected ? 48 : 40} className={isSelected ? 'text-amber-600' : 'text-amber-400/80'} />;
          })()
        )}
        {/* Subtle Overlay for consistency */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-full"></div>
      </div>
    );
  };

  if (loading && categories.length === 0) {
    return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;
  }

  return (
    <div className="h-screen bg-clinic-cream flex flex-col p-6 md:p-10 relative overflow-hidden bg-pattern">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 z-10 shrink-0">
        <button onClick={() => step === 1 ? router.push('/') : setStep(1)} className="p-4 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl text-gray-400 hover:text-clinic-gold transition-all border border-white">
          <ChevronLeft size={28} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-[0.2em] uppercase">
            {step === 1 ? (systemTexts['consult_step1_title'] || '改善項目') : '專業推薦方案'}
          </h2>
          <div className="flex justify-center mt-2 gap-1.5">
            <div className={`h-1 w-10 rounded-full transition-all duration-500 ${step === 1 ? 'bg-clinic-gold w-16' : 'bg-gray-200'}`}></div>
            <div className={`h-1 w-10 rounded-full transition-all duration-500 ${step === 2 ? 'bg-clinic-gold w-16' : 'bg-gray-200'}`}></div>
          </div>
        </div>
        <div className="w-14"></div>
      </header>

      {step === 1 ? (
        <div className="flex-1 flex flex-col items-center max-w-7xl mx-auto w-full z-10 overflow-hidden">
          <div className="mb-6 text-center animate-fade-in shrink-0">
            <h3 className="text-3xl md:text-4xl font-light text-gray-700">{systemTexts['consult_instruction'] || '想改善的問題 (可複選)'}</h3>
          </div>

          {/* Grid: 2 cols on mobile, 3 on iPad/md, 4 on desktop/xl */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full flex-1 overflow-y-auto scrollbar-hide pb-24">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`
                    group relative flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 animate-fade-in
                    h-[200px] md:h-[230px] lg:h-[240px] rounded-[2.5rem] border-2 shadow-sm backdrop-blur-sm
                    ${isSelected 
                      ? 'bg-amber-50/60 border-amber-400 shadow-amber-200/20 z-10 scale-[1.02]' 
                      : 'bg-white/70 border-white hover:border-amber-200 hover:shadow-md'
                    }
                  `}
                >
                  {renderIcon(cat, isSelected)}
                  <span className={`mt-4 text-xl md:text-2xl font-black tracking-[0.1em] ${isSelected ? 'text-amber-700' : 'text-gray-600'}`}>
                    {cat.name}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-amber-500 p-1.5 rounded-full shadow-lg border-2 border-white">
                      <Check size={16} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20 px-6">
            <button 
              disabled={selectedCategoryIds.length === 0 || loading} 
              onClick={handleGenerate} 
              className={`
                flex items-center gap-4 px-16 py-6 rounded-full text-2xl font-black tracking-widest transition-all shadow-2xl
                ${selectedCategoryIds.length > 0 
                  ? 'bg-clinic-gold text-white scale-100 hover:scale-105 active:scale-95 shadow-clinic-gold/40' 
                  : 'bg-gray-200 text-gray-400 scale-90 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {loading ? <Loader2 className="animate-spin" /> : '分析推薦方案'}
              <ArrowRight size={28} />
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Recommendations */
        <div className="flex-1 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10 overflow-y-auto animate-fade-in scrollbar-hide">
          {recommendations.length > 0 ? recommendations.map((t, idx) => (
            <Link 
              href={`/treatments/${t.id}`} 
              key={t.id} 
              style={{ animationDelay: `${idx * 0.1}s` }} 
              className="glass-card overflow-hidden flex flex-col h-full group hover:shadow-2xl hover:border-amber-200 transition-all duration-500 animate-fade-in border border-white"
            >
              <div className="h-56 md:h-64 relative overflow-hidden bg-gray-100 shrink-0">
                <img src={t.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                   <div className="text-amber-600 font-black text-sm flex items-center gap-2">詳情與案例 <ArrowRight size={14} /></div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-clinic-gold transition-colors">{t.title}</h4>
                <p className="text-gray-500 mb-6 flex-1 leading-relaxed text-base italic line-clamp-3">
                  {t.description || '專業醫美團隊為您量身打造的極致美學方案。'}
                </p>
                <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                   <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">諮詢費用約</div>
                   <div className="text-3xl font-black text-clinic-gold tracking-tight">
                    <span className="text-sm mr-1 opacity-60">NT$</span>
                    {t.price ? t.price.toLocaleString() : '-'}
                   </div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="col-span-full py-48 text-center flex flex-col items-center justify-center">
               <Sparkles size={80} className="text-gray-200 mb-6" />
               <h4 className="text-2xl font-black text-gray-400 tracking-widest">目前此組合查無符合方案</h4>
               <button onClick={() => setStep(1)} className="mt-8 text-clinic-gold font-bold underline underline-offset-8">返回重新選擇改善項目</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
