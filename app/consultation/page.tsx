
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryType, Treatment } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronLeft, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

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
      setError("資料載入失敗，請確認網路連線。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-clinic-cream flex flex-col p-8 md:p-12 relative overflow-hidden bg-pattern">
      {/* Decorative Circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-clinic-rose/10 blur-3xl"></div>

      <header className="flex items-center justify-between mb-16 z-10">
        <button 
          onClick={() => step === 1 ? router.push('/') : setStep(1)}
          className="p-4 bg-white shadow-md rounded-2xl text-gray-400 hover:text-clinic-gold transition-all active:scale-95"
        >
          <ChevronLeft size={32} />
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-light text-clinic-dark tracking-widest">
            {step === 1 ? '您的肌膚困擾' : '專業推薦方案'}
          </h2>
          <div className="flex justify-center mt-2 gap-1">
            <div className={`h-1.5 w-12 rounded-full transition-all ${step === 1 ? 'bg-clinic-gold' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all ${step === 2 ? 'bg-clinic-gold' : 'bg-gray-200'}`}></div>
          </div>
        </div>
        <div className="w-16"></div>
      </header>

      {error && (
        <div className="max-w-md mx-auto mb-8 flex items-center gap-3 p-5 bg-red-50 text-red-700 rounded-3xl border border-red-100 shadow-sm animate-fade-in">
          <AlertCircle size={24} />
          {error}
        </div>
      )}

      {step === 1 ? (
        <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full z-10 animate-fade-in">
          <div className="mb-16 text-center">
            <h3 className="text-4xl font-light text-gray-700 mb-6">請選擇欲改善的項目</h3>
            <p className="text-gray-400 text-lg">讓我們為您量身打造專屬療程計劃</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 w-full">
            {categories.map((cat) => {
              const isSelected = selectedIssues.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleIssue(cat)}
                  className={`
                    aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 transform active:scale-90 relative
                    ${isSelected 
                      ? 'bg-clinic-rose text-white shadow-[0_20px_40px_rgba(224,176,255,0.4)] scale-110 border-4 border-white' 
                      : 'bg-white text-gray-600 hover:shadow-xl hover:-translate-y-2 border border-gray-100'}
                  `}
                >
                  <div className={`p-5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-clinic-cream'}`}>
                    <Sparkles size={isSelected ? 40 : 32} className={isSelected ? 'text-white' : 'text-clinic-gold'} />
                  </div>
                  <span className="text-2xl font-medium">{cat}</span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-clinic-gold p-2 rounded-full shadow-lg animate-fade-in">
                      <Check size={20} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-20">
            <button
              disabled={selectedIssues.length === 0 || loading}
              onClick={handleNext}
              className={`
                btn-gold text-2xl px-20 py-6
                ${selectedIssues.length === 0 ? 'opacity-30 cursor-not-allowed scale-100' : 'animate-pulse shadow-clinic-gold/40'}
              `}
            >
              {loading ? '分析中...' : '生成推薦方案'}
              <ArrowRight size={28} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl mx-auto w-full z-10 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {recommendations.length > 0 ? (
              recommendations.map(treatment => (
                <div key={treatment.id} className="glass-card overflow-hidden flex flex-col h-full group hover:shadow-2xl transition-all duration-500">
                  <div className="h-64 relative overflow-hidden">
                    <img 
                      src={treatment.imageUrl || `https://picsum.photos/seed/${treatment.id}/800/600`} 
                      alt={treatment.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 flex gap-2">
                      {treatment.categories.map(cat => (
                        <span key={cat} className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full uppercase tracking-widest">{cat}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h4 className="text-3xl font-bold text-gray-800 mb-4">{treatment.name}</h4>
                    <p className="text-gray-500 leading-relaxed mb-8 flex-1">{treatment.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">投資美麗</span>
                        <span className="text-3xl font-bold text-clinic-gold">NT$ {treatment.price.toLocaleString()}</span>
                      </div>
                      <button className="btn-outline px-6 py-3">查看詳情</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center glass-card">
                <p className="text-2xl text-gray-400 font-light">目前查無完全符合的療程，<br />建議聯繫諮詢師為您客製化服務。</p>
              </div>
            )}
          </div>
          
          <div className="mt-16 p-12 glass-card flex flex-col items-center gap-8 border-2 border-dashed border-clinic-gold/30">
            <div className="text-center">
              <h5 className="text-2xl font-medium text-clinic-dark mb-2">想了解更多細節？</h5>
              <p className="text-gray-400">專屬顧問已準備好為您解說</p>
            </div>
            <button className="btn-gold px-16 text-xl">
              呼叫現場諮詢師
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
