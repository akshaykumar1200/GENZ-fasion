
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WardrobeItem } from '../types';
import { identifyClothingItem } from '../services/geminiService';
import { TrackingService } from '../services/tracking';

interface WardrobeProps {
  user: UserProfile;
  onStyleItem: (imageUrl: string) => void;
}

const Wardrobe: React.FC<WardrobeProps> = ({ user, onStyleItem }) => {
  const [closet, setCloset] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCloset = localStorage.getItem(`desidrip_closet_${user.id}`);
    if (savedCloset) setCloset(JSON.parse(savedCloset));
  }, [user.id]);

  const handleAddItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          // AI Smart Extraction
          const metadata = await identifyClothingItem(base64);
          
          const newItem: WardrobeItem = {
            id: Math.random().toString(36).substr(2, 9),
            imageUrl: base64,
            category: metadata.category as any || 'Top',
            tags: metadata.tags || ['Auto-Detected'],
            addedAt: new Date().toISOString()
          };
          
          const updatedCloset = [newItem, ...closet];
          setCloset(updatedCloset);
          localStorage.setItem(`desidrip_closet_${user.id}`, JSON.stringify(updatedCloset));
          TrackingService.logAction('WARDROBE_ADD' as any, user, `Added ${newItem.category}`);
        } catch (error) {
          console.error("Failed to identify item", error);
        } finally {
          setLoading(false);
        }
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
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-slide-up px-4 pb-32 pt-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-6xl font-cali text-white">The Vault</h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mt-2">Digital Inventory: {closet.length} Items</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center text-2xl hover:scale-110 transition-transform shadow-lg shadow-white/10"
        >
          {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-plus"></i>}
        </button>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddItem} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {closet.map((item) => (
          <div key={item.id} className="relative group break-inside-avoid">
            <div className="aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 relative">
              <img src={item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt={item.category} />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                <button 
                  onClick={() => onStyleItem(item.imageUrl)}
                  className="px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                >
                  Style
                </button>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-all"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              {/* Tags */}
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                <span className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wide text-white border border-white/10">
                  {item.category}
                </span>
                {item.tags?.slice(0, 1).map((t, i) => (
                  <span key={i} className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wide text-gray-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {closet.length === 0 && !loading && (
        <div className="h-64 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-gray-800 rounded-3xl">
          <i className="fas fa-camera text-4xl mb-4"></i>
          <p className="text-xs uppercase tracking-widest">Inventory Empty</p>
        </div>
      )}
    </div>
  );
};

export default Wardrobe;
