
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found

      if (data) {
        setLogoUrl(data.logoUrl || '');
        setClinicName(data.clinicName || '亮立美學');
        setClinicNameEn(data.clinicNameEn || 'Radiant Clinic');
      }
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
      alert(`載入失敗: ${e.message}`);
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
        finalLogoUrl = await uploadImageToCloudinary(file);
        setLogoUrl(finalLogoUrl);
      }
      
      const payload = {
        id: 'general',
        logoUrl: finalLogoUrl,
        clinicName,
        clinicNameEn,
        updatedAt: new Date().toISOString()
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
      alert(`錯誤詳情: ${error.message}`);
    } finally {
      setSaving(false);
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

  if (loading) return <div className="flex justify-center p-40"><Loader2 className="animate-spin text-clinic-gold" size={64} /></div>;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 系統視覺 (Supabase)</h2>
          <p className="text-gray-500 mt-2 font-medium">基於 Supabase 雲端資料庫儲存</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-gold px-12 py-5 text-lg disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          儲存變更
        </button>
      </div>

      {status && (
        <div className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {status.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          <span className="font-bold text-lg">{status.msg}</span>
        </div>
      )}

      <div className="glass-card p-12 space-y-12">
        <section className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-64 h-64 rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
            {(preview || logoUrl) ? (
              <img src={preview || logoUrl} alt="Logo" className="w-full h-full object-contain p-6" />
            ) : (
              <ImageIcon size={64} className="text-gray-200" />
            )}
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
          </div>
          <div className="flex-1 space-y-8 w-full">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">診所名稱 (中)</label>
              <input value={clinicName} onChange={e => setClinicName(e.target.value)} className="input-field text-xl py-5" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">診所名稱 (英)</label>
              <input value={clinicNameEn} onChange={e => setClinicNameEn(e.target.value)} className="input-field text-xl py-5" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
