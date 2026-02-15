
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save, Hash, Tag } from 'lucide-react';
import { Treatment } from '@/types';

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
  const [categoryId, setCategoryId] = useState('');
  const [sortOrder, setSortOrder] = useState<string | number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from('treatments').select('*, improvement_categories(name)').order('sort_order', { ascending: true }),
      supabase.from('improvement_categories').select('*').order('sort_order', { ascending: true })
    ]);
    setTreatments(tRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
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
        improvement_category_id: categoryId || null,
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = editingId 
        ? await supabase.from('treatments').update(payload).eq('id', editingId)
        : await supabase.from('treatments').insert([payload]);

      if (error) throw error;
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
      setCategoryId(t.improvement_category_id || '');
      setSortOrder(t.sort_order);
      setPreview(t.image_url);
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setDescription('');
      setCategoryId('');
      setSortOrder(treatments.length + 1);
      setPreview(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800">療程項目管理</h2>
          <p className="text-gray-500 mt-2">關聯「欲改善項目」以進行動態分類篩選</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg"><Plus /> 新增療程</button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs tracking-widest uppercase">
              <tr><th className="p-8">排序</th><th className="p-8">視覺</th><th className="p-8">名稱</th><th className="p-8">分類關聯</th><th className="p-8">價格</th><th className="p-8 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="p-8 font-mono text-gray-400">{t.sort_order}</td>
                  <td className="p-8"><img src={t.image_url} className="w-16 h-16 rounded-xl object-cover border" alt="" /></td>
                  <td className="p-8 font-black text-gray-800">{t.title}</td>
                  <td className="p-8">
                    <span className="px-3 py-1 bg-clinic-rose/10 text-clinic-rose rounded-lg text-xs font-bold">
                      {t.improvement_categories?.name || '未關聯'}
                    </span>
                  </td>
                  <td className="p-8 font-black text-clinic-gold">NT$ {t.price.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(t)} className="p-3 border rounded-xl hover:bg-gray-100"><Edit3 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">{editingId ? '編輯療程' : '新增療程'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400">療程名稱</label><input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-4 font-bold" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400">價格</label><input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="input-field py-4 font-bold" /></div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">欲改善分類</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-field py-4 font-bold appearance-none bg-white">
                      <option value="">請選擇分類...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">顯示排序</label><input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field py-4" /></div>
               </div>
               <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">介紹說明</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-24 py-4" /></div>
               
               <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-3xl border">
                  <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 bg-white border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                    {preview ? <img src={preview} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-200" />}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){setImageFile(f); setPreview(URL.createObjectURL(f));}}} />
                  <div><p className="font-bold">療程照片</p><p className="text-xs text-gray-400">建議 800x600px</p></div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl">{saving ? '處理中...' : '儲存變更'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
