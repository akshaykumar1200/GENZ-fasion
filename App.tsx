
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import SignUp from './components/SignUp';
import OutfitPlanner from './components/OutfitPlanner';
import Wardrobe from './components/Wardrobe';
import CalendarView from './components/CalendarView';
import { TrackingService } from './services/tracking';
import Button from './components/Button';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'calendar' | 'wardrobe' | 'settings'>('home');
  const [wardrobeStyledItem, setWardrobeStyledItem] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('desi_drip_user');
    let currentUser: UserProfile | null = null;

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      TrackingService.logAction('LOGIN', currentUser, 'Auto-login via storage');
    }

    const handleTabClose = () => {
      if (currentUser) {
        TrackingService.logAction('SESSION_END' as any, currentUser, 'Tab Closed');
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);

  const handleSignUp = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('desi_drip_user', JSON.stringify(newUser));
    TrackingService.logAction('SIGN_UP', newUser, 'User created account');
  };

  const handleLogout = () => {
    if (user) {
      TrackingService.logAction('LOGOUT', user, 'Intentional logout');
      setUser(null);
      localStorage.removeItem('desi_drip_user');
    }
  };

  const handleStyleWardrobeItem = (imageUrl: string) => {
    setWardrobeStyledItem(imageUrl);
    setActiveTab('search');
    TrackingService.logAction('WARDROBE_ADD' as any, user!, 'Transitioning item to AI Stylist');
  };

  const renderTabContent = () => {
    if (!user) return <SignUp onComplete={handleSignUp} />;

    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn px-6">
            <div className="w-32 h-32 bg-gradient-to-tr from-pink-500/10 to-orange-500/10 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-[0_0_80px_rgba(236,72,153,0.1)] relative">
              <div className="absolute inset-0 bg-pink-500/5 blur-2xl rounded-full"></div>
              <i className="fas fa-sparkles text-5xl text-pink-500 relative z-10"></i>
            </div>
            <h2 className="text-7xl font-black italic mb-6 tracking-tighter uppercase leading-[0.8] opacity-90">
              Future <br/> <span className="gradient-text">Drip</span>
            </h2>
            <p className="text-gray-500 max-w-sm font-medium mt-4 text-base leading-relaxed opacity-60">
              The laboratory is quiet. Head to <span className="text-pink-500 font-bold">Search</span> to start your fit-check or <span className="text-pink-500 font-bold">Wardrobe</span> to view your collection.
            </p>

            {/* Social Icons Section (In the lower bottom section of the home screen) */}
            <div className="mt-24 flex flex-col items-center gap-8">
              <div className="h-px w-12 bg-white/10"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-700">Connect to Collective</p>
              <div className="flex items-center gap-12">
                <a href="#" className="text-2xl text-gray-600 hover:text-pink-500 transition-all duration-500 hover:scale-125 hover:-translate-y-1"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-2xl text-gray-600 hover:text-green-500 transition-all duration-500 hover:scale-125 hover:-translate-y-1"><i className="fab fa-whatsapp"></i></a>
                <a href="#" className="text-2xl text-gray-600 hover:text-blue-500 transition-all duration-500 hover:scale-125 hover:-translate-y-1"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="text-2xl text-gray-600 hover:text-white transition-all duration-500 hover:scale-125 hover:-translate-y-1"><i className="fab fa-tiktok"></i></a>
              </div>
            </div>
          </div>
        );
      case 'search':
        return <OutfitPlanner user={user} initialImage={wardrobeStyledItem || undefined} onClearInitial={() => setWardrobeStyledItem(null)} />;
      case 'calendar':
        return <CalendarView user={user} />;
      case 'wardrobe':
        return <Wardrobe user={user} onStyleItem={handleStyleWardrobeItem} />;
      case 'settings':
        return (
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fadeIn pb-20">
            <div className="glass-card p-12 rounded-[4rem] border border-white/5 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full"></div>
              <h2 className="text-5xl font-black mb-12 italic uppercase tracking-tighter relative z-10">User Node</h2>
              <div className="space-y-8 relative z-10">
                <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 shadow-inner">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">Identity Verification</p>
                  <p className="font-bold text-2xl tracking-tight">{user.name}</p>
                  <p className="text-sm text-pink-500 font-bold mt-1">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-3">Physique</p>
                    <p className="font-bold text-base">{user.bodyType}</p>
                  </div>
                  <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-3">Core Vibe</p>
                    <p className="font-bold text-base">{user.styleVibe}</p>
                  </div>
                </div>
                <div className="pt-12 space-y-4">
                  <Button variant="outline" className="w-full py-6 rounded-[2rem]" onClick={() => window.location.reload()}>
                    Reset Session State
                  </Button>
                  <Button variant="danger" className="w-full py-5 rounded-[2rem]" onClick={handleLogout}>
                    Decommission Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-pink-500 selection:text-white pb-32">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full"></div>
      </div>

      <header className="p-6 md:px-12 flex items-center justify-between glass-card sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-11 h-11 bg-gradient-to-tr from-[#FF9933] to-[#FF007F] rounded-2xl flex items-center justify-center rotate-6 shadow-lg shadow-pink-500/30 group-hover:rotate-12 group-active:scale-90 transition-all duration-300">
            <i className="fas fa-fire-alt text-white text-xl"></i>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter leading-none block uppercase italic group-hover:tracking-normal transition-all">Desi Drip</span>
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-pink-500/80">Extraction v3.8</span>
          </div>
        </div>
        
        {user && (
          <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated</span>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 relative z-10">
        {renderTabContent()}
      </main>

      {user && (
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] glass-card border border-white/10 px-6 py-4 flex items-center justify-between w-[94%] max-w-lg rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
          {[
            { id: 'home', icon: 'fa-house' },
            { id: 'search', icon: 'fa-magnifying-glass' },
            { id: 'calendar', icon: 'fa-calendar-days' },
            { id: 'wardrobe', icon: 'fa-shirt' },
            { id: 'settings', icon: 'fa-gear' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                TrackingService.logAction('LOGIN' as any, user, `Tab navigation: ${tab.id}`);
              }}
              className="flex flex-col items-center justify-center relative outline-none py-1 group"
            >
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-[0_15px_35px_rgba(236,72,153,0.5)] -translate-y-4 scale-110' 
                  : 'text-gray-500 hover:text-white hover:bg-white/10'
              }`}>
                <i className={`fa-solid ${tab.icon} text-xl`}></i>
              </div>
              {activeTab === tab.id && (
                <div className="absolute -bottom-1 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_15px_#ec4899] animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default App;
