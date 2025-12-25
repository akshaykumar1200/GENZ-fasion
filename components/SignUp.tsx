
import React, { useState } from 'react';
import { BodyType, StyleVibe, UserProfile } from '../types';
import Button from './Button';

interface SignUpProps {
  onComplete: (user: UserProfile) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bodyType: BodyType.RECTANGLE,
    styleVibe: StyleVibe.STREETWEAR
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      signedUpAt: new Date().toISOString()
    };
    onComplete(newUser);
  };

  return (
    <div className="max-w-xl w-full glass-card p-10 md:p-14 rounded-[3rem] animate-fadeIn border-t-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-full text-[10px] font-black tracking-[0.3em] text-pink-500 uppercase mb-6">
          Establish Your Identity
        </div>
        <h1 className="text-6xl font-black mb-3 tracking-tighter leading-none">
          DESI <span className="gradient-text">DRIP</span>
        </h1>
        <p className="text-gray-400 font-medium tracking-tight">The ultimate cultural fit-check. No mid styles allowed.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-bold placeholder:text-gray-700 text-sm"
              placeholder="e.g. Aryan Malhotra"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-bold placeholder:text-gray-700 text-sm"
              placeholder="vibe@desidrip.ai"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
              <i className="fas fa-user-tag text-[8px]"></i> Body Structure
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(BodyType).map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setFormData({ ...formData, bodyType: bt })}
                  className={`px-4 py-3 rounded-xl text-[10px] font-bold border transition-all ${
                    formData.bodyType === bt 
                    ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20 scale-[1.05]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
              <i className="fas fa-bolt text-[8px]"></i> Style Aesthetic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(StyleVibe).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFormData({ ...formData, styleVibe: v })}
                  className={`px-4 py-3 rounded-xl text-[10px] font-bold border transition-all ${
                    formData.styleVibe === v 
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.05]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full py-6 text-xl font-black rounded-[2rem] group shadow-2xl shadow-pink-500/20">
            CLAIM YOUR DRIP <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
          </Button>
          <p className="text-center text-[10px] text-gray-600 mt-6 font-bold uppercase tracking-widest">
            Join 10k+ Desi icons globally
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
