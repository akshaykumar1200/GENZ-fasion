
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RecommendationResponse, StyleVibe } from '../types';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        TrackingService.logAction('IMAGE_UPLOAD', user, `Uploaded ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAdvice = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Use the activeVibe instead of the fixed user.styleVibe
      const advice = await getFashionAdvice(image, { ...user, styleVibe: activeVibe }, userPreference);
      setResults(advice);
      TrackingService.logAction('RECOMMENDATION_GEN', user, `Vibe: ${activeVibe}, Preference: ${userPreference || 'None'}`);
    } catch (error) {
      console.error(error);
      alert('Failed to get fit check.');
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setUserPreference(event.results[0][0].transcript);
    recognition.start();
  };

  const visualizeElement = async (instruction: string) => {
    if (!image) return;
    setEditingColor(true);
    try {
      const edited = await applyStyleToImage(image, instruction);
      setEditedImage(edited);
      setViewMode('edited');
    } catch (error) {
      console.error(error);
    } finally {
      setEditingColor(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-fadeIn pb-24">
      {/* Dynamic Vibe Selector - Post-Signup Modification */}
      <div className="glass-card p-4 md:p-6 rounded-[2rem] border-b-2 border-white/5 overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-2">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Active Style Context</h4>
          <span className="text-[9px] font-bold text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full uppercase italic">Switch Vibe anytime</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {Object.values(StyleVibe).map((vibe) => (
            <button
              key={vibe}
              onClick={() => {
                setActiveVibe(vibe);
                if (results) setResults(null); // Clear previous results to encourage re-generation
              }}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeVibe === vibe 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent text-white shadow-lg shadow-pink-500/20' 
                  : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* MEDIA CONSOLE */}
        <div className="w-full lg:w-5/12 space-y-8">
          <div className="glass-card p-6 rounded-[3rem] relative overflow-hidden group border-t border-white/10">
            {image ? (
              <div className="space-y-6">
                <div className="relative h-[550px] w-full overflow-hidden rounded-[2rem] bg-black/50 border border-white/5">
                  <img 
                    src={viewMode === 'edited' && editedImage ? editedImage : image} 
                    className="w-full h-full object-cover transition-all duration-1000 ease-in-out" 
                    alt="Fit view" 
                  />
                  
                  {editedImage && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => setViewMode('original')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'original' ? 'bg-white text-black' : 'text-gray-400'}`}
                      >
                        Original
                      </button>
                      <button 
                        onClick={() => setViewMode('edited')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'edited' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400'}`}
                      >
                        Edited
                      </button>
                    </div>
                  )}
                  
                  {editingColor && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-xs font-black uppercase tracking-widest animate-pulse">Styling your fit...</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4">
                  <button onClick={() => {setImage(null); setResults(null); setEditedImage(null);}} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors">
                    <i className="fas fa-trash mr-2"></i> Reset
                  </button>
                  <div className="flex gap-2">
                     <span className="text-[10px] font-black uppercase text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full">HQ Render</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer hover:bg-white/5 w-full h-[500px] flex flex-col items-center justify-center p-12 border-4 border-dashed border-white/5 rounded-[2.5rem] transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <i className="fas fa-camera text-4xl text-pink-500"></i>
                </div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter">DROP YOUR FIT</h3>
                <p className="text-gray-500 font-medium max-w-[200px]">Let the AI check your drip in seconds.</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-l-4 border-orange-500 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Personalize Request</label>
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-white/10'}`}></div>
            </div>
            <div className="relative">
              <textarea 
                placeholder='e.g. "Add a baggy denim jacket" or "Make it Gorpcore"'
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-6 pr-16 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all resize-none h-32 placeholder:text-gray-700 leading-relaxed"
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
              />
              <button 
                onClick={startListening}
                className={`absolute right-4 bottom-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-500 text-white shadow-xl rotate-12' : 'bg-white/5 text-gray-500 hover:text-white'
                }`}
              >
                <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
            </div>
          </div>
          
          <Button onClick={getAdvice} className="w-full py-6 text-xl rounded-3xl" disabled={!image || loading} isLoading={loading}>
            RUN {activeVibe.split(' ')[0].toUpperCase()} CHECK
          </Button>
        </div>

        {/* RESULTS HUB */}
        <div className="w-full lg:w-7/12 space-y-8">
          {!results && !loading ? (
            <div className="h-full glass-card p-16 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                <i className="fas fa-sparkles text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tighter uppercase">Ready for {activeVibe}?</h3>
              <p className="text-gray-500 max-w-xs font-medium">Upload a photo to see how we style your look in the {activeVibe} aesthetic.</p>
            </div>
          ) : null}

          {loading && (
            <div className="h-full glass-card p-16 rounded-[3rem] flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-10">
                <div className="absolute inset-0 border-[10px] border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-[10px] border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <i className="fas fa-bolt text-2xl text-pink-500 animate-pulse"></i>
                </div>
              </div>
              <h3 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">Imagining {activeVibe}...</h3>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing your custom vibe</p>
            </div>
          )}

          {results && (
            <div className="space-y-8 animate-slideUp">
              {/* VIBE CARD */}
              <div className="relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#FF9933] via-[#FF007F] to-[#4B0082] rounded-[2.5rem] opacity-90 group-hover:scale-[1.02] transition-transform duration-500"></div>
                 <div className="relative p-10 flex flex-col items-start">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-2">The Vibe</span>
                    <h2 className="text-6xl font-black text-white tracking-tighter leading-none mb-4 italic">
                      {results.vibeDescription}
                    </h2>
                    <div className="flex gap-2">
                       <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">{activeVibe} Certified</span>
                    </div>
                 </div>
              </div>

              {/* THE BUILD */}
              <div className="glass-card p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Imagined Fit</h4>
                   <Button variant="outline" className="py-2 px-4 rounded-xl text-[9px]" onClick={() => visualizeElement(`Apply full outfit in ${activeVibe} style: ${results.outfitSuggestion.top}, ${results.outfitSuggestion.bottom}, ${results.outfitSuggestion.outerwear}`)}>
                      PREVIEW ALL
                   </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Outerwear', value: results.outfitSuggestion.outerwear, icon: 'fa-vest' },
                    { label: 'Top', value: results.outfitSuggestion.top, icon: 'fa-tshirt' },
                    { label: 'Bottom', value: results.outfitSuggestion.bottom, icon: 'fa-socks' },
                    { label: 'Shoes', value: results.outfitSuggestion.shoes, icon: 'fa-shoe-prints' }
                  ].map((item, idx) => item.value && (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-pink-500 border border-white/10">
                          <i className={`fas ${item.icon} text-lg`}></i>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-gray-500 tracking-tighter">{item.label}</p>
                          <p className="font-bold text-white text-sm">{item.value}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => visualizeElement(`Add a ${item.value} in ${activeVibe} aesthetic to this photo.`)}
                        className="opacity-0 group-hover:opacity-100 bg-pink-500 text-white text-[9px] font-black px-4 py-2 rounded-xl transition-all shadow-lg"
                      >
                        IMAGINE
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* PALETTE & ACCESSORIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="glass-card p-8 rounded-[2.5rem]">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Color Story</h4>
                    <div className="flex flex-wrap gap-4">
                      {results.complementaryColors.map((color, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => visualizeElement(`Modify the main clothing to be ${color}.`)}
                          className="w-12 h-12 rounded-2xl border border-white/20 shadow-xl relative group overflow-hidden transition-transform hover:scale-125 hover:z-10" 
                          style={{ backgroundColor: color }}
                        >
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[10px] font-black">
                              TINT
                           </div>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="glass-card p-8 rounded-[2.5rem]">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Accents</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.outfitSuggestion.accessories.map((acc, i) => (
                        <button 
                          key={i} 
                          onClick={() => visualizeElement(`Add ${acc} to the person in the image.`)}
                          className="text-[10px] bg-white/5 hover:bg-pink-500/20 text-white px-4 py-2 rounded-xl border border-white/5 font-black uppercase tracking-widest transition-all"
                        >
                          + {acc}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* NOTES */}
              <div className="glass-card p-10 rounded-[3rem] border-t-2 border-white/5">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 text-center">Stylist Intel</h4>
                <div className="space-y-6">
                  {results.stylingTips.map((tip, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-orange-500 font-black text-xs shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        0{i + 1}
                      </div>
                      <p className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-white transition-colors">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitPlanner;
