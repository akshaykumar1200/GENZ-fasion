
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RecommendationResponse } from '../types';
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
      const advice = await getFashionAdvice(image, user, userPreference);
      setResults(advice);
      TrackingService.logAction('RECOMMENDATION_GEN', user, `Preference: ${userPreference || 'None'}`);
    } catch (error) {
      console.error(error);
      alert('Failed to get fashion advice.');
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
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
      TrackingService.logAction('RECOMMENDATION_GEN', user, `Visualized: ${instruction}`);
    } catch (error) {
      console.error(error);
    } finally {
      setEditingColor(false);
    }
  };

  const visualizeFullOutfit = () => {
    if (!results) return;
    const outfit = results.outfitSuggestion;
    const instruction = `Add a ${outfit.outerwear || ''} ${outfit.top || ''} ${outfit.bottom || ''} ${outfit.shoes || ''} and accessories like ${outfit.accessories.join(', ')} to the person in the image. Follow the vibe: ${results.vibeDescription}`;
    visualizeElement(instruction);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Media Hub */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="glass-card p-4 rounded-3xl relative overflow-hidden group">
            {image ? (
              <div className="space-y-4">
                <div className="relative h-[450px] w-full overflow-hidden rounded-2xl bg-black/40">
                  <img 
                    src={viewMode === 'edited' && editedImage ? editedImage : image} 
                    className="w-full h-full object-contain transition-all duration-700" 
                    alt="Clothing view" 
                  />
                  
                  {editedImage && (
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                      <button 
                        onClick={() => setViewMode('original')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'original' ? 'bg-pink-600 text-white' : 'bg-black/60 text-gray-400'}`}
                      >
                        Original
                      </button>
                      <button 
                        onClick={() => setViewMode('edited')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'edited' ? 'bg-pink-600 text-white' : 'bg-black/60 text-gray-400'}`}
                      >
                        Visualized Look
                      </button>
                    </div>
                  )}
                </div>

                {image && (
                  <div className="flex justify-between items-center px-2">
                    <button onClick={() => setImage(null)} className="text-gray-500 hover:text-red-500 text-sm">
                      <i className="fas fa-trash-alt mr-1"></i> Clear Photo
                    </button>
                    {results && (
                      <Button variant="outline" onClick={visualizeFullOutfit} disabled={editingColor} className="text-xs py-2 h-auto">
                        {editingColor ? 'Styling...' : 'Visualize Full Look'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer hover:bg-white/5 w-full h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-camera-retro text-5xl text-pink-500 mb-4"></i>
                <p className="text-xl font-bold mb-1">Drop your fit here</p>
                <p className="text-gray-400 text-sm">Let AI design your vibe</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="glass-card p-5 rounded-2xl border-pink-500/20 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Voice & Text Prefs</label>
              {isListening && <span className="text-[10px] text-pink-500 animate-pulse font-bold uppercase">Listening...</span>}
            </div>
            <div className="relative">
              <textarea 
                placeholder='e.g. "I want a baggy denim jacket" or "Add oversized vintage cargos"'
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 pr-14 text-sm focus:outline-none focus:border-pink-500 transition-all resize-none h-28 placeholder:text-gray-600"
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
              />
              <button 
                onClick={startListening}
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/40' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>
          </div>
          
          <Button onClick={getAdvice} className="w-full py-5 text-xl font-black rounded-2xl" disabled={!image || loading} isLoading={loading}>
            GENERATE VIBE
          </Button>
        </div>

        {/* Right Side: Results */}
        <div className="w-full md:w-1/2 space-y-6">
          {!results && !loading && (
            <div className="h-full glass-card p-12 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-wand-sparkles text-3xl text-pink-500"></i>
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">AI Stylist Ready</h3>
              <p className="text-gray-500 max-w-xs">Upload a photo and tell us if you want a jacket, baggy fit, or accessories.</p>
            </div>
          )}

          {loading && (
            <div className="h-full glass-card p-12 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 relative mb-8">
                <div className="absolute inset-0 border-8 border-pink-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-black mb-2 animate-pulse">DESIGNING...</h3>
              <p className="text-gray-500 italic">Mixing trends for your {user.bodyType} frame</p>
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-slideUp">
              {/* Vibe Summary */}
              <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                   <i className="fas fa-crown text-9xl"></i>
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-1">Your Vibe Is</h2>
                <h3 className="text-4xl font-black text-white leading-none">{results.vibeDescription}</h3>
              </div>

              {/* Build Section */}
              <div className="glass-card p-6 rounded-3xl border-l-4 border-pink-500">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">The Custom Fit Build</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Outerwear', value: results.outfitSuggestion.outerwear, icon: 'fa-vest' },
                    { label: 'Top', value: results.outfitSuggestion.top, icon: 'fa-tshirt' },
                    { label: 'Bottom', value: results.outfitSuggestion.bottom, icon: 'fa-shoe-prints' }, // Fa icon closest to pants
                    { label: 'Shoes', value: results.outfitSuggestion.shoes, icon: 'fa-socks' }
                  ].map((item, idx) => item.value && (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                          <i className={`fas ${item.icon}`}></i>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500">{item.label}</p>
                          <p className="font-bold text-white text-sm">{item.value}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => visualizeElement(`Add a ${item.value} to this photo.`)}
                        className="opacity-0 group-hover:opacity-100 bg-pink-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full transition-all"
                        disabled={editingColor}
                      >
                        PREVIEW
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessories & Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="glass-card p-5 rounded-3xl">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Add-Ons</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.outfitSuggestion.accessories.map((acc, i) => (
                        <button 
                          key={i} 
                          onClick={() => visualizeElement(`Add ${acc} to this styling.`)}
                          className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/5 font-bold transition-all"
                        >
                          + {acc}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="glass-card p-5 rounded-3xl">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Color Palette</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.complementaryColors.map((color, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => visualizeElement(`Modify the main suggested item to be ${color}.`)}
                          className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg relative group transition-transform hover:scale-110" 
                          style={{ backgroundColor: color }}
                          title={`Visualize ${color}`}
                        >
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-full">
                              <i className="fas fa-eye text-[10px]"></i>
                           </div>
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Tips */}
              <div className="glass-card p-6 rounded-3xl">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Stylist Notes</h4>
                <div className="space-y-4">
                  {results.stylingTips.map((tip, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-500 text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
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
