
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Treatment, CategoryType } from '@/types';
import { Plus, Trash2, Edit3, Image as ImageIcon, X, Loader2 } from 'lucide-react';

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
      console.error(e);
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

      const data = {
        name,
        price,
        description,
        categories: selectedCats,
        ...(imageUrl && { imageUrl })
      };

      if (editingId) {
        await updateDoc(doc(db, 'treatments', editingId), data);
      } else {
        await addDoc(collection(db, 'treatments'), data);
      }

      closeModal();
      fetchTreatments();
    } catch (err) {
      alert('圖片上傳或存檔失敗，請確認 Cloudinary 與 Firebase 連線。');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此療程嗎？')) {
      await deleteDoc(doc(db, 'treatments', id));
      fetchTreatments();
    }
  };

  const openModal = (t?: Treatment) => {
    if (t) {
      setEditingId(t.id);
      setName(t.name);
      setPrice(t.price);
      setDescription(t.description);
      setSelectedCats(t.categories);
    } else {
      setEditingId(null);
      setName('');
      setPrice(0);
      setDescription('');
      setSelectedCats([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">療程項目管理</h2>
          <p className="text-gray-500 mt-1">管理您向顧客展示的所有美學方案</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-gold px-8"
        >
          <Plus size={20} /> 新增療程
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">療程主視覺</th>
              <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">療程名稱</th>
              <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">困擾分類</th>
              <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">價格 (NT$)</th>
              <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {treatments.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="p-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                    <img src={t.imageUrl || 'https://picsum.photos/100'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </td>
                <td className="p-6">
                  <span className="font-bold text-gray-800 text-lg">{t.name}</span>
                </td>
                <td className="p-6">
                  <div className="flex gap-2 flex-wrap">
                    {t.categories.map(c => (
                      <span key={c} className="text-[10px] px-3 py-1 bg-[#F8E8FF] gold-text rounded-full font-bold uppercase tracking-widest border border-white shadow-sm">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-xl font-bold text-clinic-gold">{t.price.toLocaleString()}</span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(t)} className="p-3 bg-white shadow-md border border-gray-100 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-3 bg-white shadow-md border border-gray-100 text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {treatments.length === 0 && !loading && (
          <div className="p-20 text-center text-gray-400">目前尚無療程項目。</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-800">{editingId ? '編輯療程內容' : '新增全新療程'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={28} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">療程名稱</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="例如：皮秒雷射" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">定價 (NT$)</label>
                  <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">對應肌膚困擾 (多選)</label>
                <div className="flex flex-wrap gap-4 pt-2">
                  {Object.values(CategoryType).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleToggleCat(cat)}
                      className={`px-6 py-3 rounded-2xl border-2 transition-all font-medium ${selectedCats.includes(cat) ? 'bg-clinic-rose text-white border-clinic-rose shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-clinic-rose/30'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">詳細簡介</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field h-32 resize-none pt-4" placeholder="請描述療程特色、原理與預期效果..." />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">療程主視覺 (Cloudinary)</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-clinic-rose/10 hover:border-clinic-rose/30 transition-all text-gray-500 font-medium">
                    <ImageIcon size={24} className="text-clinic-gold" />
                    選擇檔案
                    <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  {imageFile && <span className="text-sm font-bold gold-text animate-fade-in">{imageFile.name}</span>}
                </div>
              </div>

              <button type="submit" disabled={uploading} className="btn-gold w-full py-6 text-xl mt-4">
                {uploading ? <Loader2 className="animate-spin" /> : '儲存變更'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
