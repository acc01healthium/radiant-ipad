
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
  
  // File Input Ref
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
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      let finalImageUrl = preview || '';

      // 1. 處理 Cloudinary 圖片上傳
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToCloudinary(imageFile);
        } catch (uploadErr: any) {
          throw new Error(`Cloudinary 上傳失敗: ${uploadErr.message}`);
        }
      }

      // 2. 構建 Payload，嚴格對齊 Supabase 欄位名稱
      // 確保 price 與 sort_order 必為數字格式
      const payload: any = {
        title: title.trim(),
        price: Number(price) || 0,
        description: description.trim(),
        icon_name: iconName.trim(),
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      // 如果是編輯模式，加入 ID 以觸發 update
      if (editingId) {
        payload.id = editingId;
      }

      // 3. 使用 upsert 進行儲存 (如果 payload 包含 id 則更新，否則新增)
      const { data, error } = await supabase
        .from('treatments')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // 打印詳細錯誤至控制台供截圖偵錯
        console.error('Supabase 儲存詳細錯誤:', error);
        throw new Error(`Supabase 儲存失敗: ${error.message} (代碼: ${error.code})`);
      }

      console.log('儲存成功:', data);
      setIsModalOpen(false);
      await fetchTreatments();
      alert('療程資料已成功同步至 Supabase 雲端！');
    } catch (err: any) {
      console.error("Operation Error:", err);
      alert(err.message || '發生未知錯誤，請檢查瀏覽器控制台日誌。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此療程？')) return;
    try {
      const { error } = await supabase.from('treatments').delete().eq('id', id);
      if (error) throw error;
      fetchTreatments();
    } catch (e: any) {
      alert('刪除失敗: ' + e.message);
    }
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
          <p className="text-gray-500 mt-2 font-medium">基於 Supabase 雲端資料庫與 Cloudinary CDN</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30">
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase">資料同步中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">排序</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">視覺</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">療程名稱</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">價格</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400">{t.sort_order}</td>
                  <td className="p-8">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                      <img src={t.image_url || 'https://picsum.photos/200'} className="w-full h-full object-cover" alt={t.title} />
                    </div>
                  </td>
                  <td className="p-8">
                     <div className="flex flex-col">
                        <span className="font-black text-lg text-gray-800">{t.title}</span>
                        <span className="text-[10px] text-clinic-gold font-bold flex items-center gap-1 uppercase tracking-widest">
                          <Sparkles size={10} /> {t.icon_name || '未設分類'}
                        </span>
                     </div>
                  </td>
                  <td className="p-8 font-black text-clinic-gold text-xl">NT$ {t.price?.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(t)} className="p-3 bg-white shadow-sm border rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-3 bg-white shadow-sm border rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {treatments.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-light italic">目前資料庫尚無療程資料。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程資訊' : '建立全新方案'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">療程標題 (title)</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-4 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">定價 (price)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={20} />
                      <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="input-field py-4 pl-12 text-lg font-bold" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">分類標籤 (icon_name)</label>
                    <input value={iconName} onChange={e => setIconName(e.target.value)} className="input-field py-4" placeholder="例：斑點 / 拉提" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">顯示權重 (sort_order)</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      <input type="number" required value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field py-4 pl-12" />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">詳細介紹 (description)</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 py-4 resize-none" placeholder="輸入療程原理..." />
               </div>

               <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div 
                    onClick={handleBoxClick}
                    className="w-32 h-32 bg-white border-2 border-dashed rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-clinic-gold/30 transition-all shadow-sm"
                  >
                     {preview ? <img src={preview} className="w-full h-full object-cover" alt="Preview" /> : <ImageIcon size={32} className="text-gray-200" />}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase transition-opacity">
                       上傳主圖
                     </div>
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-gray-700 font-bold">療程主視覺 (image_url)</p>
                    <p className="text-gray-400 text-xs leading-relaxed">建議尺寸: 800x600px，支援 JPG/PNG/WEBP。</p>
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl font-black disabled:opacity-50">
                 {saving ? (
                   <div className="flex items-center gap-3"><Loader2 className="animate-spin" size={24} /><span>同步 Supabase 中...</span></div>
                 ) : (
                   <div className="flex items-center gap-3"><Save size={24} /><span>儲存變更</span></div>
                 )}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
