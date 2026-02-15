'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit3, X, Loader2, Save, Tags, CheckSquare, Square, Calendar, Hash, Type, ImageIcon, UploadCloud, Scissors, Check } from 'lucide-react';
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

  // 設定輸出尺寸為 512x512
  canvas.width = 512;
  canvas.height = 512;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    512,
    512
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
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

  // Form states
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  // Image states
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('improvement_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) console.error("Fetch error:", error);
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
        if (existingImagePath) {
          await supabase.storage.from('icons').remove([existingImagePath]);
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const path = `improvement-categories/${editingId || 'new'}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('icons')
          .upload(path, iconImageFile, { contentType: 'image/webp' });

        if (uploadError) throw uploadError;
        finalImagePath = uploadData.path;
      }

      const payload: any = { 
        name: name.trim(), 
        icon_name: iconName.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder), 
        is_active: isActive, 
        icon_image_path: finalImagePath,
        icon_image_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      };
      
      const { error: dbError } = editingId 
        ? await supabase.from('improvement_categories').update(payload).eq('id', editingId)
        : await supabase.from('improvement_categories').insert([payload]);

      if (dbError) throw dbError;

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert("儲存失敗: " + err.message);
    } finally {
      setSaving(false);
    }
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
      } else {
        setImagePreview(null);
      }
    } else {
      setEditingId(null);
      setName('');
      setIconName('Sparkles');
      setDescription('');
      setSortOrder(categories.length + 1);
      setIsActive(true);
      setExistingImagePath(null);
      setImagePreview(null);
    }
    setIconImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: any) => {
    if (!confirm('確定要刪除此分類？')) return;
    if (cat.icon_image_path) {
      await supabase.storage.from('icons').remove([cat.icon_image_path]);
    }
    const { error } = await supabase.from('improvement_categories').delete().eq('id', cat.id);
    if (error) alert("刪除失敗: " + error.message);
    else fetchCategories();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('原始檔案太大，請選擇 2MB 以下的圖片');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      if (!cropImageSrc || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], "icon.webp", { type: "image/webp" });
      
      setIconImageFile(file);
      setImagePreview(URL.createObjectURL(croppedBlob));
      setShowCropper(false);
      setCropImageSrc(null);
    } catch (e) {
      console.error(e);
      alert('圖片處理失敗');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">欲改善項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">管理諮詢分類與規格化圖示 (自動裁切 512x512 WebP)</p>
        </div>
        <button onClick={() => openModal()} className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/20">
          <Plus size={24} /> 新增改善分類
        </button>
      </div>

      {loading ? (
        <div className="p-40 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase">載入分類數據中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-black text-gray-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-8 w-24">排序</th>
                <th className="p-8 w-24">圖示 (64x64)</th>
                <th className="p-8">分類名稱</th>
                <th className="p-8">狀態</th>
                <th className="p-8 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(c => {
                const imageUrl = c.icon_image_path 
                  ? `${supabase.storage.from('icons').getPublicUrl(c.icon_image_path).data.publicUrl}?t=${Date.parse(c.icon_image_updated_at || c.updated_at)}`
                  : null;

                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-8 font-mono text-gray-400 font-bold">{c.sort_order}</td>
                    <td className="p-8">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-clinic-gold font-bold text-[10px] uppercase">{c.icon_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-8 font-black text-lg text-gray-800">{c.name}</td>
                    <td className="p-8">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                        c.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        {c.is_active ? '顯示中' : '已隱藏'}
                      </span>
                    </td>
                    <td className="p-8 text-right flex justify-end gap-3">
                      <button onClick={() => openModal(c)} className="p-3 border rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-600"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(c)} className="p-3 border rounded-xl hover:bg-red-50 text-red-500 transition-all"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-fade-in my-auto overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-clinic-gold rounded-2xl flex items-center justify-center text-white shadow-lg"><Tags size={24} /></div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? '編輯改善項目' : '新增改善項目'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">分類名稱</label>
                   <input required value={name} onChange={e => setName(e.target.value)} className="input-field py-4 font-bold" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">顯示排序</label>
                   <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="input-field py-4 font-mono" />
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">圖示圖片 (系統將自動裁切正方形)</label>
                 <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square max-w-[200px] mx-auto bg-gray-50 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-clinic-gold/30 transition-all relative">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center space-y-2">
                        <UploadCloud size={48} className="mx-auto text-gray-200" />
                        <span className="text-gray-400 font-bold block text-xs">上傳圖示</span>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                 </div>
                 {imagePreview && (
                   <div className="flex justify-center gap-4">
                      <button type="button" onClick={() => { setImagePreview(null); setIconImageFile(null); setExistingImagePath(null); }} className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">
                        <Trash2 size={12} /> 移除圖片
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] text-clinic-gold font-black uppercase tracking-widest flex items-center gap-1">
                        <Scissors size={12} /> 重新裁切
                      </button>
                   </div>
                 )}
               </div>

               <button type="submit" disabled={saving} className="btn-gold w-full py-6 text-xl shadow-clinic-gold/30">
                 {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                 {saving ? '同步雲端中...' : '儲存分類設定'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* 圖片裁切彈窗 */}
      {showCropper && cropImageSrc && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-6 md:p-12">
           <div className="w-full max-w-2xl aspect-square relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
           </div>
           
           <div className="w-full max-w-2xl mt-8 space-y-8">
              <div className="flex items-center gap-6">
                <span className="text-white text-xs font-bold uppercase tracking-widest">縮放控制</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-clinic-gold"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowCropper(false); setCropImageSrc(null); }}
                  className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleCropSave}
                  className="flex-[2] py-5 bg-clinic-gold text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all"
                >
                  <Check size={24} /> 完成裁切並套用
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
