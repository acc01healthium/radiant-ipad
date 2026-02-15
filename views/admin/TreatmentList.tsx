
import React, { useState, useEffect } from 'react';
import { db, storage, uploadFile } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Treatment, CategoryType } from '../../types';
import { Plus, Trash2, Edit3, Image as ImageIcon, X } from 'lucide-react';

export default function TreatmentList() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
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
    const querySnapshot = await getDocs(collection(db, 'treatments'));
    const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Treatment));
    setTreatments(list);
    setLoading(false);
  };

  const handleToggleCat = (cat: CategoryType) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = '';

    if (imageFile) {
      imageUrl = await uploadFile(imageFile, `treatments/${Date.now()}_${imageFile.name}`);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">療程項目管理</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-black transition-all"
        >
          <Plus size={20} /> 新增療程
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">療程名稱</th>
              <th className="p-4 font-medium text-gray-500">分類</th>
              <th className="p-4 font-medium text-gray-500">價格</th>
              <th className="p-4 font-medium text-gray-500 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {treatments.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={t.imageUrl || 'https://picsum.photos/50'} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium text-gray-800">{t.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {t.categories.map(c => (
                      <span key={c} className="text-[10px] px-2 py-0.5 bg-[#F8E8FF] gold-text rounded-full">{c}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-gray-600">NT$ {t.price.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? '編輯療程' : '新增療程'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">療程名稱</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" placeholder="例如：皮秒雷射" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">基礎價格</label>
                  <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">對應肌膚困擾 (多選)</label>
                <div className="flex flex-wrap gap-3">
                  {Object.values(CategoryType).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleToggleCat(cat)}
                      className={`px-4 py-2 rounded-full border transition-all ${selectedCats.includes(cat) ? 'gold-bg text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">療程簡介</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl h-24 resize-none" placeholder="輸入療程描述..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">療程主圖</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                    <ImageIcon size={20} />
                    選擇檔案
                    <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  {imageFile && <span className="text-sm text-gray-500">{imageFile.name}</span>}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-lg mt-6">
                儲存設定
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
