
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { ImageIcon, Save, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SystemSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [clinicName, setClinicName] = useState('亮立美學');
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
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'general')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLogoUrl(data.logo_url || '');
        setClinicName(data.clinic_name || '亮立美學');
      }
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
      setStatus({ type: 'error', msg: '讀取資料失敗: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      let finalLogoUrl = logoUrl;
      
      if (file) {
        // 使用您指定的 Preset: radiant_ipad
        finalLogoUrl = await uploadImageToCloudinary(file);
        setLogoUrl(finalLogoUrl);
      }
      
      const payload = {
        id: 'general',
        logo_url: finalLogoUrl,
        clinic_name: clinicName,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setStatus({ type: 'success', msg: '設定已同步儲存至 Supabase' });
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error("Supabase Save Error:", error);
      setStatus({ type: 'error', msg: error.message || '儲存失敗' });
    } finally {
      setSaving(false); // 確保轉圈圈必停止
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

  if (loading) return <div className="flex flex-col items-center justify-center p-40 gap-4"><Loader2 className="animate-spin text-clinic-gold" size={64} /><p className="text-gray-400">系統設定載入中...</p></div>;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 系統視覺設定</h2>
          <p className="text-gray-500 mt-2 font-medium">調整前台診所 Logo 與名稱</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="p-4 bg-white border rounded-2xl text-gray-400 hover:text-clinic-gold"><RefreshCw size={24} /></button>
          <button onClick={handleSave} disabled={saving} className="btn-gold px-12 py-5 text-lg disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {saving ? '同步雲端中' : '儲存變更'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 shadow-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          <span className="font-bold text-lg">{status.msg}</span>
        </div>
      )}

      <div className="glass-card p-12 space-y-12">
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-64 h-64 rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
            {(preview || logoUrl) ? (
              <img src={preview || logoUrl} alt="Logo" className="w-full h-full object-contain p-6" />
            ) : (
              <ImageIcon size={64} className="text-gray-200" />
            )}
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold uppercase tracking-widest">更換 Logo</span>
            </div>
          </div>
          <div className="flex-1 space-y-8 w-full">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">診所名稱 (clinic_name)</label>
              <input 
                type="text"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                className="input-field text-xl py-5"
                placeholder="例：亮立美學"
              />
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
               <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">目前 Logo 雲端路徑 (logo_url)</label>
               <code className="text-xs text-clinic-gold break-all font-mono">{logoUrl || '尚未上傳任何圖片'}</code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
