
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { AestheticCase } from '@/types';
import { Plus, Trash2, ImageIcon, X, Loader2, Sparkles, Camera } from 'lucide-react';

export default function AestheticCasesPage() {
  const [cases, setCases] = useState<AestheticCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('createdAt', { ascending: false });
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
    if (!beforeFile || !afterFile) {
      alert('請務必選擇術前與術後照片！');
      return;
    }

    setUploading(true);
    try {
      const beforeUrl = await uploadImageToCloudinary(beforeFile);
      const afterUrl = await uploadImageToCloudinary(afterFile);

      const { error } = await supabase.from('cases').insert([{
        title,
        treatmentName,
        beforeImageUrl: beforeUrl,
        afterImageUrl: afterUrl,
        createdAt: new Date().toISOString()
      }]);

      if (error) throw error;
      
      closeModal();
      fetchCases();
    } catch (error: any) {
      alert(`發布失敗: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('永久刪除此案例？')) return;
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
    setTreatmentName('');
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview(null);
    setAfterPreview(null);
    setUploading(false);
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800">術前後案例 (Supabase)</h2>
          <p className="text-gray-500 mt-2 font-medium">基於 Supabase 儲存的美麗見證</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold px-12 py-5 text-lg">
          <Plus size={24} /> 新增美麗見證
        </button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {cases.map(c => (
            <div key={c.id} className="glass-card overflow-hidden group hover:shadow-2xl transition-all">
              <div className="flex h-60 border-b">
                <div className="flex-1 relative"><img src={c.beforeImageUrl} className="w-full h-full object-cover" /><div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] p-1 rounded">BEFORE</div></div>
                <div className="flex-1 relative"><img src={c.afterImageUrl} className="w-full h-full object-cover" /><div className="absolute top-2 left-2 bg-clinic-gold text-white text-[10px] p-1 rounded">AFTER</div></div>
              </div>
              <div className="p-8 relative">
                 <h4 className="text-2xl font-black text-gray-800">{c.title}</h4>
                 <p className="text-clinic-gold font-bold text-sm mt-1">{c.treatmentName}</p>
                 <button onClick={() => handleDelete(c.id)} className="absolute top-8 right-8 text-gray-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={24} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden my-auto animate-fade-in">
             <div className="p-10 border-b flex justify-between items-center bg-clinic-cream">
                <h3 className="text-3xl font-black text-gray-800">建立 Supabase 美麗對比</h3>
                <button onClick={closeModal}><X size={32} className="text-gray-400" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                   <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-5 text-xl" placeholder="案例標題" />
                   <input required value={treatmentName} onChange={e => setTreatmentName(e.target.value)} className="input-field py-5 text-xl" placeholder="療程名稱" />
                </div>
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">術前 (Before)</label>
                      <div className="aspect-square bg-gray-50 border-4 border-dashed rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                         {beforePreview ? <img src={beforePreview} className="w-full h-full object-cover" /> : <ImageIcon size={64} className="text-gray-200" />}
                         <input type="file" onChange={e => {
                           const f = e.target.files?.[0];
                           if(f) { setBeforeFile(f); setBeforePreview(URL.createObjectURL(f)); }
                         }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-xs font-black text-clinic-gold uppercase tracking-widest">術後 (After)</label>
                      <div className="aspect-square bg-gray-50 border-4 border-dashed rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                         {afterPreview ? <img src={afterPreview} className="w-full h-full object-cover" /> : <ImageIcon size={64} className="text-clinic-gold/20" />}
                         <input type="file" onChange={e => {
                           const f = e.target.files?.[0];
                           if(f) { setAfterFile(f); setAfterPreview(URL.createObjectURL(f)); }
                         }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                   </div>
                </div>
                <button type="submit" disabled={uploading} className="btn-gold w-full py-8 text-2xl font-black">
                  {uploading ? <Loader2 className="animate-spin" size={32} /> : '發布至 Supabase'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
