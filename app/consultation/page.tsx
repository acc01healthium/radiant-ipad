
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryType, Treatment } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronLeft, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function ConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedIssues, setSelectedIssues] = useState<CategoryType[]>([]);
  const [recommendations, setRecommendations] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Object.values(CategoryType);

  const toggleIssue = (issue: CategoryType) => {
    setSelectedIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue) 
        : [...prev, issue]
    );
  };

  const handleNext = async () => {
    if (selectedIssues.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const q = collection(db, 'treatments');
      const querySnapshot = await getDocs(q);
      const allTreatments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Treatment));
      
      const filtered = allTreatments.filter(t => 
        t.categories.some(cat => selectedIssues.includes(cat))
      );
      
      setRecommendations(filtered);
      setStep(2);
    } catch (error: any) {
      setError("連線失敗。請確認網路狀態。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col p-8">
      <header className="flex items-center justify-between mb-12">
        <button 
          onClick={() => step === 1 ? router.push('/') : setStep(1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors p-2"
        >
          <ChevronLeft size={28} />
          <span className="text-lg">返回</span>
        </button>
        <h2 className="text-2xl font-medium gold-text">
          {step === 1 ? '您的肌膚困擾' : '為您推薦的療程'}
        </h2>
        <div className="w-20"></div>
      </header>

      {error && (
        <div className="max-w-md mx-auto mb-8 flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 shadow-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {step === 1 ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-light text-gray-700 mb-4">請選出您感興趣的改善項目</h3>
            <p className="text-gray-400">可多選，我們將根據您的選擇提供專業建議</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto w-full">
            {categories.map((cat) => {
              const isSelected = selectedIssues.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleIssue(cat)}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center gap-3 transition-all transform active:scale-95 shadow-sm
                    ${isSelected 
                      ? 'rose-gold-gradient text-white shadow-xl scale-105 border-4 border-white ring-4 ring-[#E0B0FF]/20' 
                      : 'bg-white text-gray-600 hover:shadow-md border-2 border-[#F8E8FF]'}
                  `}
                >
                  <div className={`p-4 rounded-full ${isSelected ? 'bg-white/20' : 'bg-[#FDFBF7]'}`}>
                    <Sparkles size={isSelected ? 32 : 28} className={isSelected ? 'text-white' : 'gold-text'} />
                  </div>
                  <span className="text-xl font-medium tracking-wide">{cat}</span>
                  {isSelected && <Check size={20} className="mt-1" />}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-12 flex justify-center">
            <button
              disabled={selectedIssues.length === 0 || loading}
              onClick={handleNext}
              className={`
                px-16 py-5 rounded-full text-xl font-medium transition-all shadow-lg
                ${selectedIssues.length > 0 
                  ? 'gold-bg text-white hover:opacity-90 transform hover:-translate-y-1' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {loading ? '尋找方案中...' : '查看推薦療程'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl mx-auto w-full animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recommendations.length > 0 ? (
              recommendations.map(treatment => (
                <div key={treatment.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F8E8FF] flex flex-col md:flex-row h-full">
                  <div className="w-full md:w-48 h-48 md:h-full relative shrink-0">
                    <img 
                      src={treatment.imageUrl || 'https://picsum.photos/400/300'} 
                      alt={treatment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-2 mb-3">
                        {treatment.categories.map(cat => (
                          <span key={cat} className="text-xs px-3 py-1 bg-[#F8E8FF] gold-text rounded-full">{cat}</span>
                        ))}
                      </div>
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">{treatment.name}</h4>
                      <p className="text-gray-500 line-clamp-3 leading-relaxed mb-4">{treatment.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-bold gold-text">NT$ {treatment.price.toLocaleString()} <span className="text-sm font-normal text-gray-400">起</span></span>
                      <button className="px-6 py-2 border-2 gold-border gold-text rounded-full hover:gold-bg hover:text-white transition-all">
                        詳細介紹
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-xl text-gray-400">目前沒有完全符合的療程，請聯繫諮詢師提供客製化建議。</p>
              </div>
            )}
          </div>
          
          <div className="mt-12 p-8 bg-white rounded-3xl border-2 border-dashed gold-border flex flex-col items-center gap-6">
            <p className="text-xl font-medium text-gray-700">準備好開始您的美麗旅程了嗎？</p>
            <button className="px-12 py-4 gold-bg text-white rounded-full text-lg shadow-lg hover:shadow-xl transition-all">
              呼叫專業諮詢師
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
