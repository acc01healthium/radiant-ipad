// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database, Plus, Users, ImageIcon, Settings, TrendingUp } from 'lucide-react';

function getTaipeiTodayRangeISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';

  const start = `${y}-${m}-${d}T00:00:00+08:00`;

  const startDate = new Date(`${y}-${m}-${d}T00:00:00+08:00`);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const endY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(endDate);
  const endM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', month: '2-digit' }).format(endDate);
  const endD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', day: '2-digit' }).format(endDate);
  const end = `${endY}-${endM}-${endD}T00:00:00+08:00`;

  return { start, end };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ treatments: 0, cases: 0, todayConsults: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { start, end } = getTaipeiTodayRangeISO();

        const [treatmentsRes, casesRes, todayConsultRes] = await Promise.all([
          supabase.from('treatments').select('id', { count: 'exact', head: true }),
          supabase.from('cases').select('id', { count: 'exact', head: true }),
          supabase
            .from('analytics_events')
            .select('id', { count: 'exact', head: true })
            .eq('event_name', 'home_consult_start_click')
            .gte('created_at', start)
            .lt('created_at', end)
        ]);

        if (treatmentsRes.error) console.error('treatments stats error:', treatmentsRes.error);
        if (casesRes.error) console.error('cases stats error:', casesRes.error);
        if (todayConsultRes.error) console.error('today consult stats error:', todayConsultRes.error);

        setCounts({
          treatments: treatmentsRes.count || 0,
          cases: casesRes.count || 0,
          todayConsults: todayConsultRes.count || 0
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { label: '活動療程', value: counts.treatments.toString(), icon: Database, color: 'text-clinic-gold' },
    { label: '今日諮詢', value: counts.todayConsults.toString(), icon: Users, color: 'text-blue-500' },
    { label: '術後見證案例', value: counts.cases.toString(), icon: ImageIcon, color: 'text-clinic-rose' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">後台控制面板</h2>
          <p className="text-gray-500 mt-2 font-medium">歡迎回來，Radiant Clinic 數位資產管理系統</p>
        </div>
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Supabase Cloud Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="p-5 rounded-2xl bg-gray-50 group-hover:scale-110 transition-transform">
              <stat.icon size={32} className={stat.color} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-gray-800">{loading ? '...' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black mb-8 text-gray-800 flex items-center gap-3">
              <TrendingUp className="text-clinic-gold" /> 快速操作捷徑
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => router.push('/admin/treatments')}
                className="group p-8 bg-gray-50 border border-transparent rounded-[2rem] text-left hover:bg-white hover:border-clinic-rose hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 text-clinic-gold shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={32} />
                </div>
                <h4 className="font-black text-xl text-gray-800">管理療程項目</h4>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">新增、編輯或刪除現有的醫美服務方案，同步更新至 iPad 諮詢介面。</p>
              </button>

              <button
                onClick={() => router.push('/admin/settings')}
                className="group p-8 bg-gray-50 border border-transparent rounded-[2rem] text-left hover:bg-white hover:border-clinic-gold hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 text-gray-400 shadow-sm group-hover:scale-110 transition-transform">
                  <Settings size={32} />
                </div>
                <h4 className="font-black text-xl text-gray-800">品牌視覺設定</h4>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">更換診所 LOGO 與名稱，讓 iPad 系統更貼合品牌形象。</p>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-2xl font-black mb-6 text-gray-800">雲端服務狀態</h3>
          <div className="space-y-4 flex-1">
            <StatusRow label="Supabase Auth" status="Active" color="green" />
            <StatusRow label="PostgreSQL DB" status="Healthy" color="green" />
            <StatusRow label="Cloudinary Storage" status="Integrated" color="blue" />
            <StatusRow label="Next.js App Router" status="Deployed" color="purple" />
          </div>
          <div className="mt-8 p-6 bg-clinic-cream rounded-3xl border border-clinic-gold/10">
            <p className="text-xs text-clinic-gold font-bold uppercase tracking-widest text-center">System v1.2 - Supabase Edition</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status, color }: { label: string; status: string; color: 'green' | 'blue' | 'purple' }) {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${colors[color]}`}>{status}</span>
    </div>
  );
}
