
'use client';

import React, { useState, useEffect } from 'react';
import { getGeneralSettings, updateGeneralSettings, uploadFile } from '@/lib/firebase';
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
      if (file) {
        finalLogoUrl = await uploadFile(file, `settings/logo_${Date.now()}_${file.name}`);
        setLogoUrl(finalLogoUrl);
      }
      await updateGeneralSettings({ logoUrl: finalLogoUrl });
      setStatus({ type: 'success', msg: '設定已成功儲存' });
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: '儲存失敗，請重試' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" size={40} /></div>;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">系統設定</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-black transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          儲存變更
        </button>
      </div>

      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {status.msg}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon size={22} className="gold-text" />
            首頁 LOGO 設定
          </h3>
          <p className="text-gray-500 text-sm">此圖片將顯示在諮詢系統的首頁正中央。</p>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 h-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {(preview || logoUrl) ? (
                <img src={preview || logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={48} className="text-gray-300" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">上傳新圖片</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#F8E8FF] file:text-[#D4AF37] hover:file:bg-[#F0D0FF]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">或是輸入圖片網址</label>
                <input 
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-[#E0B0FF] focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">診所資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">診所中文名稱</label>
              <input type="text" defaultValue="亮立美學" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">診所英文名稱</label>
              <input type="text" defaultValue="Radiant Clinic" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
