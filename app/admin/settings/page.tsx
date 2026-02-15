
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ImageIcon, Save, CheckCircle2, Loader2, AlertCircle, RefreshCw, UploadCloud } from 'lucide-react';

export default function SystemSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [clinicName, setClinicName] = useState('亮立美學');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  // File handling
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // 抓取固定 ID 為 clinic_main 的設定資料
      const { data, error } = await supabase
        .from('settings')
        .select('logo_url, clinic_name')
        .eq('id', 'clinic_main')
        .single();

      if (error) {
        // 如果是找不到資料 (PGRST116)，不視為崩潰錯誤
        if (error.code !== 'PGRST116') {
          console.error("Supabase Error:", error);
          setStatus({ type: 'error', msg: '讀取資料失敗: ' + error.message });
        }
      }

      if (data) {
        setLogoUrl(data.logo_url || '');
        setClinicName(data.clinic_name || '亮立美學');
      }
    } catch (e: any) {
      console.error("Critical Fetch Error:", e);
      // 即使失敗也讓頁面保持可用
    } finally {
      setLoading(false);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setStatus(null);
    
    try {
      let finalLogoUrl = logoUrl;
      
      // 1. 如果有新檔案，先上傳至 Cloudinary
      if (file) {
        try {
          finalLogoUrl = await uploadImageToCloudinary(file);
          setLogoUrl(finalLogoUrl);
        } catch (uploadErr: any) {
          throw new Error(`圖片上傳失敗: ${uploadErr.message}`);
        }
      }
      
      // 2. 準備 Payload，嚴格對應 SQL 欄位 (logo_url, clinic_name)
      const payload = {
        id: 'clinic_main', // 固定 ID 確保單一紀錄
        logo_url: finalLogoUrl,
        clinic_name: clinicName,
        updated_at: new Date().toISOString()
      };

      // 3. 執行 upsert
      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setStatus({ type: 'success', msg: '診所設定已同步至雲端' });
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error("Save Error:", error);
      setStatus({ type: 'error', msg: error.message || '儲存失敗，請檢查權限或欄位設定' });
    } finally {
      setSaving(false); // 確保不論成功失敗都會停止轉圈
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 gap-4">
        <Loader2 className="animate-spin text-clinic-gold" size={64} />
        <p className="text-gray-400 font-bold tracking-widest uppercase">載入系統配置中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">品牌視覺管理</h2>
          <p className="text-gray-500 mt-2 font-medium">調整前台 iPad 顯示之診所 Logo 與名稱</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="p-4 bg-white border rounded-2xl text-gray-400 hover:text-clinic-gold transition-colors"
          >
            <RefreshCw size={24} />
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn-gold px-12 py-5 text-lg disabled:opacity-50 disabled:grayscale transition-all"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {saving ? '正在同步雲端' : '儲存變更'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 shadow-sm animate-fade-in ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          <span className="font-bold text-lg">{status.msg}</span>
        </div>
      )}

      <div className="glass-card p-12 space-y-12">
        <section className="flex flex-col md:flex-row gap-12 items-start">
          {/* Logo 上傳區域 */}
          <div 
            onClick={handleBoxClick}
            className="w-64 h-64 rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-clinic-gold/30 transition-all shadow-inner"
          >
            {(preview || logoUrl) ? (
              <img src={preview || logoUrl} alt="Logo" className="w-full h-full object-contain p-6" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon size={64} className="text-gray-200" />
                <span className="text-gray-300 font-bold text-xs">點擊上傳</span>
              </div>
            )}
            
            {/* 隱藏的檔案輸入 */}
            <input 
              ref={fileInputRef}
              type="file" 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black tracking-widest">
              <UploadCloud size={32} className="mb-1" />
              更換品牌 LOGO
            </div>
          </div>

          <div className="flex-1 space-y-8 w-full">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">診所對外名稱 (clinic_name)</label>
              <input 
                type="text"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                className="input-field text-xl py-5 font-bold"
                placeholder="例：亮立美學診所"
              />
            </div>
            
            <div className="p-8 bg-clinic-cream/50 rounded-3xl border border-clinic-gold/10 space-y-2">
               <label className="block text-[10px] font-black text-clinic-gold uppercase tracking-[0.2em]">目前圖片雲端路徑 (logo_url)</label>
               <div className="font-mono text-[10px] break-all text-gray-400 leading-relaxed">
                 {logoUrl || '尚未設定任何圖片'}
               </div>
            </div>
          </div>
        </section>

        <div className="pt-8 border-t border-gray-100">
          <div className="flex items-start gap-4 text-gray-400 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <AlertCircle className="shrink-0 mt-1" size={20} />
            <div className="text-xs space-y-2 leading-relaxed">
              <p className="font-bold text-gray-500 uppercase tracking-widest">資料同步說明</p>
              <p>1. 本頁面設定會影響 iPad 諮詢系統首頁與後台側邊欄的視覺。 </p>
              <p>2. 圖片上傳將透過 Cloudinary 提供 CDN 高速訪問服務。</p>
              <p>3. 所有變更將即時同步至 Supabase <code>settings</code> 資料表 (ID: clinic_main)。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
