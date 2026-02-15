
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Treatment, CategoryType } from '@/types';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save } from 'lucide-react';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedCats, setSelectedCats] = useState<CategoryType[]>([]);
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
        .order('updatedAt', { ascending: false });
      
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
    setUploading(true);
    try {
      let imageUrl = preview || '';

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const payload = {
        name,
        price: Number(price),
        description,
        categories: selectedCats,
        imageUrl,
        updatedAt: new Date().toISOString()
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
      fetchTreatments();
    } catch (err: any) {
      alert(`儲存失敗: ${err.message}`);
    } finally {
      setUploading(false);
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
      setName(t.name);
      setPrice(t.price);
      setDescription(t.description);
      setSelectedCats(t.categories || []);
      setPreview(t.imageUrl || null);
    } else {
      setEditingId(null);
      setName('');
      setPrice(0);
      setDescription('');
      setSelectedCats([]);
      setPreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUploading(false);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800">療程項目 (Supabase)</h2>
          <p className="text-gray-500 mt-1">管理 Supabase 資料庫中的療程方案</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg">
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">主視覺</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">名稱</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest">定價</th>
                <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-widest text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                      <img src={t.imageUrl || 'https://picsum.photos/200'} className="w-full h-full object-cover" alt={t.name} />
                    </div>
                  </td>
                  <td className="p-8 font-black text-xl text-gray-800">{t.name}</td>
                  <td className="p-8 font-black text-clinic-gold text-2xl">NT$ {t.price.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-3 mt-4">
                    <button onClick={() => openModal(t)} className="p-4 bg-white shadow-md rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={20} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-4 bg-white shadow-md rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-3xl font-black text-gray-800">{editingId ? '編輯療程' : '新增療程'}</h3>
              <button onClick={closeModal} className="p-4"><X size={32} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <input required value={name} onChange={e => setName(e.target.value)} className="input-field py-5 text-xl" placeholder="療程名稱" />
                  <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field py-5 text-xl" placeholder="價格" />
               </div>
               <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 py-6" placeholder="療程描述..." />
               <div className="flex items-center gap-10">
                  <div className="w-40 h-40 bg-gray-50 border-4 border-dashed rounded-3xl flex items-center justify-center relative overflow-hidden group">
                     {preview ? <img src={preview} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-200" />}
                     <input type="file" onChange={e => {
                       const f = e.target.files?.[0];
                       if(f) {
                         setImageFile(f);
                         setPreview(URL.createObjectURL(f));
                       }
                     }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <p className="text-gray-400">點擊上傳主視覺</p>
               </div>
               <button type="submit" disabled={uploading} className="btn-gold w-full py-8 text-2xl font-black">
                 {uploading ? <Loader2 className="animate-spin" size={32} /> : '確認儲存方案'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
