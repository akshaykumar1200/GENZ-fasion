
import React, { useState, useEffect } from 'react';
import { UserProfile, MonthlyPlan, DayPlan, WardrobeItem } from '../types';
import { getMonthlyStylePlan } from '../services/geminiService';
import { TrackingService } from '../services/tracking';

interface CalendarViewProps {
  user: UserProfile;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [occasions, setOccasions] = useState<{day: number, type: string}[]>([]);
  const [showOccasionInput, setShowOccasionInput] = useState<number | null>(null);
  const [occasionText, setOccasionText] = useState('');

  useEffect(() => {
    const savedPlan = localStorage.getItem(`desidrip_plan_${user.id}`);
    const savedCloset = localStorage.getItem(`desidrip_closet_${user.id}`);
    const savedOccasions = localStorage.getItem(`desidrip_occasions_${user.id}`);
    
    if (savedCloset) setWardrobe(JSON.parse(savedCloset));
    if (savedOccasions) setOccasions(JSON.parse(savedOccasions));
    
    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    } else {
      generatePlan();
    }
  }, [user.id]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      // Fetch latest wardrobe state from local storage again just in case
      const savedCloset = JSON.parse(localStorage.getItem(`desidrip_closet_${user.id}`) || '[]');
      const newPlan = await getMonthlyStylePlan(user, savedCloset, occasions);
      setPlan(newPlan);
      localStorage.setItem(`desidrip_plan_${user.id}`, JSON.stringify(newPlan));
      TrackingService.logAction('CALENDAR_GEN' as any, user, `Generated vault-linked plan with ${savedCloset.length} items`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOccasion = (day: number) => {
    if (!occasionText) return;
    const newOccasions = [...occasions, { day, type: occasionText }];
    setOccasions(newOccasions);
    localStorage.setItem(`desidrip_occasions_${user.id}`, JSON.stringify(newOccasions));
    setShowOccasionInput(null);
    setOccasionText('');
  };

  const getWardrobeItemImage = (id?: string) => {
    if (!id) return null;
    return wardrobe.find(item => item.id === id)?.imageUrl;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-10 animate-fadeIn">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-pink-500/20 rounded-full"></div>
          <div className="absolute inset-0 w-24 h-24 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <i className="fas fa-calendar-check absolute inset-0 flex items-center justify-center text-2xl text-pink-500 animate-pulse"></i>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl font-black italic tracking-tighter uppercase">Syncing Vault Data...</p>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Building your {plan?.month || 'Next Month'} schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 animate-fadeIn pb-24 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[80px] rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">The Schedule</h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-pink-600/20 text-pink-500 border border-pink-500/20 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              {plan?.month} {plan?.year}
            </span>
            <span className="text-gray-600 text-[9px] font-black uppercase tracking-widest">• {wardrobe.length} Items Linked</span>
          </div>
        </div>
        <button 
          onClick={generatePlan}
          className="relative z-10 bg-white/5 hover:bg-pink-600 hover:text-white border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:scale-95"
        >
          {plan ? 'Refresh with New Vault Items' : 'Generate First Plan'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
          <div key={i} className="hidden md:block text-center text-[10px] font-black text-gray-700 tracking-[0.4em] pb-4">{d}</div>
        ))}
        {plan?.plans.map((p) => {
          const itemImg = getWardrobeItemImage(p.wardrobeItemId);
          const hasOccasion = occasions.find(o => o.day === p.day);
          
          return (
            <div key={p.day} className="relative group">
              <button
                onClick={() => setSelectedDay(p)}
                className={`w-full aspect-square glass-card rounded-[2rem] flex flex-col items-center justify-center p-2 transition-all hover:scale-105 active:scale-95 border-2 relative overflow-hidden ${
                  selectedDay?.day === p.day ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_40px_rgba(236,72,153,0.3)]' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <span className="absolute top-3 left-4 text-[10px] font-black text-gray-500 z-10">{p.day}</span>
                
                {itemImg ? (
                  <img src={itemImg} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Item" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <i className="fas fa-shirt text-4xl"></i>
                  </div>
                )}

                {hasOccasion && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] animate-pulse z-10"></div>
                )}
                
                {p.isOccasion && (
                  <div className="absolute bottom-3 text-[8px] font-black text-pink-500 uppercase tracking-tighter bg-pink-500/10 px-2 rounded-full z-10">Occasion</div>
                )}
              </button>

              <button 
                onClick={() => setShowOccasionInput(p.day)}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-orange-500 hover:text-white"
              >
                <i className="fas fa-calendar-plus text-[10px]"></i>
              </button>
            </div>
          );
        })}
      </div>

      {showOccasionInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="glass-card p-10 rounded-[3rem] w-full max-w-md border border-white/10">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Mark Day {showOccasionInput} Event</h3>
            <input 
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-6 focus:outline-none focus:border-pink-500 text-lg font-bold"
              placeholder="e.g. Cousin's Mehndi, Job Interview..."
              value={occasionText}
              onChange={(e) => setOccasionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOccasion(showOccasionInput)}
            />
            <div className="flex gap-4">
              <button onClick={() => handleAddOccasion(showOccasionInput)} className="flex-1 bg-pink-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Mark Date</button>
              <button onClick={() => setShowOccasionInput(null)} className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp">
          <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-[60px] rounded-full"></div>
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <span className="w-16 h-16 rounded-[1.5rem] bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-2xl font-black text-pink-500 italic">
                  {selectedDay.day}
                </span>
                <div>
                  <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em]">{selectedDay.vibe}</p>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase">Daily Focus</h3>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-gray-600 hover:text-white text-xl p-2"><i className="fas fa-times"></i></button>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5">
                <p className="text-xl font-bold text-white italic tracking-tight leading-relaxed">"{selectedDay.outfit}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/10">
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-check-circle"></i> Style Rule
                  </p>
                  <p className="text-xs font-bold text-gray-300 leading-relaxed">{selectedDay.doWear}</p>
                </div>
                <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-times-circle"></i> Avoid
                  </p>
                  <p className="text-xs font-bold text-gray-300 leading-relaxed">{selectedDay.dontWear}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 blur-[60px] rounded-full"></div>
            <div className="relative z-10">
              <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.5em] mb-10">Color Synergy</h4>
              <div className="flex gap-4 mb-12">
                {selectedDay.colorPalette.map((color, idx) => (
                  <div key={idx} className="flex-1 group">
                    <div 
                      className="h-24 rounded-3xl border border-white/10 shadow-2xl transition-transform group-hover:-translate-y-2 duration-500"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-center text-[9px] font-black text-gray-600 mt-3 uppercase tracking-widest">{color}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10">
               {selectedDay.wardrobeItemId && (
                 <div className="flex items-center gap-6 p-6 bg-white/[0.03] rounded-[2rem] border border-white/5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                      <img src={getWardrobeItemImage(selectedDay.wardrobeItemId)!} className="w-full h-full object-cover" alt="Core Item" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-1">Core Vault Item</p>
                      <p className="font-bold text-white text-sm">Automated Link Established</p>
                    </div>
                 </div>
               )}
               <button className="w-full bg-gradient-to-r from-pink-600 to-orange-600 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-3xl mt-6 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Sync to Calendar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
