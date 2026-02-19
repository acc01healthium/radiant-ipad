
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(0);
  
  // UI 變數保留以維持結構，但不對應 treatments 表中的欄位
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [priceOptions, setPriceOptions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 修正：嚴格選取存在欄位，避免 400 錯誤
      const [tRes, cRes] = await Promise.all([
        supabase.from('treatments')
          .select('id,title,description,icon_name,sort_order, treatment_price_options(id,treatment_id,label,sessions,price,sort_order)')
          .order('sort_order', { ascending: true })
          .order('title', { ascending: true }),
        supabase.from('improvement_categories')
          .select('*')
          .order('sort_order', { ascending: true })
      ]);

      if (tRes.error) {
        console.error("Fetch Treatments Error (400?):", tRes.error);
        throw tRes.error;
      }
      setTreatments(tRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error("Critical Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(`Storage Upload Error (${bucket}):`, error);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      // 修正：Payload 僅包含 DB 存在的欄位，移除 visual_path, is_active 等
      const treatmentPayload = {
        title,
        description,
        sort_order: sortOrder,
        icon_name: 'Sparkles' // 預設使用存在的欄位
      };

      let treatmentId = editingId;
      if (editingId) {
        const { error } = await supabase.from('treatments').update(treatmentPayload).eq('id', editingId);
        if (error) throw error;
      } else {
        // 新增時確保拿到回傳 ID
        const { data, error } = await supabase.from('treatments').insert([treatmentPayload]).select('id').single();
        if (error) throw error;
        treatmentId = data.id;
      }

      if (treatmentId) {
        // 1. 價格方案儲存 (修正 Table: treatment_price_options)
        await supabase.from('treatment_price_options').delete().eq('treatment_id', treatmentId);
        if (priceOptions.length > 0) {
          const formattedPriceOptions = priceOptions.map((opt, idx) => {
            let label = opt.label;
            const sessions = Number(opt.sessions) || 1;
            if (!label || label.trim() === '' || label === 'EMPTY') {
              label = sessions === 1 ? '單堂' : `${sessions}堂`;
            }
            return {
              treatment_id: treatmentId,
              label: label,
              price: Number(opt.price) || 0,
              sessions: sessions,
              sort_order: idx
            };
          });
          const { error: pErr } = await supabase.from('treatment_price_options').insert(formattedPriceOptions);
          if (pErr) throw pErr;
        }

        // 2. 處理改善項目關聯 (若表存在)
        // 假設 table 為 treatment_improvement_categories
        try {
          await supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId);
          if (selectedCategoryIds.length > 0) {
            await supabase.from('treatment_improvement_categories').insert(
              selectedCategoryIds.map(cid => ({ treatment_id: treatmentId, improvement_category_id: cid }))
            );
          }
        } catch (catErr) {
          console.error("Relational data update error (Skipped):", catErr);
        }
      }

      setIsModalOpen(false);
      fetchData(); // 存檔後立即更新本地列表
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert("儲存失敗，請檢查欄位限制或網路狀態");
    } finally {
      setSaving(false);
    }
  };

  const openModal = (t?: any) => {
    if (t) {
      setEditingId(t.id);
      setTitle(t.title);
      setDescription(t.description || '');
      setSortOrder(t.sort_order || 0);
      setMainImagePreview(null); // visual_path 不存在，故不設定預覽
      
      const mappedOptions = (t.treatment_price_options || []).map((opt: any) => ({
        ...opt,
        label: (opt.label === 'EMPTY' || !opt.label) ? '單堂' : opt.label
      }));
      setPriceOptions(mappedOptions);
      setCases([]); 
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setSortOrder(treatments.length + 1);
      setMainImagePreview(null);
      setPriceOptions([{ label: '單堂', sessions: 1, price: 0 }]);
      setCases([]);
    }
    setMainImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">療程項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">管理診所提供的醫美服務方案與價格</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30 shrink-0"><Plus size={24} /> 新增療程</button>
      </div>

      {loading ? <div className="p-40 flex justify-center"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div> : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs tracking-widest uppercase">
              <tr>
                <th className="p-8 w-20">排序</th>
                <th className="p-8 w-24">圖示</th>
                <th className="p-8">療程名稱</th>
                <th className="p-8">方案數量</th>
                <th className="p-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {treatments.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400 font-bold">{t.sort_order}</td>
                  <td className="p-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border flex items-center justify-center">
                       <LucideImage size={24} className="text-gray-300" />
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-black text-gray-800 text-lg">{t.title}</div>
                    <p className="text-xs text-gray-400 line-clamp-1">{t.description}</p>
                  </td>
                  <td className="p-8 font-bold text-gray-400 text-sm">
                    {t.treatment_price_options?.length || 0} 個方案
                  </td>
                  <td className="p-8 text-right flex justify-end gap-3">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white w-[min(1100px,calc(100vw-48px))] max-w-none rounded-[2.5rem] shadow-2xl flex flex-col max-h-[calc(100dvh-48px)] overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream sticky top-0 z-10 shrink-0">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程內容' : '建立新療程'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={32} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12">
               <section className="grid grid-cols-1 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程名稱</label>
                      <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">療程介紹</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 resize-none" />
                    </div>
                  </div>
               </section>

               <section className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={18}/> 價格方案設定</h4>
                    <button type="button" onClick={() => setPriceOptions([...priceOptions, { label: '單堂', price: 0, sessions: 1 }])} className="text-clinic-gold flex items-center gap-1 font-black text-xs uppercase tracking-widest hover:underline"><PlusCircle size={20}/> 新增方案</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {priceOptions.map((opt, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative group">
                        <button type="button" onClick={() => setPriceOptions(priceOptions.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><X size={16}/></button>
                        <div className="space-y-4">
                          <input placeholder="例如：單堂 / 5堂" value={opt.label} onChange={e => { const n = [...priceOptions]; n[i].label = e.target.value; setPriceOptions(n); }} className="w-full text-sm font-black border-b pb-2 outline-none focus:border-clinic-gold" />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-300">金額</label>
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
            </form>

            <div className="p-8 border-t flex justify-end bg-white sticky bottom-0 z-10 shrink-0">
               <button type="submit" onClick={handleSubmit} disabled={saving} className="btn-gold px-16 py-5 text-xl shadow-clinic-gold/40 w-full md:w-auto">
                 {saving ? <Loader2 className="animate-spin" /> : <Save />}
                 {saving ? '正在儲存...' : '儲存變更'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
