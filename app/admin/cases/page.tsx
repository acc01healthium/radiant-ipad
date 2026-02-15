
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, ImageIcon, X, Loader2, Sparkles, Camera, Tag } from 'lucide-react';

export default function AestheticCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCases(data || []);
    } catch (e: any) {
      alert('載入失敗: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !preview) {
      alert('請務必選擇案例照片！');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = preview || '';

      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
      }

      const payload = {
        title,
        description,
        category,
        image_url: finalImageUrl,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('cases').insert([payload]);

      if (error) throw error;
      
      closeModal();
      await fetchCases();
      alert('案例發布成功！');
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`發布失敗: ${error.message}`);
    } finally {
      setSaving(false); // 確保不論成功失敗都會執行
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('永久刪除此見證案例？此操作不可撤銷。')) return;
    try {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
      fetchCases();
    } catch (e: any) {
      alert('刪除失敗: ' + e.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setCategory('');
    setImageFile(null);
    setPreview(null);
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
    <div className="space-y-12 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 術前後見證</h2>
          <p className="text-gray-500 mt-2 font-medium">使用 Supabase 儲存的高品質視覺案例</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30">
          <Plus size={24} /> 新增美麗見證
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-clinic-gold" size={64} /><p className="text-gray-400 font-bold tracking-widest uppercase">案例庫同步中</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {cases.map(c => (
            <div key={c.id} className="glass-card overflow-hidden group hover:shadow-2xl transition-all relative border border-gray-100">
              <div className="h-72 relative overflow-hidden bg-gray-50">
                <img src={c.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={c.title} />
                <div className="absolute top-4 left-4 bg-clinic-gold text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg uppercase tracking-widest">{c.category || '案例'}</div>
              </div>
              <div className="p-8">
                 <h4 className="text-2xl font-black text-gray-800 leading-tight group-hover:text-clinic-gold transition-colors">{c.title}</h4>
                 <p className="text-gray-400 mt-2 line-clamp-2 text-sm italic">{c.description || '暫無說明'}</p>
                 <button onClick={() => handleDelete(c.id)} className="absolute bottom-8 right-8 text-gray-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={24} /></button>
              </div>
            </div>
          ))}
          {cases.length === 0 && (
            <div className="col-span-full py-48 flex flex-col items-center justify-center glass-card border-dashed border-4 border-gray-100 bg-transparent">
              <Camera size={80} className="text-gray-100 mb-6" />
              <p className="text-gray-400 font-bold text-2xl tracking-widest">目前尚無美麗見證</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden my-auto animate-fade-in">
             <div className="p-10 border-b flex justify-between items-center bg-clinic-cream">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-clinic-gold rounded-2xl flex items-center justify-center text-white"><Camera size={28} /></div>
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight">建立美麗對比案例</h3>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={32} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">案例標題 (title)</label>
                     <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-5 text-xl" placeholder="例：皮秒雷射三次效果" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">所屬類別 (category)</label>
                     <div className="relative">
                       <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={24} />
                       <input required value={category} onChange={e => setCategory(e.target.value)} className="input-field py-5 pl-14 text-xl" placeholder="例：斑點治療" />
                     </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">效果說明 (description)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 py-5 resize-none" placeholder="描述治療過程與改善狀況..." />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">對比照片 (image_url)</label>
                  <div className="aspect-video bg-gray-50 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-clinic-gold/30 transition-all">
                    {preview ? (
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center space-y-3">
                        <ImageIcon size={64} className="mx-auto text-gray-200" />
                        <span className="text-gray-400 font-bold block">點擊選擇術前術後拼圖</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-gold w-full py-8 text-2xl font-black disabled:opacity-50">
                  {saving ? (
                    <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={32} /><span>同步同步雲端數據中</span></div>
                  ) : (
                    <div className="flex items-center gap-4"><Sparkles size={32} /><span>發布美麗對比見證</span></div>
                  )}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
