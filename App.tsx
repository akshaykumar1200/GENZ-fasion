
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import SignUp from './components/SignUp';
import OutfitPlanner from './components/OutfitPlanner';
import { TrackingService } from './services/tracking';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('desi_drip_user');
    let currentUser: UserProfile | null = null;

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      TrackingService.logAction('LOGIN', currentUser, 'User returned to session');
    }

    if (currentUser) {
      TrackingService.logAction('SESSION_START' as any, currentUser, 'Browser tab opened');
    }

    const handleTabClose = () => {
      if (currentUser) {
        TrackingService.logAction('SESSION_END' as any, currentUser, 'Browser tab closed');
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  const handleSignUp = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('desi_drip_user', JSON.stringify(newUser));
    TrackingService.logAction('SIGN_UP', newUser, 'New user registered');
  };

  const handleLogout = () => {
    if (user) {
      TrackingService.logAction('LOGOUT', user, 'Manual logout');
      setUser(null);
      localStorage.removeItem('desi_drip_user');
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Header */}
      <header className="p-6 md:px-12 flex items-center justify-between glass-card sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#FF9933] to-[#FF007F] rounded-[1rem] flex items-center justify-center rotate-3 shadow-lg shadow-pink-500/30">
            <i className="fas fa-fire-alt text-white text-2xl"></i>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter leading-none block">DESI DRIP</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-500/80">Check the drip</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Main Character</p>
              <p className="text-sm font-bold gradient-text">{user.name}</p>
            </div>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all flex items-center justify-center border border-white/10">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12 flex items-center justify-center">
        {!user ? (
          <SignUp onComplete={handleSignUp} />
        ) : (
          <OutfitPlanner user={user} />
        )}
      </main>

      {/* Footer */}
      <footer className="p-10 border-t border-white/5">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
             <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black uppercase tracking-widest">Desi Drip Labs &copy; {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
            <a href="#" className="hover:text-pink-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
