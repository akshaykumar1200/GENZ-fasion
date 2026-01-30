
import React, { useState } from 'react';
import { UserProfile, TripDetails, TripPlan } from '../types';
import { generateTripPlan } from '../services/geminiService';
import Button from './Button';

interface TravelPlannerProps {
  user: UserProfile;
}

const TravelPlanner: React.FC<TravelPlannerProps> = ({ user }) => {
  const [step, setStep] = useState<'details' | 'plan'>('details');
  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<TripDetails>({
    destination: '',
    startDate: '',
    endDate: '',
    purpose: 'Vacation',
    vehicle: 'Plane'
  });
  const [plan, setPlan] = useState<TripPlan | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateTripPlan(trip, user);
      setPlan(result);
      setStep('plan');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePacked = (idx: number) => {
    if (!plan) return;
    const newItems = [...plan.packingList];
    newItems[idx].isPacked = !newItems[idx].isPacked;
    setPlan({ ...plan, packingList: newItems });
  };

  if (step === 'details') {
    return (
      <div className="w-full max-w-xl mx-auto space-y-8 animate-slide-up px-4 pt-10 pb-32">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-cali text-white">Wanderlust</h2>
          <p className="text-gray-400 text-xs uppercase tracking-[0.3em]">Smart Packing Protocol</p>
        </div>

        <div className="ios-card p-8 rounded-3xl space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Destination</label>
            <input 
              value={trip.destination}
              onChange={e => setTrip({...trip, destination: e.target.value})}
              className="w-full bg-transparent border-b border-gray-800 py-3 text-xl font-serif-display placeholder-gray-800 focus:outline-none focus:border-white transition-colors"
              placeholder="Tokyo, Japan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Depart</label>
              <input 
                type="date"
                value={trip.startDate}
                onChange={e => setTrip({...trip, startDate: e.target.value})}
                className="w-full bg-transparent border-b border-gray-800 py-2 text-sm focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Return</label>
              <input 
                type="date"
                value={trip.endDate}
                onChange={e => setTrip({...trip, endDate: e.target.value})}
                className="w-full bg-transparent border-b border-gray-800 py-2 text-sm focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Vibe</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['Vacation', 'Business', 'Adventure', 'Party'].map((p) => (
                <button
                  key={p}
                  onClick={() => setTrip({...trip, purpose: p as any})}
                  className={`px-6 py-3 rounded-full text-xs font-bold transition-all border ${
                    trip.purpose === p ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Transport</label>
            <div className="grid grid-cols-4 gap-2">
              {['Plane', 'Car', 'Train', 'Bike'].map((v) => (
                <button
                  key={v}
                  onClick={() => setTrip({...trip, vehicle: v as any})}
                  className={`py-4 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-2 ${
                    trip.vehicle === v ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'
                  }`}
                >
                  <i className={`fas fa-${v === 'Plane' ? 'plane' : v === 'Car' ? 'car' : v === 'Train' ? 'train' : 'motorcycle'}`}></i>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} isLoading={loading} className="w-full mt-4">
            Create Manifesto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-serif-display capitalize">{trip.destination}</h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">{trip.startDate} — {trip.endDate}</p>
        </div>
        <button onClick={() => setStep('details')} className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
          <i className="fas fa-arrow-left"></i>
        </button>
      </div>

      <div className="ios-card p-6 rounded-3xl mb-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shrink-0 text-xl">
          <i className="fas fa-cloud-sun"></i>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Forecast Intelligence</p>
          <p className="text-sm font-medium leading-relaxed">{plan?.weatherSummary}</p>
        </div>
      </div>

      <div className="ios-card p-6 rounded-3xl mb-6 border-l-4 border-white">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Styling Strategy</p>
        <p className="text-lg font-serif-display italic">"{plan?.outfitStrategy}"</p>
      </div>

      <div className="space-y-6">
        {['Clothes', 'Toiletries', 'Tech', 'Documents'].map(category => {
          const items = plan?.packingList.filter(i => i.category === category) || [];
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xl font-cali mb-3 ml-2">{category}</h3>
              <div className="bg-neutral-900/50 rounded-3xl overflow-hidden">
                {items.map((item, idx) => {
                  const originalIdx = plan?.packingList.indexOf(item) || 0;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePacked(originalIdx)}
                      className={`p-5 flex items-center justify-between border-b border-gray-800 last:border-0 cursor-pointer transition-colors hover:bg-white/5`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.isPacked ? 'bg-white border-white' : 'border-gray-600'}`}>
                          {item.isPacked && <i className="fas fa-check text-black text-[10px]"></i>}
                        </div>
                        <div>
                          <p className={`font-medium text-sm transition-all ${item.isPacked ? 'text-gray-600 line-through' : 'text-white'}`}>{item.item}</p>
                          <p className="text-[10px] text-gray-600">{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {plan?.shoppingList.length && (
        <div className="mt-10 ios-card p-6 rounded-3xl">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Acquisition Required</p>
           <div className="flex flex-wrap gap-2">
             {plan.shoppingList.map((item, i) => (
               <span key={i} className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold">{item}</span>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default TravelPlanner;
