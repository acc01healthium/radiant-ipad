
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit3, X, Loader2, Save, Tags, CheckSquare, Square, Calendar, Hash, Type, ImageIcon, UploadCloud, Scissors, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';

// 圖片處理工具函數 (省略，保持不變)
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
  canvas.width = 512;
  canvas.height = 512;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, 512, 512
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(blob);
    }, 'image/webp', 0.9);
  });
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('improvement_categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let finalImagePath = existingImagePath;
      if (iconImageFile) {
        if (existingImagePath) await supabase.storage.from('icons').remove([existingImagePath]);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const path = `improvement-categories/${editingId || 'new'}/${fileName}`;
        const { data: uploadData, error } = await supabase.storage.from('icons').upload(path, iconImageFile, { contentType: 'image/webp' });
        if (error) throw error;
        finalImagePath = uploadData.path;
      }
      const payload = { 
        name: name.trim(), 
        icon_name: iconName.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder), 
        is_active: isActive, 
        icon_image_path: finalImagePath,
        icon_image_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      };
      const { error } = editingId ? await supabase.from('improvement_categories').update(payload).eq('id', editingId) : await supabase.from('improvement_categories').insert([payload]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) { alert("儲存失敗: " + err.message); } finally { setSaving(false); }
  };

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name || '');
      setIconName(cat.icon_name || 'Sparkles');
      setDescription(cat.description || '');
      setSortOrder(cat.sort_order || 0);
      setIsActive(cat.is_active ?? true);
      setExistingImagePath(cat.icon_image_path || null);
      if (cat.icon_image_path) {
        const { data } = supabase.storage.from('icons').getPublicUrl(cat.icon_image_path);
        setImagePreview(`${data.publicUrl}?t=${cat.icon_image_updated_at ? Date.parse(cat.icon_image_updated_at) : Date.now()}`);
      } else setImagePreview(null);
    } else {
      setEditingId(null); setName(''); setIconName('Sparkles'); setDescription(''); setSortOrder(categories.length + 1); setIsActive(true); setExistingImagePath(null); setImagePreview(null);
    }
    setIconImageFile(null);
    setIsModalOpen(true);
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
    setIconImageFile(new File([croppedBlob], "icon.webp", { type: "image/webp" }));
    setImagePreview(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">欲改善項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">管理諮詢分類與圖示</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/20">
          <Plus size={24} /> 新增分類
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs tracking-widest uppercase">
              <tr>
                <th className="p-8 w-24">排序</th>
                <th className="p-8 w-24">圖示</th>
                <th className="p-8">分類名稱</th>
                <th className="p-8">狀態</th>
                <th className="p-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-8 font-mono text-gray-400 font-bold">{c.sort_order}</td>
                  <td className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border flex items-center justify-center overflow-hidden">
                      {c.icon_image_path ? <img src={supabase.storage.from('icons').getPublicUrl(c.icon_image_path).data.publicUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-clinic-gold font-bold">{c.icon_name}</span>}
                    </div>
                  </td>
                  <td className="p-8 font-black text-lg text-gray-800">{c.name}</td>
                  <td className="p-8"><span className={`px-4 py-1 rounded-full text-[10px] font-black border shadow-sm ${c.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>{c.is_active ? '顯示中' : '已隱藏'}</span></td>
                  <td className="p-8 text-right flex justify-end gap-3">
                    <button onClick={() => openModal(c)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-600"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('確定要刪除？')) { await supabase.from('improvement_categories').delete().eq('id', c.id); fetchCategories(); } }} className="p-3 border rounded-xl hover:bg-red-50 text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
          <div className="bg-white w-[min(1100px,calc(100vw-48px))] max-w-none rounded-[3rem] shadow-2xl animate-fade-in flex flex-col max-h-[calc(100dvh-48px)] overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream sticky top-0 z-10 shrink-0">
              <h3 className="text-2xl font-black text-gray-800">{editingId ? '編輯項目' : '新增項目'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">分類名稱</label>
                     <input required value={name} onChange={e => setName(e.target.value)} className="input-field font-bold" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">顯示排序</label>
                     <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field font-mono" />
                   </div>
                 </div>
                 <div className="space-y-4 flex flex-col items-center">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest w-full">圖示圖片 (512x512)</label>
                   <div onClick={() => fileInputRef.current?.click()} className="w-64 h-64 bg-gray-50 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 transition-all shadow-inner">
                      {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="" /> : <UploadCloud size={48} className="text-gray-200" />}
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </div>
                 </div>
               </div>
               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/30">
                 {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? '儲存中...' : '儲存分類'}
               </button>
            </form>
          </div>
        </div>
      )}

      {showCropper && cropImageSrc && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-12">
           <div className="w-full max-w-2xl aspect-square relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={1 / 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
           </div>
           <div className="w-full max-w-2xl mt-8 flex gap-4">
              <button onClick={() => setShowCropper(false)} className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-bold">取消</button>
              <button onClick={handleCropSave} className="flex-[2] py-5 bg-clinic-gold text-white rounded-2xl font-black text-xl">完成裁切</button>
           </div>
        </div>
      )}
    </div>
  );
}
