
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RecommendationResponse, StyleVibe, HistoryItem } from '../types';
import { getFashionAdvice, applyStyleToImage } from '../services/geminiService';
import { TrackingService } from '../services/tracking';
import Button from './Button';

interface OutfitPlannerProps {
  user: UserProfile;
}

const OutfitPlanner: React.FC<OutfitPlannerProps> = ({ user }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState(false);
  const [userPreference, setUserPreference] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'edited'>('original');
  const [activeVibe, setActiveVibe] = useState<StyleVibe>(user.styleVibe);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(`desidrip_history_${user.id}`);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, [user.id]);

  const saveToHistory = (recommendation: RecommendationResponse, originalImg: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      originalImage: originalImg,
      recommendation,
      vibe: activeVibe
    };
    const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem(`desidrip_history_${user.id}`, JSON.stringify(updatedHistory));
    TrackingService.logAction('STYLE_SAVED' as any, user, `Saved ${activeVibe} style to history`);
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
        setFeedbackSent(false);
        TrackingService.logAction('IMAGE_UPLOAD', user, `Image Size: ${(file.size / 1024).toFixed(2)}KB`);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAdvice = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const advice = await getFashionAdvice(image, { ...user, styleVibe: activeVibe }, userPreference);
      setResults(advice);
      setFeedbackSent(false);
      saveToHistory(advice, image);
      TrackingService.logAction('RECOMMENDATION_GEN', user, `Style: ${activeVibe}, Pref: ${userPreference || 'Auto'}`);
    } catch (error) {
      console.error(error);
      alert('Failed to get fit check.');
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = (isDrip: boolean) => {
    setFeedbackSent(true);
    TrackingService.logAction('FEEDBACK', user, `Rating: ${isDrip ? 'POSITIVE' : 'NEGATIVE'}`);
  };

  const visualizeElement = async (instruction: string) => {
    if (!image) return;
    setEditingColor(true);
    try {
      const edited = await applyStyleToImage(image, instruction, activeVibe);
      setEditedImage(edited);
      setViewMode('edited');
      TrackingService.logAction('IMAGE_UPLOAD', user, `Visual Edit Applied: ${instruction}`);
    } catch (error) {
      console.error(error);
    } finally {
      setEditingColor(false);
    }
  };

  const changeItemColor = (itemName: string, color: string) => {
    visualizeElement(`Change the color of the ${itemName} to a high-fashion ${color} while maintaining the ${activeVibe} fit and aesthetic.`);
    TrackingService.logAction('COLOR_CHANGED' as any, user, `Changed ${itemName} to ${color}`);
  };

  const handleVibeSwitch = (vibe: StyleVibe) => {
    setActiveVibe(vibe);
    TrackingService.logAction('RECOMMENDATION_GEN', user, `Vibe Switch: ${vibe}`);
    if (results) setResults(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setImage(item.originalImage);
    setResults(item.recommendation);
    setActiveVibe(item.vibe);
    setEditedImage(null);
    setViewMode('original');
    setShowHistory(false);
    TrackingService.logAction('LOGIN', user, `Restored history item ${item.id}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 animate-fadeIn pb-24 relative px-4">
      {/* History Sidebar Trigger */}
      <button 
        onClick={() => setShowHistory(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-pink-600 w-12 h-40 rounded-l-3xl flex flex-col items-center justify-center gap-4 shadow-2xl border-l border-white/20 transition-all hover:pr-2 group"
      >
        <i className="fas fa-history text-white text-xl"></i>
        <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-[0.4em] text-white">Style History</span>
      </button>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm h-full bg-[#0a0a0a] border-l border-white/10 p-8 overflow-y-auto animate-slideLeft">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black italic tracking-tighter">PREVIOUS DRIP</h3>
              <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <i className="fas fa-ghost text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No history yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="group cursor-pointer glass-card p-4 rounded-2xl hover:border-pink-500/50 transition-all border border-white/5"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={item.originalImage} className="w-full h-full object-cover" alt="History" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-pink-500 mb-1">{item.vibe}</p>
                        <p className="text-xs font-bold text-white truncate">{item.recommendation.vibeDescription}</p>
                        <p className="text-[8px] text-gray-500 mt-2">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vibe Context Hub */}
      <div className="glass-card p-4 md:p-6 rounded-[2rem] border-b-2 border-white/5 overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Style Matrix</h4>
            <div className="flex items-center gap-2">
               <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-pink-500 w-[92%]"></div>
               </div>
               <span className="text-[8px] font-black text-pink-500 uppercase">Aesthetic Engine v4</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {Object.values(StyleVibe).map((vibe) => (
            <button
              key={vibe}
              onClick={() => handleVibeSwitch(vibe)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeVibe === vibe 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-lg' 
                  : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-5/12 space-y-8">
          <div className="glass-card p-6 rounded-[3rem] relative overflow-hidden group border-t border-white/10">
            {image ? (
              <div className="space-y-6">
                <div className="relative h-[600px] w-full overflow-hidden rounded-[2rem] bg-black/50 border border-white/5">
                  <img 
                    src={viewMode === 'edited' && editedImage ? editedImage : image} 
                    className="w-full h-full object-cover transition-opacity duration-500" 
                    alt="Fit view" 
                  />
                  
                  {editedImage && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                      <button 
                        onClick={() => setViewMode('original')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'original' ? 'bg-white text-black' : 'text-gray-400'}`}
                      >
                        Source
                      </button>
                      <button 
                        onClick={() => setViewMode('edited')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'edited' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400'}`}
                      >
                        AI Edit
                      </button>
                    </div>
                  )}

                  {editingColor && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center animate-fadeIn">
                      <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing Style Alignment...</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-4">
                  <button onClick={() => {setImage(null); setResults(null); setEditedImage(null);}} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-all">
                    <i className="fas fa-trash mr-2"></i> Reset
                  </button>
                  <span className="text-[10px] font-black uppercase text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full">Telemetry Active</span>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer hover:bg-white/5 w-full h-[500px] flex flex-col items-center justify-center p-12 border-4 border-dashed border-white/5 rounded-[2.5rem] transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-pink-500/10 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-camera text-4xl text-pink-500"></i>
                </div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase italic">DROP YOUR FIT</h3>
                <p className="text-gray-500 font-medium">Analyzed in real-time for maximum drip.</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-l-4 border-orange-500">
             <div className="flex items-center justify-between mb-4">
               <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Style Direction</label>
               <button onClick={() => setIsListening(!isListening)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                 <i className="fas fa-microphone-alt"></i>
               </button>
             </div>
             <textarea 
                placeholder='e.g. "Match this with loose denim" or "Change jacket to matte black"'
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-6 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all resize-none h-32 placeholder:text-gray-700"
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
              />
          </div>
          
          <Button onClick={getAdvice} className="w-full py-6 text-xl rounded-3xl shadow-pink-500/20" disabled={!image || loading} isLoading={loading}>
            {results ? 'RE-ANALYZE' : `GET ${activeVibe.toUpperCase()} FIT`}
          </Button>
        </div>

        <div className="w-full lg:w-7/12 space-y-8">
          {results && (
            <div className="space-y-8 animate-slideUp">
              {/* VIBE CARD */}
              <div className="relative overflow-hidden p-10 bg-gradient-to-br from-[#FF9933] via-[#FF007F] to-[#4B0082] rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <i className="fas fa-quote-right text-8xl"></i>
                </div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-2 block">The Aesthetic</span>
                <h2 className="text-6xl font-black text-white tracking-tighter leading-none mb-6 italic">{results.vibeDescription}</h2>
                <div className="flex gap-2">
                  <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">
                    {activeVibe} Certified
                  </span>
                </div>
              </div>

              {/* FIT COMPONENTS WITH COLOR SWAPPING */}
              <div className="glass-card p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Drip Components</h4>
                  <span className="text-[9px] font-black text-pink-500 uppercase italic">Custom Color Control Active</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Outerwear', value: results.outfitSuggestion.outerwear, icon: 'fa-vest' },
                    { label: 'Top', value: results.outfitSuggestion.top, icon: 'fa-tshirt' },
                    { label: 'Bottom', value: results.outfitSuggestion.bottom, icon: 'fa-socks' },
                    { label: 'Shoes', value: results.outfitSuggestion.shoes, icon: 'fa-shoe-prints' }
                  ].map((item, idx) => item.value && (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.07]">
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-orange-500/20 flex items-center justify-center border border-white/10">
                          <i className={`fas ${item.icon} text-xl text-pink-500`}></i>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-gray-500 tracking-tighter">{item.label}</p>
                          <p className="font-bold text-white text-base">{item.value}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Quick Color Swappers */}
                        <div className="flex gap-1.5 mr-2">
                          {results.complementaryColors.slice(0, 3).map((color, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => changeItemColor(item.value!, color)}
                              className="w-6 h-6 rounded-full border border-white/20 shadow-lg hover:scale-125 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`Change to ${color}`}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={() => visualizeElement(`Cleanly add a ${item.value} to this person in the ${activeVibe} aesthetic.`)}
                          className="bg-pink-600 text-white text-[9px] font-black px-5 py-2.5 rounded-xl hover:bg-pink-500 shadow-xl transition-all uppercase tracking-widest"
                        >
                          Try On
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PALETTE & ACCENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[2.5rem]">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Color Story</h4>
                  <div className="flex flex-wrap gap-4">
                    {results.complementaryColors.map((color, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => visualizeElement(`Modify the main clothing to be ${color} while ensuring perfect fit and lighting.`)}
                        className="w-12 h-12 rounded-2xl border border-white/20 shadow-xl relative group overflow-hidden transition-transform hover:scale-110" 
                        style={{ backgroundColor: color }}
                      >
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[9px] font-black">
                            APPLY
                         </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem]">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Finishing Touches</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.outfitSuggestion.accessories.map((acc, i) => (
                      <button 
                        key={i} 
                        onClick={() => visualizeElement(`Stylishly add ${acc} to the person in the photo.`)}
                        className="text-[9px] bg-white/5 hover:bg-pink-500/20 text-white px-4 py-2.5 rounded-xl border border-white/5 font-black uppercase tracking-widest transition-all"
                      >
                        + {acc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STYLIST NOTES */}
              <div className="glass-card p-10 rounded-[3rem] border-t-2 border-white/5">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 text-center">Stylist Intel</h4>
                <div className="space-y-6">
                  {results.stylingTips.map((tip, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-pink-500 font-black text-[10px] shrink-0 border border-white/10 group-hover:bg-pink-500 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-white transition-colors">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dataset Feedback */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-b-2 border-pink-500/20">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Model Refinement</span>
                  <span className="text-xs font-bold text-gray-400 italic">Was this fit evaluation accurate?</span>
                </div>
                {!feedbackSent ? (
                  <div className="flex gap-2">
                    <button onClick={() => sendFeedback(true)} className="px-5 py-2 rounded-xl bg-green-500/10 text-green-500 text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all">Drip</button>
                    <button onClick={() => sendFeedback(false)} className="px-5 py-2 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Drop</button>
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest animate-pulse flex items-center gap-2">
                    <i className="fas fa-check-circle"></i> Telemetry Synced
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitPlanner;
