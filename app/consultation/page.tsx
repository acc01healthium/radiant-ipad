
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function ConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 動態資料
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
      setCategories(catsRes.data || []);

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
      // 關鍵更新：使用多對多表進行查詢
      // 使用 !inner 強制進行內連接篩選
      const { data, error } = await supabase
        .from('treatments')
        .select('*, treatment_improvement_categories!inner(category_id)')
        .in('treatment_improvement_categories.category_id', selectedCategoryIds)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;

      // 由於一個療程可能對應多個選中的分類，進行客戶端去重
      const uniqueTreatments = Array.from(new Map(data.map(item => [item.id, item])).values());
      
      setRecommendations(uniqueTreatments);
      setStep(2);
    } catch (err: any) {
      console.error("Query Error:", err);
      setError('推薦方案生成失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 1 && categories.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-clinic-cream">
        <Loader2 className="animate-spin text-clinic-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinic-cream flex flex-col p-8 md:p-12 relative overflow-hidden bg-pattern">
      <header className="flex items-center justify-between mb-16 z-10">
        <button 
          onClick={() => step === 1 ? router.push('/') : setStep(1)}
          className="p-4 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold active:scale-95 transition-all"
        >
          <ChevronLeft size={32} />
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-light text-clinic-dark tracking-widest uppercase">
            {step === 1 ? (systemTexts['consult_step1_title'] || '您的肌膚困擾') : (systemTexts['consult_step2_title'] || '專業推薦方案')}
          </h2>
          <div className="flex justify-center mt-2 gap-1">
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-clinic-gold w-20' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-clinic-gold w-20' : 'bg-gray-200'}`}></div>
          </div>
        </div>
        <div className="w-16"></div>
      </header>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-6 bg-red-50 text-red-700 rounded-[2rem] border border-red-100 flex items-center gap-3 animate-fade-in shadow-sm">
          <AlertCircle /> 
          <span className="font-bold">{error}</span>
        </div>
      )}

      {step === 1 ? (
        <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full z-10">
          <div className="mb-16 text-center animate-fade-in">
            <h3 className="text-4xl font-light text-gray-700 mb-6">{systemTexts['consult_instruction'] || '請選擇 1~3 項您想改善的問題'}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 w-full">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 transform active:scale-90 relative animate-fade-in shadow-sm
                    ${isSelected 
                      ? 'bg-clinic-rose text-white shadow-2xl scale-110 border-8 border-white' 
                      : 'bg-white text-gray-600 hover:shadow-xl hover:translate-y-[-5px] border border-gray-100'
                    }
                  `}
                >
                  <Sparkles size={isSelected ? 48 : 36} className={isSelected ? 'text-white' : 'text-clinic-gold'} />
                  <span className="text-2xl font-black tracking-widest">{cat.name}</span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-clinic-gold p-3 rounded-full shadow-lg border-2 border-white animate-fade-in">
                      <Check size={24} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            disabled={selectedCategoryIds.length === 0 || loading}
            onClick={handleNext}
            className="btn-gold text-2xl px-20 py-8 mt-24 disabled:opacity-30 disabled:grayscale transition-all shadow-clinic-gold/30 uppercase tracking-widest font-black"
          >
            {loading ? 'AI 分析中...' : '生成專屬推薦方案'} <ArrowRight size={32} className="ml-2" />
          </button>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20 animate-fade-in">
          {recommendations.length > 0 ? recommendations.map((t, idx) => (
            <div key={t.id} style={{ animationDelay: `${idx * 0.15}s` }} className="glass-card overflow-hidden flex flex-col h-full group hover:shadow-2xl transition-all duration-500 animate-fade-in">
              <div className="h-72 relative overflow-hidden bg-gray-100">
                <img src={t.image_url || `https://picsum.photos/seed/${t.id}/800/600`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t.title} />
                <div className="absolute top-4 left-4 flex gap-1">
                   {/* 這裡也可以顯示該療程對應的所有分類標籤 */}
                   <span className="bg-clinic-gold/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">推薦方案</span>
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <h4 className="text-3xl font-black text-gray-800 mb-4 group-hover:text-clinic-gold transition-colors">{t.title}</h4>
                <p className="text-gray-500 mb-10 flex-1 leading-relaxed text-lg italic">{t.description || '專業醫美團隊為您量身打造的極致美學方案。'}</p>
                <div className="flex items-end justify-between">
                   <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">預估費用</div>
                   <div className="text-4xl font-black text-clinic-gold tracking-tight">
                     <span className="text-lg mr-1 opacity-60">NT$</span>
                     {t.price?.toLocaleString() || '-'}
                   </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-48 text-center glass-card border-dashed border-4 flex flex-col items-center justify-center">
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
