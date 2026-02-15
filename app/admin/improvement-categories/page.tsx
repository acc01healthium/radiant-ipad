
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit3, X, Loader2, Save, Hash, CheckSquare, Square } from 'lucide-react';

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('improvement_categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() };
    
    const { error } = editingId 
      ? await supabase.from('improvement_categories').update(payload).eq('id', editingId)
      : await supabase.from('improvement_categories').insert([payload]);

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchCategories();
    }
    setSaving(false);
  };

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      setSortOrder(cat.sort_order);
      setIsActive(cat.is_active);
    } else {
      setEditingId(null);
      setName('');
      setSortOrder(categories.length + 1);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800">欲改善項目管理</h2>
          <p className="text-gray-500 mt-2">管理 iPad 首頁顯示的肌膚問題分類</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg"><Plus /> 新增分類</button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs uppercase tracking-widest">
              <tr><th className="p-8">排序</th><th className="p-8">分類名稱</th><th className="p-8">狀態</th><th className="p-8 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="p-8 font-mono text-gray-400">{c.sort_order}</td>
                  <td className="p-8 font-black text-lg text-gray-800">{c.name}</td>
                  <td className="p-8">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${c.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      {c.is_active ? '啟用中' : '已停用'}
                    </span>
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(c)} className="p-3 border rounded-xl hover:bg-gray-100"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('刪除分類不會刪除療程，但療程將失去關聯。確定？')) { await supabase.from('improvement_categories').delete().eq('id', c.id); fetchCategories(); }}} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-fade-in">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">{editingId ? '編輯分類' : '新增分類'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8">
               <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">分類名稱</label>
                 <input required value={name} onChange={e => setName(e.target.value)} className="input-field py-4 font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">顯示排序</label>
                    <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field py-4" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">啟用狀態</label>
                    <button type="button" onClick={() => setIsActive(!isActive)} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl w-full border">
                      {isActive ? <CheckSquare className="text-clinic-gold" /> : <Square className="text-gray-300" />}
                      <span className="font-bold">{isActive ? '顯示於前台' : '暫時隱藏'}</span>
                    </button>
                  </div>
               </div>
               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl">{saving ? '正在處理...' : '儲存變更'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
