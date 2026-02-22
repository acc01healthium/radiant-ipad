'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function ConsultationContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('improvement_categories')
        .select('id, name, icon_name, sort_order, icon_image_path')
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
        <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4 transition-colors shrink-0 overflow-hidden ${isSelected ? 'bg-white ring-4 ring-clinic-gold/20' : 'bg-amber-50/50'}`}>
          <img src={data.publicUrl} alt={cat.name} className="w-full h-full object-cover" />
        </div>
      );
    }

    const Icon = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
    return (
      <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4 transition-colors shrink-0 ${isSelected ? 'bg-white ring-4 ring-clinic-gold/20' : 'bg-amber-50/50'}`}>
        <Icon size={48} className={isSelected ? 'text-clinic-gold' : 'text-gray-300'} />
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;

  return (
    <div className="min-h-[100dvh] bg-clinic-cream flex flex-col p-6 md:p-10 relative overflow-x-hidden bg-pattern">
      <header className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button onClick={() => router.push('/')} className="p-3 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all"><ChevronLeft size={28} /></button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-widest uppercase text-center">您的肌膚困擾</h2>
          <div className="h-1 w-12 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start max-w-7xl mx-auto w-full z-10">
        <p className="text-gray-500 mb-8 font-light tracking-wide text-center">請選擇一個或多個您感興趣的改善項目</p>
        
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full gap-3 sm:gap-4 md:gap-6 pb-32">
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleSelect(cat.id)}
                className={`
                  relative glass-card flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transition-all duration-300 transform active:scale-95
                  ${isSelected ? 'bg-amber-50/80 border-clinic-gold shadow-xl -translate-y-1' : 'hover:shadow-lg'}
                  aspect-[4/3] min-h-[140px] sm:min-h-[160px] md:min-h-[180px]
                `}
              >
                {renderIcon(cat, isSelected)}
                <span className={`text-base sm:text-lg md:text-xl font-bold tracking-widest ${isSelected ? 'text-clinic-gold' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-clinic-gold p-1.5 rounded-full text-white shadow-md z-10">
                    <Check size={18} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20 px-6">
        <button 
          disabled={selectedIds.length === 0}
          onClick={handleNext}
          className={`
            btn-gold w-full max-w-lg py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-xl tracking-widest gap-1 sm:gap-2 md:gap-4 shadow-2xl transition-all whitespace-nowrap
            ${selectedIds.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'scale-100 hover:scale-[1.02]'}
          `}
        >
          查看專家推薦方案 <ArrowRight size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
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
