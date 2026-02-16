
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CasesAdminPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      const { data } = await supabase
        .from('treatment_cases')
        .select('*, treatments(title)')
        .order('created_at', { ascending: false });
      setCases(data || []);
      setLoading(false);
    };
    fetchCases();
  }, []);

  if (loading) return <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div>;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">術前後見證總覽</h2>
          <p className="text-gray-500 mt-2 font-medium">目前的案例皆已掛載於特定療程之下</p>
        </div>
        <Link href="/admin/treatments" className="btn-gold px-8 py-4">
          前往療程管理新增案例 <ArrowRight size={20} />
        </Link>
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
        <Info className="text-amber-500 shrink-0" size={24} />
        <p className="text-sm text-amber-700 font-bold leading-relaxed">
          提醒：系統已升級。現在案例直接隸屬於「療程」項目。
          請在「療程項目管理」中點擊編輯，即可在該療程視窗內管理專屬的術前後見證。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cases.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col group">
            <div className="grid grid-cols-2 gap-2 mb-4 aspect-[4/3]">
              <div className="rounded-xl overflow-hidden bg-gray-50">
                <img src={c.before_image_url} className="w-full h-full object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden bg-gray-50">
                <img src={c.after_image_url} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-clinic-gold tracking-widest">{c.treatments?.title}</span>
              <h4 className="text-lg font-bold text-gray-800 mt-1">{c.title}</h4>
              <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic">{c.description}</p>
            </div>
            <Link href="/admin/treatments" className="mt-6 text-center text-xs font-black uppercase tracking-widest text-gray-300 group-hover:text-clinic-gold transition-colors">
              編輯所屬療程
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
