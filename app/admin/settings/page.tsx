
'use client';

import React, { useState, useEffect } from 'react';
import { getGeneralSettings, updateGeneralSettings } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ImageIcon, Save, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SystemSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [clinicName, setClinicName] = useState('亮立美學');
  const [clinicNameEn, setClinicNameEn] = useState('Radiant Clinic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchSettings();
    return () => { isMounted = false; };

    async function fetchSettings() {
      try {
        const settings = await getGeneralSettings();
        if (isMounted) {
          if (settings) {
            setLogoUrl(settings.logoUrl || '');
            setClinicName(settings.clinicName || '亮立美學');
            setClinicNameEn(settings.clinicNameEn || 'Radiant Clinic');
          }
        }
      } catch (e) {
        console.error("Fetch Settings Error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
  }, []);

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
    setSaving(true);
    setStatus(null);
    try {
      let finalLogoUrl = logoUrl;
      
      if (file) {
        finalLogoUrl = await uploadImageToCloudinary(file);
        setLogoUrl(finalLogoUrl);
      }
      
      // 過濾 undefined 確保 Firestore 寫入不報錯
      const updateData = JSON.parse(JSON.stringify({
        logoUrl: finalLogoUrl || '',
        clinicName: clinicName || '亮立美學',
        clinicNameEn: clinicNameEn || 'Radiant Clinic',
        updatedAt: new Date().toISOString()
      }));

      await updateGeneralSettings(updateData);
      setStatus({ type: 'success', msg: '設定已成功儲存至 Cloudinary 與 Firestore' });
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error("Save Settings Error:", error);
      setStatus({ type: 'error', msg: error.message || '儲存失敗' });
      alert(`錯誤詳情: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-6">
        <Loader2 className="animate-spin text-clinic-gold" size={64} />
        <p className="text-gray-400 font-medium animate-pulse tracking-widest uppercase">系統設定加載中</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 系統視覺設定</h2>
          <p className="text-gray-500 mt-2 font-medium">調整前台診所品牌視覺呈現</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => window.location.reload()}
            className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-clinic-gold transition-colors"
            title="重新整理"
          >
            <RefreshCw size={24} />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-gold px-12 py-5 text-lg disabled:opacity-50 flex items-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            儲存變更
          </button>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 shadow-sm animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          <span className="font-bold text-lg">{status.msg}</span>
        </div>
      )}

      <div className="glass-card p-12 space-y-12">
        <section className="space-y-8">
          <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
            <div className="w-14 h-14 bg-clinic-rose/20 rounded-2xl flex items-center justify-center text-clinic-gold">
              <ImageIcon size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">品牌識別 (Logo)</h3>
              <p className="text-gray-400 font-medium">系統將自動上傳至 Cloudinary 雲端優化</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="w-64 h-64 rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group cursor-pointer transition-all hover:border-clinic-gold/50">
              {(preview || logoUrl) ? (
                <img src={preview || logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-6" />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon size={64} className="text-gray-200 mx-auto" />
                  <p className="text-gray-300 text-sm font-bold uppercase tracking-widest">無圖片</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold uppercase tracking-widest">點擊更換圖片</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-8 w-full pt-4">
              <div className="space-y-3">
                <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] ml-1">診所名稱 (中文)</label>
                <input 
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="input-field py-5 px-6 text-xl"
                  placeholder="亮立美學"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] ml-1">診所名稱 (英文)</label>
                <input 
                  type="text"
                  value={clinicNameEn}
                  onChange={(e) => setClinicNameEn(e.target.value)}
                  className="input-field py-5 px-6 text-xl"
                  placeholder="Radiant Clinic"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-gray-50">
          <div className="bg-gray-50 p-6 rounded-3xl space-y-2 border border-gray-100">
             <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cloudinary 儲存網址 (唯讀)</label>
             <code className="block w-full break-all text-sm font-mono text-clinic-gold bg-white p-4 rounded-xl border border-gray-100">
               {logoUrl || '尚未設定網址'}
             </code>
          </div>
        </section>
      </div>
    </div>
  );
}
