
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
  
  // File Input Ref - 用於強制觸發檔案選擇
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
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
      // 防止畫面崩潰，但給予使用者提示
    } finally {
      setLoading(false);
    }
  };

  // 點擊容器時觸發隱藏的 input
  const handleBoxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // 預覽圖片
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

      // 如果有新選擇的檔案，上傳至 Cloudinary
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
      }

      const payload = {
        title,
        price: Number(price),
        description,
        icon_name: iconName,
        sort_order: Number(sortOrder),
        image_url: finalImageUrl, // 嚴格對應 SQL 欄位
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('treatments')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('treatments')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchTreatments();
      alert('療程資料已同步至 Supabase 雲端');
    } catch (err: any) {
      console.error("Operation Error:", err);
      alert(`儲存失敗: ${err.message || '請確認網路連線與資料表欄位'}`);
    } finally {
      setSaving(false); // 確保轉圈必停止
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
          <p className="text-gray-500 mt-2 font-medium">管理 Supabase 資料庫中的醫美方案</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30">
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase">Supabase 同步中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">排序</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">主視覺</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">療程名稱 (title)</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">價格</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400">{t.sort_order}</td>
                  <td className="p-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                      <img src={t.image_url || 'https://picsum.photos/200'} className="w-full h-full object-cover" alt={t.title} />
                    </div>
                  </td>
                  <td className="p-8">
                     <div className="flex flex-col">
                        <span className="font-black text-xl text-gray-800">{t.title}</span>
                        <span className="text-xs text-clinic-gold font-bold flex items-center gap-1 uppercase tracking-tighter">
                          <Sparkles size={12} /> {t.icon_name || '未設分類'}
                        </span>
                     </div>
                  </td>
                  <td className="p-8 font-black text-clinic-gold text-2xl">NT$ {t.price?.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(t)} className="p-4 bg-white shadow-md rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={20} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-4 bg-white shadow-md rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
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
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-3xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程資訊' : '建立全新方案'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程標題 (title)</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-5 text-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">定價 (price)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={24} />
                      <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field py-5 pl-14 text-xl font-bold" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">分類標籤 (icon_name)</label>
                    <input value={iconName} onChange={e => setIconName(e.target.value)} className="input-field py-5 text-xl" placeholder="例：斑點 / 拉提" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">顯示權重 (sort_order)</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                      <input type="number" required value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field py-5 pl-14 text-xl" />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">詳細介紹 (description)</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 py-6 resize-none" placeholder="輸入療程原理與建議對象..." />
               </div>

               <div className="flex items-center gap-10">
                  {/* 使用隱藏 input 並透過 ref 觸發，解決點擊不靈敏問題 */}
                  <div 
                    onClick={handleBoxClick}
                    className="w-40 h-40 bg-gray-50 border-4 border-dashed rounded-3xl flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-clinic-gold/30 transition-all shadow-inner"
                  >
                     {preview ? <img src={preview} className="w-full h-full object-cover" alt="Preview" /> : <ImageIcon size={40} className="text-gray-200" />}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-black tracking-widest transition-opacity">
                       <Plus size={24} className="mb-1" />
                       更換主圖
                     </div>
                  </div>
                  
                  {/* 真正隱藏的檔案選擇器 */}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  
                  <div className="space-y-1">
                    <p className="text-gray-700 font-black text-lg">療程主視覺 (image_url)</p>
                    <p className="text-gray-400 text-sm flex items-center gap-1"><CloudIcon size={14} /> 點擊方塊選擇圖片，將由 Cloudinary 提供 CDN 加速</p>
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-8 text-2xl font-black disabled:opacity-50 disabled:grayscale">
                 {saving ? (
                   <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={32} /><span>同步雲端數據中...</span></div>
                 ) : (
                   <div className="flex items-center gap-4"><Save size={32} /><span>確認儲存療程項目</span></div>
                 )}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CloudIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-4-4.5a7 7 0 1 0-11 8.5" />
      <path d="M12 11v6" /><path d="m9 14 3-3 3 3" />
    </svg>
  );
}
