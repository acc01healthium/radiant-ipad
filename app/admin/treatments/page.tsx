
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save, Hash, AlertCircle } from 'lucide-react';
import { Treatment } from '@/types';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string | number>(0);
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('');
  const [sortOrder, setSortOrder] = useState<string | number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setTreatments(data || []);
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBoxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      let finalImageUrl = preview || '';

      // 1. Cloudinary 上傳
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToCloudinary(imageFile);
        } catch (uploadErr: any) {
          throw new Error(`圖片服務上傳失敗: ${uploadErr.message}`);
        }
      }

      /**
       * 2. 核心修正：嚴格校對 payload 欄位
       * 確保為 image_url (全小寫且帶底線)
       * 避免 PGRST204 錯誤
       */
      const payload: any = {
        title: title.trim(),
        price: Number(price) || 0,
        description: description.trim(),
        icon_name: iconName.trim(),
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl, // 這裡必須與 Supabase 表欄位完全一致
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        payload.id = editingId;
      }

      console.log('準備傳送至 Supabase 的 Payload:', payload);

      // 3. 執行 Upsert
      const { data, error } = await supabase
        .from('treatments')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // 詳細打印錯誤，協助診斷是否為欄位遺失 (PGRST204) 或型別錯誤
        console.error('Supabase 儲存詳細錯誤 (請檢查欄位名):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`儲存失敗: ${error.message}`);
      }

      setIsModalOpen(false);
      await fetchTreatments();
      alert('療程設定已同步完成！');
    } catch (err: any) {
      console.error("Critical Operation Error:", err);
      alert(err.message || '發生未知錯誤');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return;
    const { error } = await supabase.from('treatments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchTreatments();
  };

  const openModal = (t?: Treatment) => {
    if (t) {
      setEditingId(t.id);
      setTitle(t.title || '');
      setPrice(t.price || 0);
      setDescription(t.description || '');
      setIconName(t.icon_name || '');
      setSortOrder(t.sort_order || 0);
      setPreview(t.image_url || null);
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setDescription('');
      setIconName('');
      setSortOrder(treatments.length + 1);
      setPreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">療程項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">使用 image_url 欄位與 Cloudinary CDN</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg">
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-8 text-xs font-black text-gray-400">排序</th>
                <th className="p-8 text-xs font-black text-gray-400">視覺</th>
                <th className="p-8 text-xs font-black text-gray-400">名稱</th>
                <th className="p-8 text-xs font-black text-gray-400">價格</th>
                <th className="p-8 text-xs font-black text-gray-400 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="group hover:bg-gray-50/50">
                  <td className="p-8 font-mono text-gray-400">{t.sort_order}</td>
                  <td className="p-8">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border">
                      <img src={t.image_url || 'https://picsum.photos/200'} className="w-full h-full object-cover" alt="" />
                    </div>
                  </td>
                  <td className="p-8 font-black text-lg text-gray-800">{t.title}</td>
                  <td className="p-8 font-black text-clinic-gold text-xl">NT$ {t.price?.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(t)} className="p-3 border rounded-xl hover:bg-gray-100"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
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
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">{editingId ? '編輯療程' : '新增療程'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">療程標題</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-4 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">價格</label>
                    <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="input-field py-4 font-bold" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">分類/標籤 (icon_name)</label>
                    <input value={iconName} onChange={e => setIconName(e.target.value)} className="input-field py-4" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">排序</label>
                    <input type="number" required value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field py-4" />
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">療程介紹</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-24 py-4" />
               </div>

               <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-3xl border">
                  <div 
                    onClick={handleBoxClick}
                    className="w-32 h-32 bg-white border-2 border-dashed rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-clinic-gold transition-all shadow-sm"
                  >
                     {preview ? <img src={preview} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={32} className="text-gray-200" />}
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                  <div>
                    <p className="font-bold text-gray-700">更新療程照片</p>
                    <p className="text-gray-400 text-xs">圖片將存入 Cloudinary 並鏈接至 image_url 欄位</p>
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl">
                 {saving ? '正在同步數據...' : '儲存變更'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
