
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HistoryItem, WardrobeItem } from '../types';
import { TrackingService } from '../services/tracking';

interface WardrobeProps {
  user: UserProfile;
  onStyleItem: (imageUrl: string) => void;
}

const Wardrobe: React.FC<WardrobeProps> = ({ user, onStyleItem }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [closet, setCloset] = useState<WardrobeItem[]>([]);
  const [view, setView] = useState<'closet' | 'fits'>('closet');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(`desidrip_history_${user.id}`);
    const savedCloset = localStorage.getItem(`desidrip_closet_${user.id}`);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedCloset) setCloset(JSON.parse(savedCloset));
  }, [user.id]);

  const handleAddItem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newItem: WardrobeItem = {
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: base64,
          category: 'Top',
          tags: ['Virtual Closet'],
          addedAt: new Date().toISOString()
        };
        const updatedCloset = [newItem, ...closet];
        setCloset(updatedCloset);
        localStorage.setItem(`desidrip_closet_${user.id}`, JSON.stringify(updatedCloset));
        TrackingService.logAction('WARDROBE_ADD' as any, user, 'Added item to digital closet');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeItem = (id: string) => {
    const updated = closet.filter(item => item.id !== id);
    setCloset(updated);
    localStorage.setItem(`desidrip_closet_${user.id}`, JSON.stringify(updated));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-fadeIn px-4 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Vault</h2>
          <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.5em] mt-3">Digital Inventory System</p>
        </div>
        <div className="flex p-2 bg-white/[0.03] rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
          <button 
            onClick={() => setView('closet')}
            className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${view === 'closet' ? 'bg-pink-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Collection
          </button>
          <button 
            onClick={() => setView('fits')}
            className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${view === 'fits' ? 'bg-pink-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            History
          </button>
        </div>
      </div>

      {view === 'closet' ? (
        <div className="space-y-12">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer border-4 border-dashed border-white/5 hover:border-pink-500/40 rounded-[4rem] p-20 text-center transition-all duration-700 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/[0.02] transition-colors"></div>
            <div className="w-24 h-24 bg-pink-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl relative z-10">
              <i className="fas fa-plus text-4xl text-pink-500"></i>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter italic relative z-10 leading-none mb-3">Expand Your <br/> Collection</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium max-w-xs mx-auto opacity-70 relative z-10 leading-relaxed">Our AI catalogs your garments for future styling sessions and automated outfits.</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddItem} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {closet.map((item) => (
              <div key={item.id} className="aspect-[3/4.5] glass-card rounded-[2.5rem] overflow-hidden group relative border border-white/5 shadow-2xl">
                <img src={item.imageUrl} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt="Closet Item" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 p-6 backdrop-blur-sm">
                  <button 
                    onClick={() => onStyleItem(item.imageUrl)}
                    className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-pink-600 hover:text-white active:scale-95 transition-all"
                  >
                    AI Style
                  </button>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="w-full py-4 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all border border-white/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {closet.length === 0 && (
            <p className="text-center text-gray-700 font-bold uppercase tracking-[0.4em] text-[10px] py-10 opacity-30">Storage Empty</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {history.length === 0 ? (
            <div className="col-span-full glass-card p-32 rounded-[4rem] text-center opacity-30">
              <i className="fas fa-history text-7xl mb-10"></i>
              <h3 className="text-2xl font-black uppercase tracking-[0.5em]">No Fit History</h3>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="glass-card rounded-[3rem] overflow-hidden border border-white/5 group shadow-3xl hover:-translate-y-2 transition-all duration-500">
                <div className="relative h-80 w-full overflow-hidden">
                  <img src={item.originalImage} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt="History Fit" />
                  <div className="absolute top-8 left-8 bg-pink-600/90 backdrop-blur-xl text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-2xl shadow-2xl border border-white/10">
                    {item.vibe}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-80"></div>
                  <div className="absolute bottom-8 left-10 right-10">
                    <p className="text-[10px] font-black text-pink-500/80 uppercase tracking-[0.4em] mb-2">{new Date(item.timestamp).toLocaleDateString()}</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter line-clamp-1 uppercase leading-none">{item.recommendation.vibeDescription}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Wardrobe;
