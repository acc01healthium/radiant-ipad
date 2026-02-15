
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { getGeneralSettings } from '../lib/firebase';

export default function Home() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getGeneralSettings();
        if (settings && settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
        }
      } catch (err) {
        console.error("Failed to fetch settings, using defaults.", err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#FDFBF7] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full rose-gold-gradient opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#D4AF37] opacity-10 blur-3xl"></div>

      <div className="z-10 text-center space-y-8 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full rose-gold-gradient flex items-center justify-center shadow-lg border-2 border-white overflow-hidden bg-white">
            {logoUrl ? (
              <img src={logoUrl} alt="Radiant Clinic Logo" className="w-full h-full object-cover" />
            ) : (
              <Sparkles size={64} className="text-white" />
            )}
          </div>
        </div>
        
        <h1 className="text-5xl font-light tracking-widest text-gray-800">亮立美學</h1>
        <p className="text-xl text-gray-500 font-light italic">Radiant Clinic Consultation System</p>
        
        <div className="mt-12">
          <Link 
            to="/consultation"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white border-2 gold-border gold-text rounded-full text-xl font-medium shadow-md hover:shadow-xl hover:bg-[#FDFBF7] transition-all transform active:scale-95"
          >
            開始專業諮詢
            <ChevronRight size={24} />
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-gray-400 text-sm font-light">
        © 2024 亮立美學 | 專業醫美諮詢
      </div>
    </div>
  );
}
