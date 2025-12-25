
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
    <div className="max-w-md w-full glass-card p-8 rounded-3xl animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">VibeCheck <span className="gradient-text">AI</span></h1>
        <p className="text-gray-400">Join the style revolution. Personalized for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
          <input 
            type="text" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
            placeholder="E.g. Alex Rivera"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
          <input 
            type="email" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
            placeholder="alex@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Body Type</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
              value={formData.bodyType}
              onChange={(e) => setFormData({...formData, bodyType: e.target.value as BodyType})}
            >
              {Object.values(BodyType).map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Style Vibe</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors"
              value={formData.styleVibe}
              onChange={(e) => setFormData({...formData, styleVibe: e.target.value as StyleVibe})}
            >
              {Object.values(StyleVibe).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full py-4 text-lg">
          Start Styling <i className="fas fa-arrow-right ml-2"></i>
        </Button>
      </form>
    </div>
  );
};

export default SignUp;
