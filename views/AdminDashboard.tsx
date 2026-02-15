
import React, { useState } from 'react';
import { seedInitialData } from '../lib/firebase';
import { Database, Plus, Users, Image as ImageIcon, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedStatus('處理中...');
    const result = await seedInitialData();
    if (result) {
      setSeedStatus('初始化成功！已填入範例資料與分類。');
    } else {
      setSeedStatus('資料庫已有資料，不需再次初始化。');
    }
    setSeeding(false);
  };

  const stats = [
    { label: '活動療程', value: '5', icon: Database, color: 'blue' },
    { label: '今日諮詢量', value: '12', icon: Users, color: 'purple' },
    { label: '術後案例', value: '28', icon: ImageIcon, color: 'pink' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">控制面板概覽</h2>
          <p className="text-gray-500 mt-1">歡迎回來，Radiant Clinic 管理員</p>
        </div>
        <button 
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
        >
          {seeding ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
          初始化範例資料 (Seed)
        </button>
      </div>

      {seedStatus && (
        <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 shadow-sm">
          <CheckCircle2 size={20} />
          {seedStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-gray-50`}>
              <stat.icon size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 text-gray-800">快速操作捷徑</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/admin/treatments')}
              className="group p-6 bg-white border border-gray-100 rounded-2xl text-left hover:border-[#E0B0FF] hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-[#F8E8FF] rounded-xl flex items-center justify-center mb-4 text-[#D4AF37] group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <h4 className="font-bold text-gray-800">新增療程項目</h4>
              <p className="text-gray-500 text-sm mt-1">管理與編輯現有的醫美方案</p>
            </button>
            
            <button 
              onClick={() => navigate('/admin/settings')}
              className="group p-6 bg-white border border-gray-100 rounded-2xl text-left hover:border-[#E0B0FF] hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-400 group-hover:scale-110 transition-transform">
                <ImageIcon size={24} />
              </div>
              <h4 className="font-bold text-gray-800">更換首頁 LOGO</h4>
              <p className="text-gray-500 text-sm mt-1">自定義諮詢系統品牌視覺</p>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800">系統狀態</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Firebase Auth</span>
              <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-50 rounded">運作中</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Firestore DB</span>
              <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-50 rounded">運作中</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Storage</span>
              <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-50 rounded">運作中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
