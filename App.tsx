
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import SignUp from './components/SignUp';
import OutfitPlanner from './components/OutfitPlanner';
import Wardrobe from './components/Wardrobe';
import CalendarView from './components/CalendarView';
import TravelPlanner from './components/TravelPlanner';
import { TrackingService } from './services/tracking';
import Button from './components/Button';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'calendar' | 'wardrobe' | 'travel' | 'settings'>('home');
  const [wardrobeStyledItem, setWardrobeStyledItem] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('desi_drip_user');
    let currentUser: UserProfile | null = null;

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      TrackingService.logAction('LOGIN', currentUser, 'Auto-login via storage');
    }
  }, []);

  const handleSignUp = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('desi_drip_user', JSON.stringify(newUser));
    TrackingService.logAction('SIGN_UP', newUser, 'User created account');
  };

  const handleLogout = () => {
    if (user) {
      setUser(null);
      localStorage.removeItem('desi_drip_user');
    }
  };

  const handleStyleWardrobeItem = (imageUrl: string) => {
    setWardrobeStyledItem(imageUrl);
    setActiveTab('search');
  };

  const renderTabContent = () => {
    if (!user) return <SignUp onComplete={handleSignUp} />;

    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in px-6">
            <h1 className="text-8xl font-cali mb-2 text-white">Desi Drip</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.6em] mb-12">Gen Z Styling Intelligence</p>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button onClick={() => setActiveTab('search')} className="ios-card p-6 rounded-3xl hover:bg-white hover:text-black transition-colors group">
                <i className="fas fa-magic text-2xl mb-3"></i>
                <p className="text-[10px] font-bold uppercase tracking-widest">Fit Check</p>
              </button>
              <button onClick={() => setActiveTab('wardrobe')} className="ios-card p-6 rounded-3xl hover:bg-white hover:text-black transition-colors group">
                <i className="fas fa-layer-group text-2xl mb-3"></i>
                <p className="text-[10px] font-bold uppercase tracking-widest">Vault</p>
              </button>
              <button onClick={() => setActiveTab('calendar')} className="ios-card p-6 rounded-3xl hover:bg-white hover:text-black transition-colors group">
                <i className="far fa-calendar text-2xl mb-3"></i>
                <p className="text-[10px] font-bold uppercase tracking-widest">Plan</p>
              </button>
              <button onClick={() => setActiveTab('travel')} className="ios-card p-6 rounded-3xl hover:bg-white hover:text-black transition-colors group">
                <i className="fas fa-plane text-2xl mb-3"></i>
                <p className="text-[10px] font-bold uppercase tracking-widest">Travel</p>
              </button>
            </div>
          </div>
        );
      case 'search':
        return <OutfitPlanner user={user} initialImage={wardrobeStyledItem || undefined} onClearInitial={() => setWardrobeStyledItem(null)} />;
      case 'calendar':
        return <CalendarView user={user} />;
      case 'wardrobe':
        return <Wardrobe user={user} onStyleItem={handleStyleWardrobeItem} />;
      case 'travel':
        return <TravelPlanner user={user} />;
      case 'settings':
        return (
          <div className="w-full max-w-md mx-auto space-y-8 animate-slide-up pt-12 px-4">
             <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center text-4xl text-black font-serif-display mb-4">
                  {user.name.charAt(0)}
                </div>
                <h2 className="text-3xl font-serif-display">{user.name}</h2>
                <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">{user.styleVibe}</p>
             </div>
             
             <div className="space-y-4">
               <div className="ios-card p-5 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium">Notifications</span>
                  <div className="w-10 h-6 bg-white rounded-full relative"><div className="w-4 h-4 bg-black rounded-full absolute top-1 right-1"></div></div>
               </div>
               <div className="ios-card p-5 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium">Dark Mode</span>
                  <div className="w-10 h-6 bg-green-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
               </div>
               <Button variant="danger" className="w-full mt-8" onClick={handleLogout}>Deactivate</Button>
             </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-28">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full opacity-30"></div>
      </div>

      <main className="flex-1 relative z-10">
        {renderTabContent()}
      </main>

      {user && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-2xl border border-white/10 px-2 py-2 flex items-center justify-between gap-2 rounded-full shadow-2xl w-[90%] max-w-md">
          {[
            { id: 'home', icon: 'fa-house' },
            { id: 'search', icon: 'fa-search' },
            { id: 'wardrobe', icon: 'fa-layer-group' },
            { id: 'calendar', icon: 'fa-calendar' },
            { id: 'travel', icon: 'fa-plane' },
            { id: 'settings', icon: 'fa-user' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white text-black scale-105' 
                  : 'text-gray-500 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className={`fas ${tab.icon} text-sm`}></i>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default App;
