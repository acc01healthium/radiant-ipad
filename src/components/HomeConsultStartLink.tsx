// src/components/HomeConsultStartLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  label: string;
};

export default function HomeConsultStartLink({ label }: Props) {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    try {
      // ✅ 記錄事件（今天點擊數就靠它）
      await supabase.from('analytics_events').insert([
        {
          event_name: 'home_consult_start_click',
          metadata: { page: 'home', to: '/consultation' }
        }
      ]);
    } catch (err) {
      // 追蹤失敗不應阻擋導頁
      console.error('track click error:', err);
    } finally {
      router.push('/consultation');
    }
  };

  return (
    <Link
      href="/consultation"
      onClick={handleClick}
      className="btn-gold text-base sm:text-lg md:text-2xl px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 w-full max-w-md shadow-clinic-gold/20 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 group whitespace-nowrap"
    >
      {label}
      <ChevronRight
        size={20}
        className="sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform"
      />
    </Link>
  );
}
