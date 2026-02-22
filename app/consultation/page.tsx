'use client';

// tailwind classes: xs:w-7 xs:h-7 xs:w-14 xs:h-14 xs:min-h-[120px] xs:grid-cols-2
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
        <div className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4 transition-colors shrink-0 overflow-hidden ${isSelected ? 'bg-white ring-4 ring-clinic-gold/20' : 'bg-amber-50/50'}`}>
          <img src={data.publicUrl} alt={cat.name} className="w-full h-full object-cover" />
        </div>
      );
    }

    const Icon = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
    return (
      <div className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4 transition-colors shrink-0 ${isSelected ? 'bg-white ring-4 ring-clinic-gold/20' : 'bg-amber-50/50'}`}>
        <Icon 
          size={24} 
          className={`
            ${isSelected ? 'text-clinic-gold' : 'text-gray-300'}
            xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12
          `} 
        />
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;

  return (
    <div className="min-h-[100dvh] bg-clinic-cream flex flex-col p-4 md:p-10 relative overflow-x-hidden bg-pattern">
      <header className="flex items-center justify-between mb-6 md:mb-8 z-10 shrink-0">
        <button onClick={() => router.push('/')} className="p-2 md:p-3 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all"><ChevronLeft size={24} className="md:w-7 md:h-7" /></button>
        <div className="text-center">
          <h2 className="text-xl md:text-3xl font-light text-clinic-dark tracking-widest uppercase text-center">您的肌膚困擾</h2>
          <div className="h-1 w-10 md:w-12 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-10 md:w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start max-w-7xl mx-auto w-full z-10">
        <p className="text-gray-500 mb-6 md:mb-8 font-light tracking-wide text-center text-sm md:text-base px-2">請選擇一個或多個您感興趣的改善項目</p>
        
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full gap-2 sm:gap-3 md:gap-4 lg:gap-6 pb-32 px-2">
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleSelect(cat.id)}
                className={`
                  relative glass-card flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 lg:p-5 transition-all duration-300 transform active:scale-95
                  ${isSelected ? 'bg-amber-50/80 border-clinic-gold shadow-xl -translate-y-1' : 'hover:shadow-lg'}
                  aspect-[4/3] min-h-[90px] xs:min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px]
                `}
              >
                {renderIcon(cat, isSelected)}
                <span className={`text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-widest ${isSelected ? 'text-clinic-gold' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-clinic-gold p-1 md:p-1.5 rounded-full text-white shadow-md z-10">
                    <Check size={14} className="md:w-4 md:h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-6 md:bottom-10 left-0 right-0 flex justify-center z-20 px-4">
        <button 
          disabled={selectedIds.length === 0}
          onClick={handleNext}
          className={`
            btn-gold w-full max-w-md py-3 md:py-4 text-sm md:text-base lg:text-lg tracking-widest gap-2 shadow-2xl transition-all whitespace-nowrap
            ${selectedIds.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'scale-100 hover:scale-[1.02]'}
          `}
        >
          查看專家推薦方案 <ArrowRight size={18} className="md:w-5 md:h-5" />
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
