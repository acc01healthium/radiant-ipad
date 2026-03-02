//app/admin/treatments/page.tsx

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
  const [allCases, setAllCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [iconName, setIconName] = useState('Sparkles');

  // 案例編輯相關
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseImageFile, setCaseImageFile] = useState<File | null>(null);
  const [caseImagePreview, setCaseImagePreview] = useState<string | null>(null);
  const [caseExistingImagePath, setCaseExistingImagePath] = useState<string | null>(null);
  const caseFileInputRef = useRef<HTMLInputElement>(null);
  const [savingCase, setSavingCase] = useState(false);

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
      // 1. 抓取改善項目清單
      const { data: cData, error: cError } = await supabase
        .from('improvement_categories')
        .select('id, name')
        .order('sort_order', { ascending: true });

      if (cError) throw cError;
      const categoriesList = cData || [];
      setCategories(categoriesList);

      // 2. 抓取療程清單
      const { data: tData, error: tError } = await supabase
        .from('treatments')
        .select('*')
        .order('sort_order', { ascending: true });

      if (tError) throw tError;

      // 3. 抓取改善項目關聯
      let relations: any[] = [];
      try {
        const { data: relData } = await supabase.from('treatment_improvement_categories').select('treatment_id, category_id');
        relations = (relData || []).map(r => ({
          treatment_id: r.treatment_id,
          category_id: r.category_id
        }));
      } catch (relErr) {
        console.error("Fetch improvement relations error:", relErr);
      }

      // 4. 抓取案例關聯 (使用 treatment_case_relations 作為關聯表)
