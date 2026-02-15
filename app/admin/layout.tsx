
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Package, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Skip layout for login page
  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  const navItemClass = (path: string) => `
    flex items-center gap-3 p-3 rounded-lg transition-colors
    ${isActive(path) ? 'bg-[#F8E8FF] gold-text font-bold shadow-sm' : 'hover:bg-gray-50 text-gray-600'}
  `;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="w-64 bg-white border-r shadow-sm flex flex-col fixed h-full">
          <div className="p-6 border-b flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#E0B0FF] flex items-center justify-center text-white font-bold">R</div>
            <h1 className="text-xl font-bold gold-text">亮立美學後台</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/admin" className={navItemClass('/admin')}>
              <LayoutDashboard size={20} /> 控制面板
            </Link>
            <Link href="/admin/treatments" className={navItemClass('/admin/treatments')}>
              <Package size={20} /> 療程管理
            </Link>
            <Link href="/admin/settings" className={navItemClass('/admin/settings')}>
              <Settings size={20} /> 系統設定
            </Link>
          </nav>
          <div className="p-4 border-t">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 w-full text-left rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} /> 登出系統
            </button>
          </div>
        </aside>
        <main className="flex-1 p-8 ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
