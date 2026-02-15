
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AestheticCase } from '@/types';
import { Plus, Trash2, Image as ImageIcon, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function AestheticCasesPage() {
  const [cases, setCases] = useState<AestheticCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'cases');
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AestheticCase));
      setCases(list.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      alert('請務必選擇術前與術後兩張圖片');
      return;
    }

    setUploading(true);
    try {
      // 1. 同步上傳兩張圖至 Cloudinary
      const beforeUrl = await uploadImageToCloudinary(beforeFile);
      const afterUrl = await uploadImageToCloudinary(afterFile);

      // 2. 存入 Firestore
      await addDoc(collection(db, 'cases'), {
        title,
        treatmentName,
        beforeImageUrl: beforeUrl,
        afterImageUrl: afterUrl,
        createdAt: serverTimestamp()
      });

      closeModal();
      fetchCases();
    } catch (error) {
      console.error(error);
      alert('上傳失敗，請確認 Cloudinary 設定');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此案例嗎？')) {
      await deleteDoc(doc(db, 'cases', id));
      fetchCases();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setTreatmentName('');
    setBeforeFile(null);
    setAfterFile(null);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">術前術後案例管理</h2>
          <p className="text-gray-500 mt-1">建立專業的美麗見證</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gold px-8 py-4"
        >
          <Plus size={20} /> 新增對比案例
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-32">
          <Loader2 className="animate-spin text-clinic-gold" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {cases.map((c) => (
            <div key={c.id} className="glass-card overflow-hidden group">
              <div className="flex border-b border-gray-100">
                <div className="flex-1 h-48 relative overflow-hidden bg-gray-100 border-r border-gray-100">
                  <img src={c.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded">BEFORE</div>
                </div>
                <div className="flex-1 h-48 relative overflow-hidden bg-gray-100">
                  <img src={c.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-clinic-gold text-white text-[10px] font-bold rounded shadow-lg">AFTER</div>
                </div>
              </div>
              <div className="p-6 relative">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-clinic-gold font-bold">{c.treatmentName}</span>
                  <h4 className="text-xl font-bold text-gray-800">{c.title}</h4>
                </div>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          
          {cases.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center glass-card border-dashed border-2 border-gray-200">
              <ImageIcon size={64} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-light text-xl">目前尚無案例，點擊上方按鈕開始新增</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-clinic-cream">
              <div className="flex items-center gap-3">
                <Sparkles className="text-clinic-gold" size={24} />
                <h3 className="text-2xl font-bold text-gray-800">新增美麗案例</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={28} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">案例標題</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="例如：改善雙頰凹陷..." />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">對應療程</label>
                  <input required value={treatmentName} onChange={e => setTreatmentName(e.target.value)} className="input-field" placeholder="例如：皮秒雷射" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> 術前照片 (Before)
                  </label>
                  <div className="aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                    {beforeFile ? (
                      <img src={URL.createObjectURL(beforeFile)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={40} className="mx-auto text-gray-300 mb-2" />
                        <span className="text-sm text-gray-400">點擊上傳</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setBeforeFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2 text-clinic-gold">
                    <span className="w-2 h-2 rounded-full bg-clinic-gold"></span> 術後照片 (After)
                  </label>
                  <div className="aspect-[4/3] bg-gray-50 border-2 border-dashed border-clinic-gold/30 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                    {afterFile ? (
                      <img src={URL.createObjectURL(afterFile)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={40} className="mx-auto text-clinic-gold/30 mb-2" />
                        <span className="text-sm text-gray-400">點擊上傳</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setAfterFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-clinic-gold/5 rounded-2xl flex items-start gap-4 border border-clinic-gold/10">
                <AlertCircle className="text-clinic-gold shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-clinic-dark/70 italic">圖片將會直接上傳至 Cloudinary 伺服器，並自動優化壓縮，以確保系統流暢度。</p>
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="btn-gold w-full py-6 text-xl"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    正在同步雲端圖片...
                  </>
                ) : (
                  '發布美麗案例'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