let caseRelations: any[] = [];
try {
  const { data: cRelData } = await supabase.from('treatment_case_relations').select('treatment_id, case_id');  // ← 改這裡
  caseRelations = cRelData || [];
} catch (err) {
  console.error("Fetch case relations error:", err);
}

      // 5. 抓取案例清單
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('id', { ascending: false });
      
      if (casesError) console.error("Fetch cases error:", casesError);
      setAllCases(casesData || []);

      // 6. 建立最終療程資料
      const finalTData = (tData || []).map(t => {
        const tRelations = relations.filter(r => r.treatment_id === t.id);
        const tCategories = tRelations.map(r => {
          const foundCat = categoriesList.find(catItem => catItem.id === r.category_id);
          return foundCat ? foundCat.name : null;
        }).filter(Boolean);

        // 收集關聯的案例 ID (優先使用關聯表，標題匹配作為備案)
        const tCaseIds = Array.from(new Set([
          ...(caseRelations || []).filter(r => r.treatment_id === t.id).map(r => r.case_id),
          ...(casesData || []).filter(c => c.title && t.title && c.title.trim() === t.title.trim()).map(c => c.id)
        ]));

        return {
          ...t,
          treatment_price_options: [], // 留空陣列，避免後續出錯
          treatment_improvement_categories: tRelations,
          category_names: tCategories,
          case_ids: tCaseIds
        };
      });

      setTreatments(finalTData);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCase = (id: string) => {
    setSelectedCaseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openCaseModal = (c?: any) => {
    if (c) {
      setEditingCaseId(c.id);
      setCaseTitle(c.title || '');
      setCaseDescription(c.description || '');
      setCaseImagePreview(c.image_url || null);
      setCaseExistingImagePath(c.image_url || null);
    } else {
      setEditingCaseId(null);
      // 預設使用當前療程標題，這樣新增後就會因為標題一致而自動關聯
      setCaseTitle(title || '');
      setCaseDescription('');
      setCaseImagePreview(null);
      setCaseExistingImagePath(null);
    }
    setCaseImageFile(null);
    setIsCaseModalOpen(true);
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('確定要刪除此案例？此動作無法復原。')) return;
    try {
      // 刪除案例
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
      
      setIsCaseModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Delete Case Error:", err);
      alert("刪除失敗: " + err.message);
    }
  };

  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingCase) return;
    setSavingCase(true);
    try {
      let finalImageUrl = caseExistingImagePath;

      if (caseImageFile) {
        const fileName = `case-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const path = `cases/${fileName}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('icons').upload(path, caseImageFile, { contentType: 'image/webp', upsert: true });
        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage.from('icons').getPublicUrl(uploadData.path);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const casePayload: any = {
        title: caseTitle.trim(),
        description: caseDescription.trim(),
        image_url: finalImageUrl,
        // 移除 treatment_id，因為 cases 表中可能沒有此欄位
        // 關聯將透過標題匹配或關聯表處理
      };

      if (editingCaseId) {
        const { error } = await supabase.from('cases').update(casePayload).eq('id', editingCaseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('cases').insert([casePayload]).select('id').single();
        if (error) throw error;
        if (data) {
          setSelectedCaseIds(prev => Array.from(new Set([...prev, data.id])));
        }
      }

      setIsCaseModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error("Case Submit Error:", err);
      alert("案例儲存失敗: " + (err.message || "未知錯誤"));
    } finally {
      setSavingCase(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let finalImageUrl = existingImagePath;

      if (imageFile) {
        try {
          const fileName = `treatment-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
          const path = `treatments/${fileName}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from('icons').upload(path, imageFile, { contentType: 'image/webp', upsert: true });
          
          if (uploadErr) {
            console.error("Treatment Image Upload Error:", uploadErr);
            alert("療程圖片上傳失敗 (54001)，將僅儲存文字內容。");
          } else {
            const { data: publicUrlData } = supabase.storage.from('icons').getPublicUrl(uploadData.path);
            finalImageUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.error("Treatment Image Upload Exception:", uploadErr);
        }
      }

      const treatmentPayload: any = {
        title: title.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder) || 0,
        image_url: finalImageUrl || null,
      };
      
      let treatmentId = editingId;

      if (editingId) {
        // 檢查是否有實質變動，避免觸發資料庫遞迴更新 (stack depth limit 54001)
        const current = treatments.find(t => t.id === editingId);
        const hasChanged = !current || (
          current.title !== treatmentPayload.title ||
          current.description !== treatmentPayload.description ||
          current.sort_order !== treatmentPayload.sort_order ||
          current.image_url !== treatmentPayload.image_url
        );

        if (hasChanged) {
          const { error: tError } = await supabase
            .from('treatments')
            .update(treatmentPayload)
            .eq('id', editingId);
          
          if (tError) {
            console.error("Treatment Update Error:", tError);
            if (tError.code === '54001') {
              // 嘗試最小化更新，僅更新標題
              await supabase.from('treatments').update({ title: title.trim() }).eq('id', editingId);
            } else {
              throw tError;
            }
          }
        }
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

      // 第三步：同步改善項目關聯
      try {
        // 刪除舊關聯
        await supabase.from('treatment_improvement_categories').delete().eq('treatment_id', treatmentId);
        
        if (selectedCategoryIds.length > 0) {
          const rels = selectedCategoryIds.map(cid => ({
            treatment_id: treatmentId,
            category_id: cid
          }));
          const { error } = await supabase.from('treatment_improvement_categories').insert(rels);
          if (error) console.error("Insert categories error:", error);
        }
      } catch (cErr) {
        console.error("Categories sync error:", cErr);
      }

      // 第四步：同步案例關聯 - 使用正確的關聯表
try {
  // 使用 treatment_case_relations 作為案例與療程的關聯表
  await supabase.from('treatment_case_relations').delete().eq('treatment_id', treatmentId);
  
  if (selectedCaseIds.length > 0) {
    const caseRels = selectedCaseIds.map((cid, index) => ({
      treatment_id: treatmentId,
      case_id: cid,
      display_order: index,  // 依照勾選順序排序
      is_active: true
    }));
    const { error } = await supabase.from('treatment_case_relations').insert(caseRels);
    if (error) console.error("Insert case relations error:", error);
  }
} catch (caseErr) {
  console.error("Cases sync error:", caseErr);
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
      
      const categoryIds = t.treatment_improvement_categories?.map((rel: any) => rel.category_id) || [];
      setSelectedCategoryIds(categoryIds);

      setSelectedCaseIds(t.case_ids || []);
      

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
      setSelectedCaseIds([]);
      setIconName('Sparkles');
      setExistingImagePath(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const [caseSearch, setCaseSearch] = useState('');

  const filteredCases = allCases.filter(c => 
    c.title?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.description?.toLowerCase().includes(caseSearch.toLowerCase())
  );

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
                <th className="p-8">改善項目</th>
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
                    {t.category_names?.length || 0} 個項目
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
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><LucideIcons.Camera size={18}/> 術前術後案例關聯</h4>
                      <input 
                        placeholder="搜尋案例標題..." 
                        value={caseSearch} 
                        onChange={e => setCaseSearch(e.target.value)}
                        className="text-[10px] border-b bg-transparent outline-none focus:border-clinic-gold w-40"
                      />
                    </div>
                    <button type="button" onClick={() => openCaseModal()} className="text-clinic-gold flex items-center gap-1 font-black text-xs uppercase tracking-widest hover:underline"><PlusCircle size={20}/> 新增案例</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCases.length === 0 ? (
                      <div className="col-span-full p-10 text-center text-gray-300 font-bold italic border-2 border-dashed rounded-3xl">
                        {caseSearch ? '找不到符合搜尋的案例' : '目前尚無案例資料'}
                      </div>
                    ) : (
                      filteredCases.map(c => (
                        <div 
                          key={c.id} 
                          className={`p-4 rounded-3xl border-2 transition-all flex gap-4 items-center relative group ${
                            selectedCaseIds.includes(c.id) 
                              ? 'bg-clinic-gold/5 border-clinic-gold shadow-md' 
                              : 'bg-white border-gray-100 hover:border-amber-100'
                          }`}
                        >
                          <div onClick={() => toggleCase(c.id)} className="absolute inset-0 z-0 cursor-pointer"></div>
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border relative z-10">
                            {(c.before_image_url || c.image_url || c.image_path) ? (
                              <img src={c.before_image_url || c.image_url || c.image_path} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <LucideIcons.Image size={24} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className={`text-sm font-black truncate ${selectedCaseIds.includes(c.id) ? 'text-clinic-gold' : 'text-gray-700'}`}>
                              {c.title}
                            </div>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); openCaseModal(c); }}
                              className="mt-1 text-[10px] text-clinic-gold font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <Edit3 size={10} /> 編輯內容
                            </button>
                          </div>
                          <div onClick={() => toggleCase(c.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 cursor-pointer ${
                            selectedCaseIds.includes(c.id) ? 'bg-clinic-gold border-clinic-gold text-white' : 'border-gray-200'
                          }`}>
                            {selectedCaseIds.includes(c.id) && <LucideIcons.Check size={14} strokeWidth={4} />}
                          </div>
                        </div>
                      ))
                    )}
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

      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[70] p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">{editingCaseId ? '編輯案例內容' : '新增案例內容'}</h3>
              <button onClick={() => setIsCaseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleCaseSubmit} className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">案例標題</label>
                    <input required value={caseTitle} onChange={e => setCaseTitle(e.target.value)} className="input-field font-bold" placeholder="例如：皮秒雷射見證" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">案例描述</label>
                    <textarea value={caseDescription} onChange={e => setCaseDescription(e.target.value)} className="input-field h-32 resize-none text-sm" placeholder="描述案例的改善情況..." />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-full">案例圖片 (建議合併後的術前術後圖)</label>
                  <div 
                    onClick={() => caseFileInputRef.current?.click()} 
                    className="w-full aspect-[4/3] bg-gray-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 transition-all shadow-inner"
                  >
                    {caseImagePreview ? (
                      <img src={caseImagePreview} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <UploadCloud size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">點擊上傳</span>
                      </div>
                    )}
                    <input 
                      ref={caseFileInputRef} 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCaseImageFile(file);
                          setCaseImagePreview(URL.createObjectURL(file));
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                {editingCaseId && (
                  <button type="button" onClick={() => handleDeleteCase(editingCaseId)} className="p-4 border-2 border-red-100 text-red-400 rounded-2xl hover:bg-red-50 transition-all">
                    <Trash2 size={24} />
                  </button>
                )}
                <button type="button" onClick={() => setIsCaseModalOpen(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">取消</button>
                <button type="submit" disabled={savingCase} className="flex-[2] py-4 bg-clinic-gold text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-clinic-gold/30 flex items-center justify-center gap-2">
                  {savingCase ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {savingCase ? '儲存中...' : '確認儲存'}
                </button>
              </div>
            </form>
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
