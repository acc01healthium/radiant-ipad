
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { 
  Plus, Trash2, Edit3, ImageIcon, X, Loader2, Save, 
  Layers, PlusCircle, Check, Camera, Image as LucideImage 
} from 'lucide-react';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [priceOptions, setPriceOptions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from('treatments').select(`
        *, 
        treatment_price_options(*), 
        treatment_improvement_categories(category_id),
        treatment_cases(*)
      `).order('sort_order', { ascending: true }),
      supabase.from('improvement_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);
    setTreatments(tRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCaseImageUpload = async (file: File) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.storage
      .from('case-images')
      .upload(`cases/${fileName}`, file);
    if (error) throw error;
    return supabase.storage.from('case-images').getPublicUrl(data.path).data.publicUrl;
  };

  const addCase = () => {
    setCases([...cases, { id: `new-${Date.now()}`, title: '', description: '', before_image_url: '', after_image_url: '', sort_order: cases.length }]);
  };

  const updateCase = (id: string, field: string, value: any) => {
    setCases(cases.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const deleteCase = (id: string) => {
    setCases(cases.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let finalImageUrl = mainImagePreview || '';
      if (mainImageFile) {
        finalImageUrl = await uploadImageToCloudinary(mainImageFile);
      }

      const payload = {
        title,
        description,
        sort_order: sortOrder,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      let treatmentId = editingId;
      if (editingId) {
        await supabase.from('treatments').update(payload).eq('id', editingId);
      } else {
        const { data } = await supabase.from('treatments').insert([payload]).select().single();
        treatmentId = data.id;
      }

      if (treatmentId) {
        // 1. 同步分類
        await supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId);
        if (selectedCategoryIds.length > 0) {
          await supabase.from('treatment_improvement_categories').insert(
            selectedCategoryIds.map(cid => ({ treatment_id: treatmentId, category_id: cid }))
          );
        }

        // 2. 同步價格
        await supabase.from('treatment_price_options').delete().eq('treatment_id', treatmentId);
        if (priceOptions.length > 0) {
          await supabase.from('treatment_price_options').insert(
            priceOptions.map(opt => ({ ...opt, id: undefined, treatment_id: treatmentId }))
          );
        }

        // 3. 同步案例 (先刪除舊的再新增目前的，或是根據 ID 更新)
        await supabase.from('treatment_cases').delete().eq('treatment_id', treatmentId);
        if (cases.length > 0) {
          await supabase.from('treatment_cases').insert(
            cases.map(c => ({
              treatment_id: treatmentId,
              title: c.title,
              description: c.description,
              before_image_url: c.before_image_url,
              after_image_url: c.after_image_url,
              sort_order: c.sort_order
            }))
          );
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
      setDescription(t.description);
      setSelectedCategoryIds(t.treatment_improvement_categories?.map((rel: any) => rel.category_id) || []);
      setSortOrder(t.sort_order);
      setMainImagePreview(t.image_url);
      setPriceOptions(t.treatment_price_options || []);
      setCases(t.treatment_cases || []);
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setSelectedCategoryIds([]);
      setSortOrder(treatments.length + 1);
      setMainImagePreview(null);
      setPriceOptions([{ label: '單堂', sessions: 1, price: 0, sort_order: 1, is_active: true }]);
      setCases([]);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">療程項目與見證管理</h2>
          <p className="text-gray-500 mt-2 font-medium">一站式管理療程、價格、分類與術前後見證</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30"><Plus size={24} /> 新增療程</button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs tracking-widest uppercase">
              <tr>
                <th className="p-8 w-20">排序</th>
                <th className="p-8 w-24">預覽</th>
                <th className="p-8">療程與分類</th>
                <th className="p-8">見證數</th>
                <th className="p-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400 font-bold">{t.sort_order}</td>
                  <td className="p-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border flex items-center justify-center p-2">
                      <img src={t.image_url} className="max-w-full max-h-full object-contain" alt="" />
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-black text-gray-800 text-lg">{t.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.treatment_improvement_categories?.map((rel: any) => {
                        const cat = categories.find(c => c.id === rel.category_id);
                        return cat ? <span key={cat.id} className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-100">{cat.name}</span> : null;
                      })}
                    </div>
                  </td>
                  <td className="p-8 font-bold text-gray-400">
                    {t.treatment_cases?.length || 0} 個見證
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3 pt-12">
                    <button onClick={() => openModal(t)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('確定要刪除此療程與所有相關數據？')) { await supabase.from('treatments').delete().eq('id', t.id); fetchData(); }}} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl animate-fade-in my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream sticky top-0 z-10">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程內容' : '建立新療程'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-12">
               {/* 第一部分：基本資訊與分類 */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程名稱</label>
                      <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程介紹</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">關聯改善項目 (多選)</label>
                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border">
                        {categories.map(cat => (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                              selectedCategoryIds.includes(cat.id) 
                                ? 'bg-clinic-gold text-white border-clinic-gold shadow-md' 
                                : 'bg-white text-gray-400 border-gray-200 hover:border-amber-200'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">主視覺海報 (Object-Contain)</label>
                    <div 
                      onClick={() => document.getElementById('main-img')?.click()}
                      className="aspect-video bg-gray-50 border-4 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 p-4 shadow-inner"
                    >
                      {mainImagePreview ? (
                        <img src={mainImagePreview} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon size={48} className="mx-auto text-gray-200" />
                          <span className="text-xs text-gray-300 font-bold block mt-2">點擊上傳海報</span>
                        </div>
                      )}
                    </div>
                    <input id="main-img" type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){setMainImageFile(f); setMainImagePreview(URL.createObjectURL(f));}}} />
                  </div>
               </section>

               {/* 第二部分：價格方案 */}
               <section className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={18}/> 價格方案設定</h4>
                    <button type="button" onClick={() => setPriceOptions([...priceOptions, { label: '', price: 0, sessions: 1, sort_order: priceOptions.length + 1, is_active: true }])} className="text-clinic-gold flex items-center gap-1 font-black text-xs uppercase tracking-widest"><PlusCircle size={20}/> 新增方案</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {priceOptions.map((opt, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative group animate-fade-in">
                        <button type="button" onClick={() => setPriceOptions(priceOptions.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><X size={16}/></button>
                        <div className="space-y-4">
                          <input placeholder="方案名稱 (例:五堂特惠)" value={opt.label} onChange={e => { const n = [...priceOptions]; n[i].label = e.target.value; setPriceOptions(n); }} className="w-full text-sm font-black border-b pb-2 outline-none focus:border-clinic-gold" />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-300">單價 (NT$)</label>
                              <input type="number" value={opt.price} onChange={e => { const n = [...priceOptions]; n[i].price = e.target.value; setPriceOptions(n); }} className="w-full text-lg font-black outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-300">堂數</label>
                              <input type="number" value={opt.sessions} onChange={e => { const n = [...priceOptions]; n[i].sessions = e.target.value; setPriceOptions(n); }} className="w-full text-lg font-black outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>

               {/* 第三部分：嵌入式案例管理 */}
               <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Camera size={18}/> 術前後見證案例 (掛載於此療程)</h4>
                    <button type="button" onClick={addCase} className="btn-gold py-2 px-6 text-xs font-black uppercase tracking-widest"><Plus size={16}/> 新增見證案例</button>
                  </div>

                  <div className="space-y-6">
                    {cases.map((c, idx) => (
                      <div key={c.id} className="bg-white border-2 border-dashed border-gray-100 p-8 rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-3 gap-8 relative group animate-fade-in">
                        <button type="button" onClick={() => deleteCase(c.id)} className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                        
                        <div className="lg:col-span-1 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase">見證標題</label>
                            <input value={c.title} onChange={e => updateCase(c.id, 'title', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none" placeholder="例: 小美皮秒案例" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase">見證敘述</label>
                            <textarea value={c.description} onChange={e => updateCase(c.id, 'description', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm h-32 resize-none" placeholder="描述術後改善情況..." />
                          </div>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                           <CaseImageDrop 
                              label="術前 (Before)" 
                              url={c.before_image_url} 
                              onUpload={async (f) => {
                                const url = await handleCaseImageUpload(f);
                                updateCase(c.id, 'before_image_url', url);
                              }} 
                           />
                           <CaseImageDrop 
                              label="術後 (After)" 
                              url={c.after_image_url} 
                              onUpload={async (f) => {
                                const url = await handleCaseImageUpload(f);
                                updateCase(c.id, 'after_image_url', url);
                              }} 
                           />
                        </div>
                      </div>
                    ))}
                    {cases.length === 0 && <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] text-gray-300 italic text-sm">尚未新增任何術前後案例。</div>}
                  </div>
               </section>

               <div className="sticky bottom-0 bg-white/95 backdrop-blur py-6 border-t z-10">
                  <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/40">
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    {saving ? '正在同步數據到 Supabase...' : '儲存所有療程資訊與案例'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseImageDrop({ label, url, onUpload }: { label: string, url: string, onUpload: (f: File) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase text-center block">{label}</label>
      <div 
        onClick={() => inputRef.current?.click()}
        className="aspect-[4/5] bg-gray-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:border-amber-200 transition-all group"
      >
        {loading ? <Loader2 className="animate-spin text-clinic-gold" /> : (
          url ? <img src={url} className="w-full h-full object-cover" /> : (
            <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
              <LucideImage size={32} className="mx-auto" />
              <span className="text-[10px] font-black uppercase mt-1 block">點擊上傳</span>
            </div>
          )
        )}
      </div>
      <input 
        ref={inputRef} type="file" className="hidden" 
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if(f){
            setLoading(true);
            try { await onUpload(f); } finally { setLoading(false); }
          }
        }} 
      />
    </div>
  );
}
