
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const { data, error } = await supabase
      .from('improvement_categories')
      .select('id, name, icon_name, icon_image_url, icon_image_path, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('fetchCategories error:', error.message);
      setCategories([]);
      setLoading(false);
      return;
    }

    // ✅ 加在這裡（setCategories 前）
    console.log("improvement_categories first row:", data?.[0]);
    console.log(
      "icon_image_url:",
      (data?.[0] as any)?.icon_image_url,
      "icon_image_path:",
      (data?.[0] as any)?.icon_image_path
    );

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
   const Icon = (LucideIcons as any)[cat.icon_name] || LucideIcons.Sparkles;
return (
  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors shrink-0 ${isSelected ? 'bg-white' : 'bg-amber-50/50'}`}>
    {cat.icon_image_url ? (
      <img
        src={cat.icon_image_url}
        alt={cat.name}
        className="w-full h-full object-cover rounded-full"
      />
    ) : (
      <Icon size={48} className={isSelected ? 'text-clinic-gold' : 'text-gray-300'} />
    )}
  </div>
);

  if (loading) return <div className="h-screen flex items-center justify-center bg-clinic-cream"><Loader2 className="animate-spin text-clinic-gold" size={48} /></div>;

  return (
    <div className="min-h-[100dvh] bg-clinic-cream flex flex-col p-6 md:p-10 relative overflow-x-hidden bg-pattern">
      <header className="flex items-center justify-between mb-8 z-10 shrink-0">
        <button onClick={() => router.push('/')} className="p-3 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all"><ChevronLeft size={28} /></button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-light text-clinic-dark tracking-widest uppercase">您的肌膚困擾</h2>
          <div className="h-1 w-12 bg-clinic-gold mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start max-w-7xl mx-auto w-full z-10">
        <p className="text-gray-500 mb-8 font-light tracking-wide text-center">請選擇一個或多個您感興趣的改善項目</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full gap-4 md:gap-6 pb-32">
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleSelect(cat.id)}
                className={`
                  relative glass-card flex flex-col items-center justify-center p-8 transition-all duration-300 transform active:scale-95
                  ${isSelected ? 'bg-amber-50/80 border-clinic-gold shadow-xl -translate-y-1' : 'hover:shadow-lg'}
                  aspect-[4/3] min-h-[180px]
                `}
              >
                {renderIcon(cat, isSelected)}
                <span className={`text-lg md:text-xl font-bold tracking-widest ${isSelected ? 'text-clinic-gold' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-clinic-gold p-1.5 rounded-full text-white shadow-md">
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
            btn-gold w-full max-w-lg py-6 text-xl tracking-widest gap-4 shadow-2xl transition-all
            ${selectedIds.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'scale-100 hover:scale-[1.02]'}
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
