'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save, Hash, Tag, CheckSquare, Square } from 'lucide-react';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string | number>(0);
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string | number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 讀取療程時，同時抓取多對多關聯表
    const [tRes, cRes] = await Promise.all([
      supabase.from('treatments').select('*, treatment_improvement_categories(category_id, improvement_categories(name))').order('sort_order', { ascending: true }),
      supabase.from('improvement_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);
    setTreatments(tRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  };

  const toggleCategorySelection = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let finalImageUrl = preview || '';
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
      }

      const payload = {
        title: title.trim(),
        price: Number(price) || 0,
        description: description.trim(),
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      // 1. 儲存療程主表
      let treatmentId = editingId;
      if (editingId) {
        const { error } = await supabase.from('treatments').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('treatments').insert([payload]).select().single();
        if (error) throw error;
        treatmentId = data.id;
      }

      // 2. 同步多對多關聯表 (先刪再增)
      if (treatmentId) {
        // 刪除舊關聯
        await supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId);
        
        // 插入新關聯
        if (selectedCategoryIds.length > 0) {
          const relationPayload = selectedCategoryIds.map(catId => ({
            treatment_id: treatmentId,
            category_id: catId
          }));
          const { error: relError } = await supabase.from('treatment_improvement_categories').insert(relationPayload);
          if (relError) throw relError;
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (t?: any) => {
    if (t) {
      setEditingId(t.id);
      setTitle(t.title);
      setPrice(t.price);
      setDescription(t.description);
      // 從關聯表中取出 IDs
      const ids = t.treatment_improvement_categories?.map((rel: any) => rel.category_id) || [];
      setSelectedCategoryIds(ids);
      setSortOrder(t.sort_order);
      setPreview(t.image_url);
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setDescription('');
      setSelectedCategoryIds([]);
      setSortOrder(treatments.length + 1);
      setPreview(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">療程項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">支援「複選」改善項目，一個療程可對應多種肌膚問題</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30"><Plus size={24} /> 新增療程</button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs tracking-widest uppercase">
              <tr><th className="p-8 w-20">排序</th><th className="p-8 w-24">視覺</th><th className="p-8">療程名稱</th><th className="p-8">對應分類 (複選)</th><th className="p-8">價格</th><th className="p-8 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400 font-bold">{t.sort_order}</td>
                  <td className="p-8"><img src={t.image_url} className="w-16 h-16 rounded-xl object-cover border shadow-sm" alt="" /></td>
                  <td className="p-8 font-black text-gray-800 text-lg">{t.title}</td>
                  <td className="p-8">
                    <div className="flex flex-wrap gap-2">
                      {t.treatment_improvement_categories?.length > 0 ? t.treatment_improvement_categories.map((rel: any, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-clinic-rose/10 text-clinic-rose rounded-lg text-[10px] font-black uppercase tracking-wider border border-clinic-rose/20">
                          {rel.improvement_categories?.name}
                        </span>
                      )) : <span className="text-gray-300 text-xs italic">未設定分類</span>}
                    </div>
                  </td>
                  <td className="p-8 font-black text-clinic-gold text-lg">
                    NT$ {t.price !== null && t.price !== undefined ? t.price.toLocaleString() : '-'}
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(t)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('確定要刪除此療程？')) { await supabase.from('treatments').delete().eq('id', t.id); fetchData(); }}} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl animate-fade-in my-auto">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <h3 className="text-2xl font-black text-gray-800">{editingId ? '編輯療程內容' : '建立新療程'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase ml-1">療程名稱</label><input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-4 font-bold" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase ml-1">價格</label><input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="input-field py-4 font-bold" /></div>
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">欲改善分類 (可複選)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                    {categories.map(c => {
                      const isSelected = selectedCategoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategorySelection(c.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-bold ${
                            isSelected ? 'bg-white border-clinic-gold text-clinic-gold shadow-md' : 'bg-transparent border-transparent text-gray-400 opacity-60'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase ml-1">介紹說明</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 py-4 resize-none" /></div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">療程視覺</label>
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-gray-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-clinic-gold/30">
                      {preview ? <img src={preview} className="w-full h-full object-cover" /> : <div className="text-center"><ImageIcon size={48} className="mx-auto text-gray-200" /><span className="text-xs text-gray-300 font-bold">點擊上傳照片</span></div>}
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){setImageFile(f); setPreview(URL.createObjectURL(f));}}} />
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/30">
                 {saving ? <Loader2 className="animate-spin" /> : <Save />}
                 {saving ? '同步雲端資料中...' : '儲存療程變更'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
