'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
// Added Save to the lucide-react import list to fix the "Cannot find name 'Save'" error.
import { Plus, Trash2, Edit3, X, Loader2, ImageIcon, CheckCircle2, Tag, Database, Save } from 'lucide-react';

export default function CasesAdminPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [casesRes, catsRes, treatRes] = await Promise.all([
      supabase.from('cases').select('*, case_categories(category_id), case_treatments(treatment_id)').order('sort_order', { ascending: true }),
      supabase.from('improvement_categories').select('*').eq('is_active', true),
      supabase.from('treatments').select('*').eq('is_active', true)
    ]);
    setCases(casesRes.data || []);
    setCategories(catsRes.data || []);
    setTreatments(treatRes.data || []);
    setLoading(false);
  };

  const openModal = (c?: any) => {
    if (c) {
      setEditingId(c.id);
      setTitle(c.title);
      setDescription(c.description);
      setImageUrl(c.image_url);
      setSortOrder(c.sort_order);
      setSelectedCats(c.case_categories.map((x: any) => x.category_id));
      setSelectedTreatments(c.case_treatments.map((x: any) => x.treatment_id));
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setSortOrder(cases.length + 1);
      setSelectedCats([]);
      setSelectedTreatments([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { title, description, image_url: imageUrl, sort_order: sortOrder };
    
    let resId = editingId;
    if (editingId) {
      await supabase.from('cases').update(payload).eq('id', editingId);
    } else {
      const { data } = await supabase.from('cases').insert([payload]).select().single();
      resId = data.id;
    }

    if (resId) {
      // Sync relations
      await Promise.all([
        supabase.from('case_categories').delete().eq('case_id', resId),
        supabase.from('case_treatments').delete().eq('case_id', resId)
      ]);
      await Promise.all([
        selectedCats.length > 0 && supabase.from('case_categories').insert(selectedCats.map(cid => ({ case_id: resId, category_id: cid }))),
        selectedTreatments.length > 0 && supabase.from('case_treatments').insert(selectedTreatments.map(tid => ({ case_id: resId, treatment_id: tid })))
      ]);
    }

    setIsModalOpen(false);
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定刪除此案例？')) {
      await supabase.from('cases').delete().eq('id', id);
      fetchData();
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-clinic-gold inline" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b pb-8">
        <h2 className="text-4xl font-black text-gray-800 tracking-tight">術前後見證管理</h2>
        <button onClick={() => openModal()} className="btn-gold px-8 py-4 shadow-clinic-gold/30"><Plus /> 新增美麗見證</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cases.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border shadow-sm group">
            <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-50 flex items-center justify-center">
              <img src={c.image_url} className="max-w-full max-h-full object-contain" />
            </div>
            <h4 className="text-xl font-bold mb-2">{c.title}</h4>
            <div className="flex gap-2 flex-wrap mb-4">
              {c.case_categories.map((rel: any) => (
                <span key={rel.category_id} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                  {categories.find(x => x.id === rel.category_id)?.name}
                </span>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(c)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-clinic-gold"><Edit3 size={18} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black">{editingId ? '編輯見證' : '建立見證'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">標題</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">照片 URL (建議組合圖)</label>
                  <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">介紹說明</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 resize-none" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">關聯欲改善項目 (多選)</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border">
                    {categories.map(cat => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCats(prev => prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedCats.includes(cat.id) ? 'bg-clinic-gold text-white border-clinic-gold' : 'bg-white text-gray-400 border-gray-200'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">關聯療程 (多選)</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border">
                    {treatments.map(t => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setSelectedTreatments(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedTreatments.includes(t.id) ? 'bg-clinic-gold text-white border-clinic-gold' : 'bg-white text-gray-400 border-gray-200'}`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl">
                  {saving ? <Loader2 className="animate-spin" /> : <Save />} 儲存案例資料
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}