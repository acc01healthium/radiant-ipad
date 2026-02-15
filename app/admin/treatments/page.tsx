
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save, Hash } from 'lucide-react';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      console.error("Fetch Error:", e);
      alert('載入失敗: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = preview || '';

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const payload = {
        title,
        price: Number(price),
        description,
        icon_name: iconName,
        sort_order: Number(sortOrder),
        image_url: imageUrl,
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

      closeModal();
      await fetchTreatments();
      alert('療程儲存成功');
    } catch (err: any) {
      console.error("Save Error:", err);
      alert(`儲存失敗: ${err.message}`);
    } finally {
      setSaving(false); // 確保轉圈必停止
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此療程？資料將永久消失。')) return;
    try {
      const { error } = await supabase.from('treatments').delete().eq('id', id);
      if (error) throw error;
      fetchTreatments();
    } catch (e: any) {
      alert('刪除失敗: ' + e.message);
    }
  };

  const openModal = (t?: any) => {
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 療程管理</h2>
          <p className="text-gray-500 mt-2 font-medium">使用 Supabase 同步更新前台展示</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30">
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-clinic-gold" size={64} /><p className="text-gray-400 font-bold tracking-widest uppercase">療程數據同步中</p></div>
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
                        <span className="text-xs text-clinic-gold font-bold flex items-center gap-1 uppercase tracking-tighter"><Sparkles size={12} /> {t.icon_name || '未設分類'}</span>
                     </div>
                  </td>
                  <td className="p-8 font-black text-clinic-gold text-2xl">NT$ {t.price?.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3 mt-4">
                    <button onClick={() => openModal(t)} className="p-4 bg-white shadow-md rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={20} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-4 bg-white shadow-md rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
              {treatments.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-light">目前尚無療程，請點擊右上方按鈕新增。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-3xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程內容' : '建立全新療程'}</h3>
              <button onClick={closeModal} className="p-4 text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程標題 (title)</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-5 text-xl" placeholder="例：全臉皮秒雷射" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">定價 (price)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={24} />
                      <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field py-5 pl-14 text-xl" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">分類標籤 (icon_name)</label>
                    <input value={iconName} onChange={e => setIconName(e.target.value)} className="input-field py-5 text-xl" placeholder="例：斑點 / 皺紋" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">顯示排序 (sort_order)</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                      <input type="number" required value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field py-5 pl-14 text-xl" />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">詳細介紹 (description)</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 py-6 resize-none" placeholder="療程原理、特色說明..." />
               </div>

               <div className="flex items-center gap-10">
                  <div className="w-40 h-40 bg-gray-50 border-4 border-dashed rounded-3xl flex items-center justify-center relative overflow-hidden group">
                     {preview ? <img src={preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                     <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">上傳主圖</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600 font-bold text-lg">療程主視覺 (image_url)</p>
                    <p className="text-gray-400 text-sm">點擊左側方塊選擇圖片，將自動上傳至 Cloudinary</p>
                  </div>
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-8 text-2xl font-black disabled:opacity-50">
                 {saving ? (
                   <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={32} /><span>同步雲端中</span></div>
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
