
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Edit3, X, Loader2, Save, 
  Layers, PlusCircle, Image as LucideImage, Sparkles,
  UploadCloud
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Cropper from 'react-easy-crop';

// 圖片處理工具函數
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  canvas.width = 800;
  canvas.height = 600; // 療程圖片建議 4:3 或 16:9，這裡用 4:3
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, 800, 600
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(blob);
    }, 'image/webp', 0.9);
  });
}

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
  const [priceOptions, setPriceOptions] = useState<any[]>([]);
  const [iconName, setIconName] = useState('Sparkles');

  // 圖片相關
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 抓取療程清單
      const { data: tData, error: tError } = await supabase
        .from('treatments')
        .select('*')
        .order('sort_order', { ascending: true });

      if (tError) throw tError;

      // 2. 抓取價格方案 (分開抓取以確保穩定)
      const { data: pData, error: pError } = await supabase
        .from('treatment_price_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (pError) console.error("Fetch prices error:", pError);

      // 3. 抓取關聯 (嘗試多個可能的表名與欄位)
      let relations: any[] = [];
      
      try {
        const [rel1, rel2] = await Promise.all([
          supabase.from('treatment_improvement_categories').select('*'),
          supabase.from('treatment_categories').select('*')
        ]);

        if (rel1.data && rel1.data.length > 0) {
          relations = rel1.data.map(r => ({
            treatment_id: r.treatment_id,
            improvement_category_id: r.improvement_category_id || r.category_id
          }));
        } else if (rel2.data && rel2.data.length > 0) {
          relations = rel2.data.map(r => ({
            treatment_id: r.treatment_id,
            improvement_category_id: r.category_id || r.improvement_category_id
          }));
        }
      } catch (relErr) {
        console.error("Fetch relations error:", relErr);
      }

      const finalTData = (tData || []).map(t => {
        const tRelations = relations.filter(r => r.treatment_id === t.id);
        const tCategories = tRelations.map(r => {
          const cat = (cData || []).find(c => c.id === r.improvement_category_id);
          return cat ? cat.name : null;
        }).filter(Boolean);

        return {
          ...t,
          treatment_price_options: (pData || []).filter(p => p.treatment_id === t.id),
          treatment_improvement_categories: tRelations,
          category_names: tCategories
        };
      });

      // 4. 抓取改善項目清單
      const { data: cData, error: cError } = await supabase
        .from('improvement_categories')
        .select('id, name')
        .order('sort_order', { ascending: true });

      if (cError) throw cError;

      setTreatments(finalTData);
      setCategories(cData || []);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      const { data: basic } = await supabase.from('treatments').select('*');
      if (basic) setTreatments(basic);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let finalImageUrl = existingImagePath;

      // 處理圖片上傳
      if (imageFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const path = `treatments/${fileName}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('icons').upload(path, imageFile, { contentType: 'image/webp' });
        if (uploadErr) throw uploadErr;
        
        const { data: publicUrlData } = supabase.storage.from('icons').getPublicUrl(uploadData.path);
        finalImageUrl = publicUrlData.publicUrl;
      }

      // 移除 updated_at 以避免觸發資料庫遞迴更新錯誤 (stack depth limit exceeded)
      const treatmentPayload: any = {
        title: title.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder),
        image_url: finalImageUrl,
      };
      
      let treatmentId = editingId;

      // 第一步：處理 Treatments 主檔
      if (editingId) {
        const { error: tError } = await supabase
          .from('treatments')
          .update(treatmentPayload)
          .eq('id', editingId);
        if (tError) throw tError;
      } else {
        const { data: tData, error: tError } = await supabase
          .from('treatments')
          .insert([treatmentPayload])
          .select('id')
          .single();
        if (tError) throw tError;
        treatmentId = tData.id;
      }

      if (!treatmentId) throw new Error("無法取得療程 ID");

      // 第二步：同步價格方案
      try {
        // 先刪除
        await supabase.from('treatment_price_options').delete().eq('treatment_id', treatmentId);
        
        // 過濾掉空的方案
        const validOptions = priceOptions.filter(opt => opt.price > 0 || (opt.label && opt.label.trim() !== ''));
        
        if (validOptions.length > 0) {
          const optionsToInsert = validOptions.map((opt, idx) => ({
            treatment_id: treatmentId,
            label: opt.label?.trim() || (opt.sessions === 1 ? '單堂' : `${opt.sessions}堂`),
            price: Number(opt.price) || 0,
            sessions: Number(opt.sessions) || 1,
            sort_order: idx
          }));
          const { error: insPriceErr } = await supabase.from('treatment_price_options').insert(optionsToInsert);
          if (insPriceErr) throw insPriceErr;
        }
      } catch (pErr) {
        console.error("Price options sync error:", pErr);
        throw new Error("價格方案儲存失敗，請檢查資料格式");
      }

      // 第三步：同步改善項目關聯
      try {
        // 刪除舊關聯
        await Promise.allSettled([
          supabase.from('treatment_categories').delete().eq('treatment_id', treatmentId),
          supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId)
        ]);
        
        if (selectedCategoryIds.length > 0) {
          // 嘗試寫入新關聯 (優先寫入 treatment_improvement_categories)
          const relations = selectedCategoryIds.map(cid => ({
            treatment_id: treatmentId,
            improvement_category_id: cid
          }));
          
          const { error: relErr } = await supabase.from('treatment_improvement_categories').insert(relations);
          
          if (relErr) {
            // 備案：嘗試寫入 treatment_categories
            const altRelations = selectedCategoryIds.map(cid => ({
              treatment_id: treatmentId,
              category_id: cid
            }));
            await supabase.from('treatment_categories').insert(altRelations);
          }
        }
      } catch (cErr) {
        console.error("Categories sync error:", cErr);
      }

      setIsModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert("儲存失敗: " + (err.message || "未知錯誤"));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { setCropImageSrc(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => { setCroppedAreaPixels(croppedAreaPixels); }, []);

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
    setImageFile(new File([croppedBlob], "treatment.webp", { type: "image/webp" }));
    setImagePreview(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
  };

  const openModal = (t?: any) => {
    if (t) {
      setEditingId(t.id);
      setTitle(t.title || '');
      setDescription(t.description || '');
      setSortOrder(t.sort_order || 0);
      setIconName(t.icon_name || 'Sparkles');
      
      const categoryIds = t.treatment_improvement_categories?.map((rel: any) => rel.improvement_category_id) || [];
      setSelectedCategoryIds(categoryIds);
      
      const mappedOptions = (t.treatment_price_options || []).map((opt: any) => ({
        ...opt,
        label: opt.label === 'EMPTY' ? '' : opt.label
      }));
      setPriceOptions(mappedOptions.length > 0 ? mappedOptions : [{ label: '', sessions: 1, price: 0 }]);

      if (t.image_url) {
        setExistingImagePath(t.image_url);
        setImagePreview(t.image_url);
      } else if (t.icon_name && t.icon_name.includes('/')) {
        setExistingImagePath(t.icon_name);
        const { data } = supabase.storage.from('icons').getPublicUrl(t.icon_name);
        setImagePreview(data.publicUrl);
      } else {
        setExistingImagePath(null);
        setImagePreview(null);
      }
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setSortOrder(treatments.length + 1);
      setSelectedCategoryIds([]);
      setPriceOptions([{ label: '', sessions: 1, price: 0 }]);
      setIconName('Sparkles');
      setExistingImagePath(null);
      setImagePreview(null);
    }
    setImageFile(null);
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
                    <div className="w-16 h-12 bg-gray-50 rounded-xl overflow-hidden border flex items-center justify-center">
                       {t.image_url ? (
                         <img src={t.image_url} className="w-full h-full object-cover" alt="" />
                       ) : t.icon_name && t.icon_name.includes('/') ? (
                         <img src={supabase.storage.from('icons').getPublicUrl(t.icon_name).data.publicUrl} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <Sparkles size={24} className="text-clinic-gold" />
                       )}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="font-black text-gray-800 text-lg">{t.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.category_names?.map((name: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-clinic-cream text-clinic-gold px-2 py-0.5 rounded-md font-bold border border-clinic-gold/20">
                          {name}
                        </span>
                      ))}
                    </div>
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

                  <div className="space-y-4 flex flex-col items-center">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest w-full">療程封面圖片 (建議 4:3)</label>
                    <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[4/3] bg-gray-50 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 transition-all shadow-inner">
                       {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="" /> : <UploadCloud size={64} className="text-gray-200" />}
                       <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">點擊上傳或更換圖片</p>
                  </div>
               </section>

               <section className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={18}/> 價格方案設定</h4>
                    <button type="button" onClick={() => setPriceOptions([...priceOptions, { label: '', price: 0, sessions: 1 }])} className="text-clinic-gold flex items-center gap-1 font-black text-xs uppercase tracking-widest hover:underline"><PlusCircle size={20}/> 新增方案</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {priceOptions.map((opt, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative group">
                        <button type="button" onClick={() => setPriceOptions(priceOptions.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><X size={16}/></button>
                        <div className="space-y-4">
                          <input placeholder="標籤 (預設為: 單堂/X堂)" value={opt.label} onChange={e => { const n = [...priceOptions]; n[i].label = e.target.value; setPriceOptions(n); }} className="w-full text-sm font-black border-b pb-2 outline-none focus:border-clinic-gold" />
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
      {showCropper && cropImageSrc && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-12">
           <div className="w-full max-w-3xl aspect-[4/3] relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
           </div>
           <div className="w-full max-w-3xl mt-8 flex gap-4">
              <button onClick={() => setShowCropper(false)} className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-bold">取消</button>
              <button onClick={handleCropSave} className="flex-[2] py-5 bg-clinic-gold text-white rounded-2xl font-black text-xl">完成裁切</button>
           </div>
        </div>
      )}
    </div>
  );
}
