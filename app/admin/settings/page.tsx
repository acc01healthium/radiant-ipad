
'use client';

import React, { useState, useEffect } from 'react';
import { getGeneralSettings, updateGeneralSettings } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Image as ImageIcon, Save, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function SystemSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings = await getGeneralSettings();
      if (settings) {
        setLogoUrl(settings.logoUrl || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    setSaving(true);
    setStatus(null);
    try {
      let finalLogoUrl = logoUrl;
      
      // 如果有選擇新檔案，則上傳至 Cloudinary
      if (file) {
        finalLogoUrl = await uploadImageToCloudinary(file);
        setLogoUrl(finalLogoUrl);
      }
      
      await updateGeneralSettings({ logoUrl: finalLogoUrl });
      setStatus({ type: 'success', msg: '設定已成功儲存至資料庫與 Cloudinary' });
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', msg: error.message || '儲存失敗，請檢查環境變數設定' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" size={40} /></div>;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">系統設定</h2>
          <p className="text-gray-500 mt-1">自定義您的診所品牌視覺與雲端儲存</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-gold px-10"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          儲存變更
        </button>
      </div>

      {status && (
        <div className={`flex items-center gap-3 p-5 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-medium">{status.msg}</span>
        </div>
      )}

      <div className="glass-card p-10 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="p-3 bg-clinic-rose/10 rounded-xl text-clinic-gold">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">首頁 Logo 設定</h3>
              <p className="text-gray-400 text-sm italic">此圖片將透過 Cloudinary 雲端優化載入</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="w-56 h-56 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
              {(preview || logoUrl) ? (
                <img src={preview || logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
              ) : (
                <ImageIcon size={48} className="text-gray-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold uppercase tracking-widest">預覽模式</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">上傳新檔案 (Cloudinary)</label>
                <div className="relative">
                   <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#F8E8FF] file:text-[#D4AF37] hover:file:bg-[#F0D0FF] cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">目前圖片網址</label>
                <input 
                  type="text" 
                  value={logoUrl}
                  readOnly
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 text-sm outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 pt-4">
          <h3 className="text-xl font-bold text-gray-800">基礎資訊 (唯讀)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-widest ml-1">診所中文名稱</label>
              <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500">亮立美學</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-widest ml-1">英文名稱</label>
              <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500">Radiant Clinic</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
