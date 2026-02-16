
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('improvement_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNext = () => {
    if (selectedIds.length === 0) return;
    const params = new URLSearchParams();
    params.set('cats', selectedIds.join(','));
    router.push(`/consultation/recommendation?${params.toString()}`);
  };

  const renderIcon = (cat: any, isSelected: boolean) => {
    if (cat.icon_image_path) {
      const { data } = supabase.storage.from('icons').getPublicUrl(cat.icon_image_path);
      return (
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-4 border-2 border-amber-100 shadow-inner bg-amber-50/30">
          <img src={data.publicUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    const Icon = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
    return (
      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-white' : 'bg-amber-50/50'}`}>
        <Icon size={48} className={isSelected ? 'text-clinic-gold' : 'text-gray-300'} />
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;

  return (
    <div className="h-screen max-h-screen bg-clinic-cream flex flex-col p-6 md:p-10 relative overflow-hidden bg-pattern">
      <header className="flex items-center justify-between mb-4 z-10 shrink-0">
        <button onClick={() => router.push('/')} className="p-3 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold"><ChevronLeft size={28} /></button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-widest uppercase">您的肌膚困擾</h2>
          <div className="h-1 w-12 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full z-10 overflow-hidden">
        <p className="text-gray-500 mb-6 font-light">請選擇一個或多個您感興趣的改善項目</p>
        
        {/* iPad Optimized Grid: no scroll if 6-8 items */}
        <div className={`
          grid w-full gap-4 md:gap-6 flex-1 
          ${categories.length <= 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-4'}
          content-center overflow-y-auto scrollbar-hide
        `}>
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleSelect(cat.id)}
                className={`
                  relative glass-card flex flex-col items-center justify-center p-6 transition-all duration-300 transform active:scale-95
                  ${isSelected ? 'bg-amber-50/80 border-clinic-gold shadow-xl -translate-y-1' : 'hover:shadow-lg'}
                  h-full max-h-[180px] md:max-h-[240px]
                `}
              >
                {renderIcon(cat, isSelected)}
                <span className={`text-lg md:text-xl font-bold tracking-widest ${isSelected ? 'text-clinic-gold' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-clinic-gold p-1 rounded-full text-white shadow-md">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
        <button 
          disabled={selectedIds.length === 0}
          onClick={handleNext}
          className={`
            btn-gold px-12 py-5 text-xl tracking-widest gap-4 shadow-2xl transition-all
            ${selectedIds.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'scale-110'}
          `}
        >
          查看專家推薦方案 <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={null}>
      <ConsultationContent />
    </Suspense>
  );
}
