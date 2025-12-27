
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RecommendationResponse, StyleVibe, HistoryItem } from '../types';
import { getFashionAdvice, applyStyleToImage } from '../services/geminiService';
import { TrackingService } from '../services/tracking';
import Button from './Button';

interface OutfitPlannerProps {
  user: UserProfile;
  initialImage?: string;
  onClearInitial?: () => void;
}

const OutfitPlanner: React.FC<OutfitPlannerProps> = ({ user, initialImage, onClearInitial }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState(false);
  const [userPreference, setUserPreference] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'edited'>('original');
  const [activeVibe, setActiveVibe] = useState<StyleVibe>(user.styleVibe);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-run advice if an initial image is provided (from Wardrobe)
  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      const performInitialAnalysis = async () => {
        setLoading(true);
        try {
          const advice = await getFashionAdvice(initialImage, { ...user, styleVibe: activeVibe }, userPreference);
          setResults(advice);
          saveToHistory(advice, initialImage);
          TrackingService.logAction('RECOMMENDATION_GEN', user, `Auto-analysis for Closet Item`);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      performInitialAnalysis();
      if (onClearInitial) onClearInitial();
    }
  }, [initialImage, activeVibe, user, userPreference, onClearInitial]);

  const saveToHistory = (recommendation: RecommendationResponse, originalImg: string) => {
    const savedHistoryStr = localStorage.getItem(`desidrip_history_${user.id}`);
    const currentHistory: HistoryItem[] = savedHistoryStr ? JSON.parse(savedHistoryStr) : [];
    
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      originalImage: originalImg,
      recommendation,
      vibe: activeVibe
    };
    const updatedHistory = [newItem, ...currentHistory].slice(0, 20);
    localStorage.setItem(`desidrip_history_${user.id}`, JSON.stringify(updatedHistory));
    TrackingService.logAction('STYLE_SAVED' as any, user, `Saved ${activeVibe} fit session`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setResults(null);
        setEditedImage(null);
        setViewMode('original');
        TrackingService.logAction('IMAGE_UPLOAD', user, `Manual Upload: ${(file.size / 1024).toFixed(2)}KB`);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAdvice = async (targetImage: string | null = image) => {
    if (!targetImage) return;
    setLoading(true);
    try {
      const advice = await getFashionAdvice(targetImage, { ...user, styleVibe: activeVibe }, userPreference);
      setResults(advice);
      saveToHistory(advice, targetImage);
      TrackingService.logAction('RECOMMENDATION_GEN', user, `Analysis for ${activeVibe}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const visualizeElement = async (instruction: string) => {
    if (!image) return;
    setEditingColor(true);
    try {
      const edited = await applyStyleToImage(image, instruction, activeVibe);
      setEditedImage(edited);
      setViewMode('edited');
      TrackingService.logAction('IMAGE_UPLOAD', user, `AI Modification: ${instruction}`);
    } catch (error) {
      console.error(error);
    } finally {
      setEditingColor(false);
    }
  };

  const changeItemColor = (itemName: string, color: string) => {
    visualizeElement(`Cleanly change the color of the ${itemName} to a high-end ${color} textile. Keep all texture and lighting.`);
  };

  const handleVibeSwitch = (vibe: StyleVibe) => {
    setActiveVibe(vibe);
    if (results) setResults(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 animate-fadeIn pb-24 px-4">
      {/* Vibe Grid Navigation */}
      <div className="glass-card p-6 rounded-[3rem] border-b border-white/10 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar px-12">
          {Object.values(StyleVibe).map((vibe) => (
            <button
              key={vibe}
              onClick={() => handleVibeSwitch(vibe)}
              className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${
                activeVibe === vibe 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-xl scale-105' 
                  : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-white'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-16">
        <div className="w-full xl:w-5/12 space-y-10">
          <div className="glass-card p-8 rounded-[4rem] relative overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] group">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-500/5 blur-[120px] rounded-full group-hover:bg-pink-500/10 transition-colors"></div>
            
            {image ? (
              <div className="space-y-8">
                <div className="relative h-[650px] w-full overflow-hidden rounded-[3rem] bg-black/90 border border-white/10 shadow-2xl">
                  <img 
                    src={viewMode === 'edited' && editedImage ? editedImage : image} 
                    className="w-full h-full object-cover transition-all duration-1000" 
                    alt="Fit view" 
                  />
                  
                  {editedImage && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex bg-black/70 backdrop-blur-3xl p-2 rounded-3xl border border-white/10 shadow-2xl z-30">
                      <button 
                        onClick={() => setViewMode('original')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-[0.3em] ${viewMode === 'original' ? 'bg-white text-black shadow-lg' : 'text-gray-400'}`}
                      >
                        Original
                      </button>
                      <button 
                        onClick={() => setViewMode('edited')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-[0.3em] ${viewMode === 'edited' ? 'bg-pink-600 text-white shadow-xl shadow-pink-600/20' : 'text-gray-400'}`}
                      >
                        AI Edit
                      </button>
                    </div>
                  )}

                  {editingColor && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-xl z-40 transition-all duration-500">
                      <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_50px_rgba(236,72,153,0.5)]"></div>
                      <p className="text-[11px] font-black uppercase tracking-[0.6em] animate-pulse text-pink-500">Processing Drip...</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-6">
                  <button onClick={() => {setImage(null); setResults(null); setEditedImage(null);}} className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 hover:text-red-500 transition-all group flex items-center gap-2">
                    <i className="fas fa-trash-alt group-hover:rotate-12 transition-transform"></i> Purge Input
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/80">AI Active</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer hover:bg-white/[0.04] w-full h-[600px] flex flex-col items-center justify-center p-16 border-4 border-dashed border-white/5 rounded-[3.5rem] transition-all group relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 bg-pink-500/10 rounded-[2.5rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500 shadow-2xl relative z-10">
                  <i className="fas fa-camera-retro text-5xl"></i>
                </div>
                <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic leading-none relative z-10">Upload <br/> Fit</h3>
                <p className="text-gray-600 text-base font-medium max-w-xs leading-relaxed opacity-60 relative z-10">Capture your fit or garment. Our AI identifies cultural markers and structure instantly.</p>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-l-4 border-orange-500 shadow-2xl relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full"></div>
             <div className="flex items-center justify-between mb-6 relative z-10">
               <label className="text-[11px] font-black text-orange-500 uppercase tracking-[0.5em]">Directives</label>
               <button onClick={() => setIsListening(!isListening)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-xl animate-pulse' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                 <i className="fas fa-microphone-alt"></i>
               </button>
             </div>
             <textarea 
                placeholder='e.g. "Add a premium silk dupatta with gold borders"'
                className="w-full bg-black/40 border border-white/5 rounded-[2rem] px-8 py-8 text-base font-bold focus:outline-none focus:border-pink-500/50 transition-all resize-none h-32 placeholder:text-gray-800 relative z-10"
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
              />
          </div>
          
          <Button onClick={() => getAdvice()} className="w-full py-7 text-2xl rounded-[2.5rem] shadow-2xl" disabled={!image || loading} isLoading={loading}>
            {results ? 'Scan Again' : `Initialize Fit-Check`}
          </Button>
        </div>

        <div className="w-full xl:w-7/12 space-y-12">
          {results ? (
            <div className="space-y-12 animate-slideUp">
              <div className="relative overflow-hidden p-16 bg-gradient-to-br from-[#FF9933] via-[#FF007F] to-[#4B0082] rounded-[4rem] shadow-[0_40px_100px_rgba(255,0,127,0.3)] group hover:scale-[1.01] transition-transform duration-700">
                <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] translate-x-32 group-hover:translate-x-12 transition-transform duration-1000"></div>
                <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.6em] mb-6 block">Styling Verdict</span>
                <h2 className="text-7xl font-black text-white tracking-tighter leading-[0.85] italic mb-6 uppercase">{results.vibeDescription}</h2>
                <div className="w-24 h-1.5 bg-white/40 rounded-full"></div>
              </div>

              <div className="glass-card p-12 rounded-[4rem] shadow-2xl border border-white/5 relative">
                <div className="absolute top-10 right-12 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-green-500/80 uppercase tracking-[0.4em]">Engine Synced</span>
                </div>
                
                <h4 className="text-[12px] font-black text-gray-600 uppercase tracking-[0.5em] mb-12 italic">Digital Assembly</h4>
                
                <div className="space-y-6">
                  {[
                    { label: 'Outshell', value: results.outfitSuggestion.outerwear, icon: 'fa-user-ninja' },
                    { label: 'Core Piece', value: results.outfitSuggestion.top, icon: 'fa-shirt' },
                    { label: 'Base Layer', value: results.outfitSuggestion.bottom, icon: 'fa-socks' },
                    { label: 'Footwear', value: results.outfitSuggestion.shoes, icon: 'fa-shoe-prints' }
                  ].map((item, idx) => item.value && (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 group transition-all hover:bg-white/[0.06] hover:border-white/20 shadow-lg">
                      <div className="flex items-center gap-8 mb-6 sm:mb-0">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-pink-500/10 to-orange-500/10 flex items-center justify-center border border-white/10 text-pink-500 shadow-xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                          <i className={`fas ${item.icon} text-2xl`}></i>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">{item.label}</p>
                          <p className="font-bold text-white text-xl leading-tight tracking-tight">{item.value}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 justify-end">
                        <div className="flex gap-2.5">
                          {results.complementaryColors.slice(0, 3).map((color, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => changeItemColor(item.value!, color)}
                              className="w-7 h-7 rounded-full border-2 border-white/10 hover:border-white/50 hover:scale-125 transition-all shadow-xl"
                              style={{ backgroundColor: color }}
                              title={`Apply ${color}`}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={() => visualizeElement(`Cleanly add a high-fashion ${item.value} to this person. Perfect integration with current fabric and shadows.`)}
                          className="bg-white/5 text-white text-[10px] font-black px-6 py-4 rounded-2xl hover:bg-pink-600 hover:text-white transition-all uppercase tracking-[0.3em] border border-white/10 shadow-lg"
                        >
                          Modify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                 <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-pink-500/5 blur-[80px] rounded-full"></div>
                 <h4 className="text-[12px] font-black text-gray-600 uppercase tracking-[0.5em] mb-12 italic">Creative Direction</h4>
                 <div className="space-y-12 relative z-10">
                    {results.stylingTips.map((tip, i) => (
                      <div key={i} className="flex gap-8 items-start group">
                        <span className="text-5xl font-black text-white/[0.03] group-hover:text-pink-500/10 transition-all duration-700 italic leading-none">{i + 1}</span>
                        <div className="pt-2">
                           <p className="text-gray-400 font-semibold text-lg leading-relaxed group-hover:text-white transition-all duration-500">{tip}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
             <div className="h-[600px] flex flex-col items-center justify-center text-center opacity-20">
               <i className="fas fa-microchip text-8xl mb-10"></i>
               <h3 className="text-2xl font-black uppercase tracking-[0.6em]">Analysis Node Offline</h3>
               <p className="mt-4 font-medium uppercase tracking-widest text-sm">Upload input to initialize.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitPlanner;
