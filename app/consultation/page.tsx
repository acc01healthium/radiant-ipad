'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function ConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

      if (catsRes.error) throw catsRes.error;
      // 限制前 6 個以符合 3x2 網格
      setCategories((catsRes.data || []).slice(0, 6));

      const texts = (textsRes.data || []).reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      setSystemTexts(texts);
    } catch (err: any) {
      setError('系統資料初始化失敗');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (selectedCategoryIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*, treatment_improvement_categories!inner(category_id)')
        .in('treatment_improvement_categories.category_id', selectedCategoryIds)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      const uniqueTreatments = Array.from(new Map(data.map(item => [item.id, item])).values());
      setRecommendations(uniqueTreatments);
      setStep(2);
    } catch (err: any) {
      setError('推薦方案生成失敗');
    } finally {
      setLoading(false);
    }
  };

  // 動態渲染圖示 Helper
  const renderCategoryIcon = (cat: any, isSelected: boolean) => {
    if (cat.icon_image_path) {
      const imageUrl = `${supabase.storage.from('icons').getPublicUrl(cat.icon_image_path).data.publicUrl}?v=${Date.parse(cat.icon_image_updated_at || cat.updated_at)}`;
      return (
        <div className="w-24 h-24 mb-4 flex items-center justify-center overflow-hidden rounded-full bg-gray-50/50 shadow-inner">
          <img 
            src={imageUrl} 
            alt={cat.name} 
            className={`w-full h-full object-cover object-center transition-all duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} 
          />
        </div>
      );
    }

    // Fallback to Lucide
    const IconComponent = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
    return (
      <div className={`w-24 h-24 mb-4 flex items-center justify-center rounded-full ${isSelected ? 'bg-clinic-gold/20' : 'bg-gray-50'}`}>
        <IconComponent size={48} className={isSelected ? 'text-clinic-gold' : 'text-gray-300'} />
      </div>
    );
  };

  if (loading && step === 1 && categories.length === 0) {
    return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;
  }

  return (
    <div className="h-screen bg-clinic-cream flex flex-col p-8 md:p-10 relative overflow-hidden bg-pattern">
      <header className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button onClick={() => step === 1 ? router.push('/') : setStep(1)} className="p-4 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all"><ChevronLeft size={32} /></button>
        <div className="text-center">
          <h2 className="text-3xl font-light text-clinic-dark tracking-widest uppercase">{step === 1 ? (systemTexts['consult_step1_title'] || '您的肌膚困擾') : (systemTexts['consult_step2_title'] || '專業推薦方案')}</h2>
          <div className="flex justify-center mt-2 gap-1">
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-clinic-gold w-20' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-clinic-gold w-20' : 'bg-gray-200'}`}></div>
          </div>
        </div>
        <div className="w-16"></div>
      </header>

      {step === 1 ? (
        <div className="flex-1 flex flex-col items-center max-w-6xl mx-auto w-full z-10 overflow-hidden">
          <div className="mb-8 text-center animate-fade-in shrink-0">
            <h3 className="text-4xl font-light text-gray-700">{systemTexts['consult_instruction'] || '請選擇您想改善的問題'}</h3>
          </div>

          <div className="grid grid-cols-3 grid-rows-2 gap-6 w-full flex-1 mb-8">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`group h-[260px] rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 relative animate-fade-in shadow-sm border-2
                    ${isSelected 
                      ? 'bg-clinic-gold/5 border-clinic-gold shadow-xl scale-[1.02]' 
                      : 'bg-white border-gray-100 hover:shadow-lg hover:border-clinic-gold/20'
                    }
                  `}
                >
                  {renderCategoryIcon(cat, isSelected)}
                  <span className={`text-2xl font-black tracking-[0.2em] ${isSelected ? 'text-clinic-gold' : 'text-gray-600'}`}>
                    {cat.name}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-clinic-gold p-2 rounded-full shadow-md animate-fade-in">
                      <Check size={20} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-4">
            <button 
              disabled={selectedCategoryIds.length === 0 || loading} 
              onClick={handleNext} 
              className="btn-gold text-2xl px-20 py-6 disabled:opacity-30 shadow-clinic-gold/30 uppercase tracking-widest font-black"
            >
              {loading ? 'AI 分析中...' : '生成專屬推薦方案'} <ArrowRight size={32} className="ml-2" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 overflow-y-auto animate-fade-in scrollbar-hide">
          {recommendations.length > 0 ? recommendations.map((t, idx) => (
            <div key={t.id} style={{ animationDelay: `${idx * 0.1}s` }} className="glass-card overflow-hidden flex flex-col h-full group hover:shadow-2xl transition-all duration-500 animate-fade-in">
              <div className="h-64 relative overflow-hidden bg-gray-100">
                <img src={t.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t.title} />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-clinic-gold transition-colors">{t.title}</h4>
                <p className="text-gray-500 mb-6 flex-1 leading-relaxed text-base italic line-clamp-3">{t.description || '專業醫美團隊為您量身打造的極致美學方案。'}</p>
                <div className="flex items-end justify-between">
                   <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">預估費用</div>
                   <div className="text-3xl font-black text-clinic-gold tracking-tight"><span className="text-sm mr-1 opacity-60">NT$</span>{t.price?.toLocaleString() || '-'}</div>
                </div>
              </div>
            </div>
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
