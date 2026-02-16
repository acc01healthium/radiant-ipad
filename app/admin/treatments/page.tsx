
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Save, Hash, Tag, CheckSquare, Square, Layers, PlusCircle } from 'lucide-react';

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
  const [price, setPrice] = useState<string | number>(0); // Legacy base price
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string | number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // 多重價格方案狀態
  const [priceOptions, setPriceOptions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from('treatments').select('*, treatment_price_options(*), treatment_improvement_categories(category_id, improvement_categories(name))').order('sort_order', { ascending: true }),
      supabase.from('improvement_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);
    setTreatments(tRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  };

  const addPriceOption = () => {
    setPriceOptions([...priceOptions, { label: '', sessions: null, price: 0, sort_order: priceOptions.length + 1, is_active: true }]);
  };

  const removePriceOption = (index: number) => {
    setPriceOptions(priceOptions.filter((_, i) => i !== index));
  };

  const updatePriceOption = (index: number, field: string, value: any) => {
    const newOptions = [...priceOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setPriceOptions(newOptions);
  };

  const toggleCategorySelection = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };

      let treatmentId = editingId;
      if (editingId) {
        const { error } = await supabase.from('treatments').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('treatments').insert([payload]).select().single();
        if (error) throw error;
        treatmentId = data.id;
      }

      if (treatmentId) {
        // 同步分類
        await supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId);
        if (selectedCategoryIds.length > 0) {
          const relationPayload = selectedCategoryIds.map(catId => ({
            treatment_id: treatmentId,
            category_id: catId
          }));
          await supabase.from('treatment_improvement_categories').insert(relationPayload);
        }

        // 同步價格方案
        await supabase.from('treatment_price_options').delete().eq('treatment_id', treatmentId);
        if (priceOptions.length > 0) {
          const optionsPayload = priceOptions.map(opt => ({
            treatment_id: treatmentId,
            label: opt.label.trim(),
            sessions: opt.sessions ? Number(opt.sessions) : null,
            price: Number(opt.price) || 0,
            sort_order: Number(opt.sort_order) || 0,
            is_active: opt.is_active
          }));
          await supabase.from('treatment_price_options').insert(optionsPayload);
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
      setPrice(t.price);
      setDescription(t.description);
      setSelectedCategoryIds(t.treatment_improvement_categories?.map((rel: any) => rel.category_id) || []);
      setSortOrder(t.sort_order);
      setPreview(t.image_url);
      setPriceOptions(t.treatment_price_options || []);
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setDescription('');
      setSelectedCategoryIds([]);
      setSortOrder(treatments.length + 1);
      setPreview(null);
      setPriceOptions([{ label: '單堂', sessions: 1, price: 0, sort_order: 1, is_active: true }]);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">療程項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">支援多重價格方案與 RWD 視覺預覽</p>
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
                <th className="p-8">療程名稱</th>
                <th className="p-8">價格方案</th>
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
                    <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                      {t.treatment_improvement_categories?.map((rel: any) => rel.improvement_categories?.name).join(' / ') || '未設定分類'}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-wrap gap-2">
                      {t.treatment_price_options?.length > 0 ? t.treatment_price_options.sort((a:any, b:any)=>a.sort_order - b.sort_order).map((opt: any) => (
                        <div key={opt.id} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">
                          {opt.label}: ${opt.price.toLocaleString()}
                        </div>
                      )) : <span className="text-gray-300 italic text-xs">Legacy Price: ${t.price?.toLocaleString()}</span>}
                    </div>
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3 pt-12">
                    <button onClick={() => openModal(t)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('確定要刪除？')) { await supabase.from('treatments').delete().eq('id', t.id); fetchData(); }}} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl animate-fade-in my-auto">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程內容' : '建立新療程'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={32} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程標題</label><input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-4 font-bold" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">簡介說明</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 py-4 resize-none" /></div>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程視覺 (將以 Object-Contain 完整顯示)</label>
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-gray-50 border-4 border-dashed rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 p-4">
                      {preview ? <img src={preview} className="max-w-full max-h-full object-contain" /> : <div className="text-center"><ImageIcon size={48} className="mx-auto text-gray-200" /><span className="text-xs text-gray-300 font-bold">點擊上傳視覺圖</span></div>}
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){setImageFile(f); setPreview(URL.createObjectURL(f));}}} />
                  </div>
               </div>

               <div className="space-y-8 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400 font-black text-xs uppercase tracking-widest">
                      <Layers size={14} /> 價格方案設定
                    </div>
                    <button type="button" onClick={addPriceOption} className="text-clinic-gold hover:scale-110 transition-transform"><PlusCircle size={28} /></button>
                  </div>

                  <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
                    {priceOptions.map((opt, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group">
                        <button type="button" onClick={() => removePriceOption(i)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-300 uppercase">標籤 (例:單堂)</label>
                            <input value={opt.label} onChange={e => updatePriceOption(i, 'label', e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-amber-200 outline-none" placeholder="單堂" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-300 uppercase">堂數 (選填)</label>
                            <input type="number" value={opt.sessions || ''} onChange={e => updatePriceOption(i, 'sessions', e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" placeholder="1" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-300 uppercase">方案價格</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]">$</span>
                              <input type="number" value={opt.price} onChange={e => updatePriceOption(i, 'price', e.target.value)} className="w-full pl-6 pr-3 py-2 text-sm border rounded-lg outline-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-300 uppercase">排序</label>
                            <input type="number" value={opt.sort_order} onChange={e => updatePriceOption(i, 'sort_order', e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {priceOptions.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 text-sm italic">目前無價格方案，前台將顯示基本價格</div>
                    )}
                  </div>
               </div>

               <div className="lg:col-span-2 pt-4">
                  <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/30">
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    {saving ? '正在同步雲端數據' : '儲存療程與方案設定'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
