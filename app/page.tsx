import Link from 'next/link';
import { MapPin, HeartHandshake, Church } from 'lucide-react';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuth } from "@/components/HeaderAuth";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--grace-ivory)] overflow-x-hidden selection:bg-[var(--grace-gold)] selection:text-white">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2 drop-shadow-sm">
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold text-[var(--grace-ink)] tracking-tight">
            Grace<span className="text-[var(--grace-gold)]">Map</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <HeaderAuth />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Background blobs for aesthetic */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--grace-gold)]/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--grace-sand)]/40 blur-3xl" />
        </div>

        {/* Content */}
        <div className="flex-1 text-center lg:text-left z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[var(--grace-gold)]/30 bg-[var(--grace-gold)]/10 text-[var(--grace-ink)] text-sm font-medium tracking-wide">
            Платформа взаимопомощи
          </div>
          
          <h2 className="font-[family-name:var(--font-cormorant)] text-5xl lg:text-7xl font-bold text-[var(--grace-ink)] leading-[1.1] mb-8">
            Находи общины.<br/>
            <span className="text-[var(--grace-gold)] italic">Проси о молитве.</span><br/>
            Помогай делом.
          </h2>
          
          <p className="text-lg lg:text-xl text-[var(--grace-muted)] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            GraceMap объединяет христианские церкви, служения и нуждающихся на единой глобальной карте. Здесь каждый может попросить о молитве или оказать срочную помощь.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link 
              href="/map" 
              className="px-8 py-4 bg-[var(--grace-ink)] text-white rounded-2xl font-medium shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Открыть карту
            </Link>
            <Link 
              href="/map" 
              className="px-8 py-4 bg-white text-[var(--grace-ink)] border border-[var(--grace-stone)] rounded-2xl font-medium shadow-sm hover:bg-[var(--grace-stone)] transition-colors flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-5 h-5" />
              Нужна помощь
            </Link>
          </div>
        </div>

        {/* Map Preview Graphic */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative z-10">
          <div className="aspect-[4/5] rounded-[3rem] bg-white/50 backdrop-blur-xl border border-white shadow-2xl p-4 overflow-hidden relative">
            <div className="w-full h-full rounded-[2.5rem] bg-[var(--grace-stone)] relative overflow-hidden group border border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                alt="Map Background" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--grace-ivory)] to-transparent opacity-80" />
              
              {/* Fake UI Elements for preview */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white">
                <div className="w-10 h-10 rounded-xl bg-[var(--prayer)] flex items-center justify-center text-white"><HeartHandshake className="w-5 h-5" /></div>
                <div className="w-10 h-10 rounded-xl bg-[var(--project)] flex items-center justify-center text-white"><Church className="w-5 h-5" /></div>
              </div>
            </div>
            
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--grace-gold)] rounded-full blur-2xl opacity-40 mix-blend-multiply animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
