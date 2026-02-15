
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AestheticCase } from '@/types';
import { Plus, Trash2, ImageIcon, X, Loader2, Sparkles, AlertCircle, Camera } from 'lucide-react';

export default function AestheticCasesPage() {
  const [cases, setCases] = useState<AestheticCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'cases');
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AestheticCase));
      setCases(list.sort((a,b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      }));
    } catch (e) {
      console.error("Fetch Cases Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (type === 'before') {
        setBeforeFile(file);
        reader.onloadend = () => setBeforePreview(reader.result as string);
      } else {
        setAfterFile(file);
        reader.onloadend = () => setAfterPreview(reader.result as string);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      alert('請務必選擇「術前」與「術後」兩張圖片！');
      return;
    }

    setUploading(true);
    try {
      // 1. 同步執行 Cloudinary 上傳
      console.log("Uploading case images...");
      const beforeUrl = await uploadImageToCloudinary(beforeFile);
      const afterUrl = await uploadImageToCloudinary(afterFile);

      // 2. 準備 Firestore 數據並過濾 undefined
      const caseData = JSON.parse(JSON.stringify({
        title: title || '未命名案例',
        treatmentName: treatmentName || '通用療程',
        beforeImageUrl: beforeUrl,
        afterImageUrl: afterUrl,
        createdAt: new Date(), // 使用 JS Date 作為備案，Firestore serverTimestamp 也可以
        timestamp: serverTimestamp()
      }));

      await addDoc(collection(db, 'cases'), caseData);
      
      alert('案例發布成功！');
      closeModal();
      await fetchCases();
    } catch (error: any) {
      console.error("Save Case Error:", error);
      alert(`案例發布失敗: ${error.message}`);
    } finally {
      setUploading(false); // 關鍵：確保 UI 恢復正常
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要永久刪除此對比案例嗎？')) {
      try {
        await deleteDoc(doc(db, 'cases', id));
        fetchCases();
      } catch (e: any) {
        alert('刪除失敗: ' + e.message);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setTreatmentName('');
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview(null);
    setAfterPreview(null);
    setUploading(false);
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 術前術後案例</h2>
          <p className="text-gray-500 mt-2 font-medium">展示真實的效果對比，建立品牌信任度</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gold px-12 py-5 text-lg"
        >
          <Plus size={24} /> 新增美麗見證
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 space-y-6">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase animate-pulse">案例讀取中</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {cases.map((c) => (
            <div key={c.id} className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <div className="flex-1 h-60 relative overflow-hidden border-r border-gray-100 group-hover:bg-white transition-colors">
                  <img src={c.beforeImageUrl} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 text-white text-[10px] font-black rounded-lg backdrop-blur-md">BEFORE</div>
                </div>
                <div className="flex-1 h-60 relative overflow-hidden group-hover:bg-white transition-colors">
                  <img src={c.afterImageUrl} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-clinic-gold text-white text-[10px] font-black rounded-lg shadow-lg">AFTER</div>
                </div>
              </div>
              <div className="p-8 relative bg-white">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-clinic-gold font-black bg-[#FDFBF7] px-3 py-1 rounded-full border border-clinic-gold/20">{c.treatmentName}</span>
                  <h4 className="text-2xl font-black text-gray-800 mt-3 group-hover:text-clinic-gold transition-colors leading-tight">{c.title}</h4>
                </div>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="absolute top-8 right-8 p-3 text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          ))}
          
          {cases.length === 0 && (
            <div className="col-span-full py-48 flex flex-col items-center justify-center glass-card border-dashed border-4 border-gray-100 bg-transparent">
              <Camera size={80} className="text-gray-100 mb-6" />
              <p className="text-gray-400 font-bold text-2xl tracking-widest">目前尚無案例數據</p>
              <p className="text-gray-300 mt-2">快去新增您的第一個術前後對比吧！</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-10 border-b flex justify-between items-center bg-clinic-cream">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-clinic-gold rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Camera size={28} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-gray-800 tracking-tight">新增專業案例對比</h3>
                   <p className="text-gray-400 text-sm font-medium">請確保圖片清晰以達到最佳展示效果</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-4 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">案例標題 / 改善重點</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="input-field py-5 px-6 text-xl" placeholder="例：改善眼周細紋與淚溝" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">所用療程方案</label>
                  <input required value={treatmentName} onChange={e => setTreatmentName(e.target.value)} className="input-field py-5 px-6 text-xl" placeholder="例：皮秒雷射 + 玻尿酸" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-gray-300"></span> 術前照片 (Before)
                  </label>
                  <div className="aspect-square bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-clinic-gold/30 transition-all shadow-inner">
                    {beforePreview ? (
                      <img src={beforePreview} className="w-full h-full object-cover" alt="Before Preview" />
                    ) : (
                      <div className="text-center p-10 space-y-3">
                        <ImageIcon size={64} className="mx-auto text-gray-200" />
                        <span className="text-gray-400 font-bold block">點擊選擇術前照片</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileChange(e, 'before')} />
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-xs font-black text-clinic-gold uppercase tracking-[0.2em] ml-2 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-clinic-gold shadow-sm"></span> 術後照片 (After)
                  </label>
                  <div className="aspect-square bg-gray-50 border-4 border-dashed border-clinic-gold/20 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-clinic-gold/50 transition-all shadow-inner">
                    {afterPreview ? (
                      <img src={afterPreview} className="w-full h-full object-cover" alt="After Preview" />
                    ) : (
                      <div className="text-center p-10 space-y-3">
                        <ImageIcon size={64} className="mx-auto text-clinic-gold/20" />
                        <span className="text-gray-400 font-bold block">點擊選擇術後照片</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileChange(e, 'after')} />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-clinic-gold/5 rounded-3xl flex items-start gap-6 border-2 border-dashed border-clinic-gold/20">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-clinic-gold shadow-sm shrink-0">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-clinic-dark">關於圖片隱私與上傳</p>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">圖片將直接上傳至 Cloudinary 雲端優化載入性能。發布後將同步存儲至 Firestore 資料庫，請確保已取得顧客肖像權授權。</p>
                </div>
              </div>

              <div className="pt-6">
                 <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn-gold w-full py-8 text-2xl font-black shadow-clinic-gold/40 flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={32} />
                      同步同步雲端數據中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={32} />
                      發布美麗對比見證
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
