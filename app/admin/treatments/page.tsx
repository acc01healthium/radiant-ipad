
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Treatment, CategoryType } from '@/types';
// Added Save icon to imports
import { Plus, Trash2, Edit3, ImageIcon, X, Loader2, Sparkles, DollarSign, Save } from 'lucide-react';

export default function TreatmentListPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedCats, setSelectedCats] = useState<CategoryType[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'treatments'));
      const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Treatment));
      setTreatments(list);
    } catch (e) {
      console.error("Fetch Treatments Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCat = (cat: CategoryType) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = '';

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      // 過濾 undefined 確保 Firestore 穩定
      const baseData = {
        name: name || '未命名療程',
        price: Number(price) || 0,
        description: description || '',
        categories: selectedCats || [],
        updatedAt: new Date().toISOString()
      };

      const finalData = JSON.parse(JSON.stringify({
        ...baseData,
        ...(imageUrl && { imageUrl })
      }));

      if (editingId) {
        await updateDoc(doc(db, 'treatments', editingId), finalData);
      } else {
        await addDoc(collection(db, 'treatments'), finalData);
      }

      closeModal();
      await fetchTreatments();
      alert('療程儲存成功');
    } catch (err: any) {
      console.error("Save Treatment Error:", err);
      alert(`儲存失敗: ${err.message}`);
    } finally {
      setUploading(false); // 關鍵：確保轉圈停止
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此療程嗎？數據將無法復原。')) {
      try {
        await deleteDoc(doc(db, 'treatments', id));
        fetchTreatments();
      } catch (e: any) {
        alert('刪除失敗: ' + e.message);
      }
    }
  };

  const openModal = (t?: Treatment) => {
    if (t) {
      setEditingId(t.id);
      setName(t.name);
      setPrice(t.price);
      setDescription(t.description);
      setSelectedCats(t.categories);
      setPreview(t.imageUrl || null);
    } else {
      setEditingId(null);
      setName('');
      setPrice(0);
      setDescription('');
      setSelectedCats([]);
      setPreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
    setPreview(null);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">亮立美學 - 療程項目管理</h2>
          <p className="text-gray-500 mt-2 font-medium">管理展示給顧客的所有美學方案</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-gold px-12 py-5 text-lg shadow-clinic-gold/30"
        >
          <Plus size={24} /> 新增療程
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 space-y-4">
          <Loader2 className="animate-spin text-clinic-gold" size={64} />
          <p className="text-gray-400 font-bold tracking-widest uppercase animate-pulse">數據讀取中</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">療程主視覺</th>
                  <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">療程資訊</th>
                  <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">困擾分類</th>
                  <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">定價</th>
                  <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-right">操作管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                    <td className="p-8">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-md bg-gray-100 border-2 border-white">
                        <img src={t.imageUrl || 'https://picsum.photos/seed/placeholder/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t.name} />
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-1">
                        <span className="font-black text-gray-800 text-2xl group-hover:text-clinic-gold transition-colors">{t.name}</span>
                        <p className="text-gray-400 text-sm line-clamp-1 italic">{t.description}</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex gap-2 flex-wrap">
                        {t.categories.map(c => (
                          <span key={c} className="text-[10px] px-4 py-2 bg-[#F8E8FF] gold-text rounded-full font-black uppercase tracking-widest border border-white shadow-sm">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="text-2xl font-black text-clinic-gold">NT$ {t.price.toLocaleString()}</span>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => openModal(t)} className="p-4 bg-white shadow-lg border border-gray-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all"><Edit3 size={20} /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-4 bg-white shadow-lg border border-gray-100 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all"><Trash2 size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {treatments.length === 0 && (
              <div className="p-32 text-center flex flex-col items-center space-y-4">
                <Sparkles size={64} className="text-gray-100" />
                <p className="text-gray-400 text-xl font-light">目前尚無療程項目，點擊上方按鈕開始新增。</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in my-auto">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rose-gold-gradient rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">{editingId ? '編輯療程內容' : '建立全新療程'}</h3>
              </div>
              <button onClick={closeModal} className="p-4 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">療程名稱</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="input-field py-5 px-6 text-xl" placeholder="例：皮秒雷射" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">定價 (NT$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-clinic-gold" size={24} />
                    <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field py-5 pl-14 pr-6 text-xl" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">肌膚困擾分類 (可多選)</label>
                <div className="flex flex-wrap gap-4">
                  {Object.values(CategoryType).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleToggleCat(cat)}
                      className={`px-8 py-4 rounded-[1.5rem] border-2 transition-all font-bold text-lg ${selectedCats.includes(cat) ? 'bg-clinic-rose text-white border-clinic-rose shadow-clinic-rose/30 scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-clinic-rose/50 hover:text-clinic-rose'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">詳細介紹</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-40 resize-none py-6 px-6 text-lg leading-relaxed" placeholder="請填寫療程的原理、特色與術後效果..." />
              </div>

              <div className="space-y-6">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">療程主視覺 (Cloudinary)</label>
                 <div className="flex items-center gap-10">
                    <div className="w-40 h-40 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2rem] flex items-center justify-center overflow-hidden relative group shrink-0">
                       {preview ? (
                         <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                       ) : (
                         <ImageIcon size={40} className="text-gray-200" />
                       )}
                       <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-gray-500 font-bold">點擊左側虛線框選擇圖片</p>
                       <p className="text-gray-400 text-sm">建議尺寸: 800x600px | 格式: JPG, PNG</p>
                    </div>
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
                      同步雲端與資料庫中...
                    </>
                  ) : (
                    <>
                      <Save size={32} />
                      確認儲存療程項目
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
