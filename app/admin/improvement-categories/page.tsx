'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit3, X, Loader2, Save, Tags, CheckSquare, Square, Calendar, Hash, Type } from 'lucide-react';

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('improvement_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) console.error("Fetch error:", error);
    setCategories(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    
    const payload = { 
      name: name.trim(), 
      icon_name: iconName.trim(),
      description: description.trim(),
      sort_order: Number(sortOrder), 
      is_active: isActive, 
      updated_at: new Date().toISOString() 
    };
    
    const { error } = editingId 
      ? await supabase.from('improvement_categories').update(payload).eq('id', editingId)
      : await supabase.from('improvement_categories').insert([payload]);

    if (error) {
      alert("儲存失敗: " + error.message);
    } else {
      setIsModalOpen(false);
      fetchCategories();
    }
    setSaving(false);
  };

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name || '');
      setIconName(cat.icon_name || 'Sparkles');
      setDescription(cat.description || '');
      setSortOrder(cat.sort_order || 0);
      setIsActive(cat.is_active ?? true);
    } else {
      setEditingId(null);
      setName('');
      setIconName('Sparkles');
      setDescription('');
      setSortOrder(categories.length + 1);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此分類？刪除後相關療程的關聯將變更為「未設定」，但不會刪除療程本身。')) return;
    
    const { error } = await supabase.from('improvement_categories').delete().eq('id', id);
    if (error) {
      alert("刪除失敗: " + error.message);
    } else {
      fetchCategories();
    }
  };

  // 日期格式化防呆
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">欲改善項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">管理 iPad 諮詢首頁顯示的肌膚問題分類與排序</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/20">
          <Plus size={24} /> 新增改善分類
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase">載入分類數據中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-8 w-24">排序</th>
                <th className="p-8">分類名稱</th>
                <th className="p-8">圖示代碼</th>
                <th className="p-8">最後更新</th>
                <th className="p-8">狀態</th>
                <th className="p-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400 font-bold">{c.sort_order}</td>
                  <td className="p-8 font-black text-lg text-gray-800">{c.name}</td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-clinic-gold font-bold">
                      <Hash size={16} /> {c.icon_name || 'Sparkles'}
                    </div>
                  </td>
                  <td className="p-8 text-sm text-gray-400 flex items-center gap-2">
                    <Calendar size={14} /> {formatDate(c.updated_at)}
                  </td>
                  <td className="p-8">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                      c.is_active 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      {c.is_active ? '顯示中' : '已隱藏'}
                    </span>
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(c)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-600">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-3 border rounded-xl hover:bg-red-50 text-red-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-gray-400 font-bold italic">目前尚無分類，請點擊右上方按鈕新增。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-fade-in my-auto overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-clinic-gold rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Tags size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                  {editingId ? '編輯改善項目' : '新增改善項目'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">分類名稱</label>
                   <div className="relative">
                     <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                     <input required value={name} onChange={e => setName(e.target.value)} className="input-field py-4 pl-14 font-bold" placeholder="例如：斑點、皺紋" />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">圖示代碼 (Lucide)</label>
                   <div className="relative">
                     <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={20} />
                     <input value={iconName} onChange={e => setIconName(e.target.value)} className="input-field py-4 pl-14 font-mono" placeholder="Sparkles" />
                   </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">分類描述 (選填)</label>
                 <textarea 
                   value={description} 
                   onChange={e => setDescription(e.target.value)} 
                   className="input-field h-24 py-4 resize-none" 
                   placeholder="針對此肌膚問題的簡短說明..."
                 />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">顯示排序 (sort_order)</label>
                    <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field py-4 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">狀態控制</label>
                    <button 
                      type="button" 
                      onClick={() => setIsActive(!isActive)} 
                      className={`flex items-center gap-3 p-4 rounded-2xl w-full border transition-all ${
                        isActive ? 'bg-clinic-gold/5 border-clinic-gold/20 text-clinic-gold' : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}
                    >
                      {isActive ? <CheckSquare className="shrink-0" /> : <Square className="shrink-0" />}
                      <span className="font-bold">{isActive ? '前台正常顯示' : '暫時隱藏分類'}</span>
                    </button>
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/30">
                 {saving ? (
                   <div className="flex items-center gap-3 justify-center">
                     <Loader2 className="animate-spin" />
                     <span>同步資料至雲端...</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3 justify-center">
                     <Save />
                     <span>儲存分類設定</span>
                   </div>
                 )}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}