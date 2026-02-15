
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
      // 根據選中的 category IDs 篩選療程
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .in('improvement_category_id', selectedCategoryIds);
      
      if (error) throw error;
      setRecommendations(data || []);
      setStep(2);
    } catch (err: any) {
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
          className="p-4 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold active:scale-95"
        >
          <ChevronLeft size={32} />
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-light text-clinic-dark tracking-widest">
            {step === 1 ? (systemTexts['consult_step1_title'] || '您的肌膚困擾') : (systemTexts['consult_step2_title'] || '專業推薦方案')}
          </h2>
          <div className="flex justify-center mt-2 gap-1">
            <div className={`h-1.5 w-12 rounded-full transition-all ${step === 1 ? 'bg-clinic-gold' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all ${step === 2 ? 'bg-clinic-gold' : 'bg-gray-200'}`}></div>
          </div>
        </div>
        <div className="w-16"></div>
      </header>

      {error && <div className="max-w-md mx-auto mb-8 p-5 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-center gap-2"><AlertCircle /> {error}</div>}

      {step === 1 ? (
        <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full z-10">
          <div className="mb-16 text-center">
            <h3 className="text-4xl font-light text-gray-700 mb-6">{systemTexts['consult_instruction']}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 transform active:scale-90 relative
                    ${isSelected ? 'bg-clinic-rose text-white shadow-xl scale-110 border-4 border-white' : 'bg-white text-gray-600 hover:shadow-lg border border-gray-100'}
                  `}
                >
                  <Sparkles size={isSelected ? 40 : 32} className={isSelected ? 'text-white' : 'text-clinic-gold'} />
                  <span className="text-2xl font-medium">{cat.name}</span>
                  {isSelected && <div className="absolute -top-2 -right-2 bg-clinic-gold p-2 rounded-full shadow-lg"><Check size={20} className="text-white" /></div>}
                </button>
              );
            })}
          </div>

          <button
            disabled={selectedCategoryIds.length === 0 || loading}
            onClick={handleNext}
            className="btn-gold text-2xl px-20 py-6 mt-20 disabled:opacity-30"
          >
            {loading ? '分析中...' : '生成推薦方案'} <ArrowRight size={28} />
          </button>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {recommendations.length > 0 ? recommendations.map(t => (
            <div key={t.id} className="glass-card overflow-hidden flex flex-col h-full group">
              <div className="h-64 relative overflow-hidden bg-gray-100">
                <img src={t.image_url || `https://picsum.photos/seed/${t.id}/800/600`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={t.title} />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="text-3xl font-bold text-gray-800 mb-4">{t.title}</h4>
                <p className="text-gray-500 mb-8 flex-1">{t.description}</p>
                <div className="text-3xl font-bold text-clinic-gold">NT$ {t.price.toLocaleString()}</div>
              </div>
            </div>
          )) : <div className="col-span-full py-32 text-center text-gray-400">目前查無符合療程。</div>}
        </div>
      )}
    </div>
  );
}
