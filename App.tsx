
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import SignUp from './components/SignUp';
import OutfitPlanner from './components/OutfitPlanner';
import { TrackingService } from './services/tracking';
import Button from './components/Button';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
        TrackingService.logAction('SESSION_END' as any, currentUser, 'Tab Closed/Redirected');
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

  return (
    <div className="min-h-screen flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Dynamic Data Sync Header */}
      <div className="bg-neutral-900/80 backdrop-blur-md py-1 px-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live Analytics Sync Active</span>
        </div>
        <button 
          onClick={() => TrackingService.exportData()} 
          className="text-[8px] font-black uppercase tracking-widest text-pink-500 hover:text-white transition-colors"
        >
          Export Raw Logs <i className="fas fa-download ml-1"></i>
        </button>
      </div>

      <header className="p-6 md:px-12 flex items-center justify-between glass-card sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#FF9933] to-[#FF007F] rounded-[1rem] flex items-center justify-center rotate-3 shadow-lg shadow-pink-500/30">
            <i className="fas fa-fire-alt text-white text-2xl"></i>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter leading-none block">DESI DRIP</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-500/80">Extraction v2.1</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDownload(true)}
            className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black border border-white/10 transition-all uppercase tracking-widest"
          >
            <i className="fab fa-apple"></i>
            <i className="fab fa-google-play"></i>
            Get App
          </button>

          {user && (
            <div className="flex items-center gap-6 border-l border-white/10 pl-6">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest leading-none mb-1">Authenticated</p>
                <p className="text-sm font-bold gradient-text">{user.name}</p>
              </div>
              <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all flex items-center justify-center border border-white/10">
                <i className="fas fa-power-off"></i>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 flex items-center justify-center">
        {!user ? (
          <SignUp onComplete={handleSignUp} />
        ) : (
          <OutfitPlanner user={user} />
        )}
      </main>

      {/* Download Modal */}
      {showDownload && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="max-w-md w-full glass-card p-10 rounded-[3rem] text-center relative border border-white/10">
            <button onClick={() => setShowDownload(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">CROSS-PLATFORM DRIP</h2>
            <p className="text-gray-400 font-medium mb-10">Download to sync your outfit history and analytics across devices.</p>
            <div className="space-y-4">
              <Button className="w-full py-5 rounded-2xl flex justify-center gap-4">
                <i className="fab fa-apple text-xl"></i> iOS App
              </Button>
              <Button variant="secondary" className="w-full py-5 rounded-2xl flex justify-center gap-4">
                <i className="fab fa-google-play text-xl"></i> Android
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-10 border-t border-white/5 opacity-60">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Extraction Layer Active</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
            <a href="#" className="hover:text-pink-500">Docs</a>
            <a href="#" className="hover:text-pink-500">Privacy</a>
            <a href="#" className="hover:text-pink-500">Data Hub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
