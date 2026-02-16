
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Package, LayoutDashboard, LogOut, Settings, Image as ImageIcon, Tags } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clinicName, setClinicName] = useState('亮立美學');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinicInfo = async () => {
      const { data } = await supabase
        .from('settings')
        .select('clinic_name, logo_url')
        .eq('id', 'clinic_main')
        .single();
      if (data) {
        setClinicName(data.clinic_name || '亮立美學');
        setLogoUrl(data.logo_url);
      }
    };
    if (pathname !== '/admin/login') { fetchClinicInfo(); }
  }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 p-3 rounded-xl transition-all duration-200
    ${pathname === path ? 'bg-[#F8E8FF] gold-text font-bold shadow-sm' : 'hover:bg-gray-50 text-gray-600'}
  `;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <aside className="w-72 bg-white border-r shadow-sm flex flex-col fixed h-full z-[40]">
          <div className="p-8 border-b flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md bg-gray-50 border border-gray-100 flex items-center justify-center">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="rose-gold-gradient w-full h-full flex items-center justify-center text-white font-bold">R</div>}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none truncate max-w-[150px]">{clinicName}</h1>
              <span className="text-[10px] uppercase tracking-widest text-gray-400">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 p-5 space-y-2">
            <Link href="/admin" className={navItemClass('/admin')}><LayoutDashboard size={20} /> 控制面板</Link>
            <Link href="/admin/improvement-categories" className={navItemClass('/admin/improvement-categories')}><Tags size={20} /> 欲改善項目</Link>
            <Link href="/admin/treatments" className={navItemClass('/admin/treatments')}><Package size={20} /> 療程項目</Link>
            <Link href="/admin/cases" className={navItemClass('/admin/cases')}><ImageIcon size={20} /> 術前後案例</Link>
            <Link href="/admin/settings" className={navItemClass('/admin/settings')}><Settings size={20} /> 系統設定</Link>
          </nav>
          <div className="p-6 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-left rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"><LogOut size={20} /> 登出系統</button>
          </div>
        </aside>

        {/* 修復點：確保 main 容器不帶 transform 或 overflow-hidden，以免影響 Modal 的 fixed 定位 */}
        <main className="flex-1 p-10 ml-72 min-h-screen relative z-[10]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
