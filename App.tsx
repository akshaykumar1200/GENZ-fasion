
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import SignUp from './components/SignUp';
import OutfitPlanner from './components/OutfitPlanner';
import Button from './components/Button';
import { TrackingService } from './services/tracking';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Check for existing session and manage lifecycle logs
  useEffect(() => {
    const savedUser = localStorage.getItem('vibecheck_user');
    let currentUser: UserProfile | null = null;

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      TrackingService.logAction('LOGIN', currentUser, 'User returned to session');
    }

    // Log Session Start
    if (currentUser) {
      TrackingService.logAction('SESSION_START' as any, currentUser, 'Browser tab opened');
    }

    // Capture "Drop-off" points (Closing tab/Refreshing)
    const handleTabClose = () => {
      if (currentUser) {
        TrackingService.logAction('SESSION_END' as any, currentUser, 'Browser tab closed or refreshed');
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  const handleSignUp = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('vibecheck_user', JSON.stringify(newUser));
    TrackingService.logAction('SIGN_UP', newUser, 'New user registration captured');
    TrackingService.logAction('SESSION_START' as any, newUser, 'Initial session after signup');
  };

  const handleLogout = () => {
    if (user) {
      TrackingService.logAction('LOGOUT', user, 'User manually logged out');
      setUser(null);
      localStorage.removeItem('vibecheck_user');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between glass-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-bolt text-white text-xl"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter">VIBECHECK</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs text-gray-400">Styling for</p>
              <p className="text-sm font-bold">{user.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-pink-500/50 p-0.5">
              <img src={`https://picsum.photos/seed/${user.id}/100`} className="w-full h-full rounded-full" alt="Avatar" />
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-12 flex items-center justify-center">
        {!user ? (
          <SignUp onComplete={handleSignUp} />
        ) : (
          <OutfitPlanner user={user} />
        )}
      </main>

      {/* Sidebar Overlay for Spreadsheet Visualization */}
      {showStats && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-end">
          <div className="w-full max-w-3xl h-full bg-[#0d0d0d] border-l border-white/10 p-8 overflow-y-auto animate-slideLeft">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <i className="fas fa-table text-green-500"></i> Google Sheets Data Mirror
                </h2>
                <p className="text-gray-500 text-sm">Real-time capture of every entry, exit, and style interaction.</p>
              </div>
              <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-medium text-gray-400">Timestamp</th>
                    <th className="p-4 font-medium text-gray-400">User</th>
                    <th className="p-4 font-medium text-gray-400">Action</th>
                    <th className="p-4 font-medium text-gray-400">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {TrackingService.getDailyStats().reverse().map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-xs font-mono text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-4">
                        <div className="font-medium text-white">{log.userName || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-500">{log.userEmail}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          log.action === 'SIGN_UP' ? 'bg-blue-500/20 text-blue-400' :
                          log.action === 'SESSION_START' ? 'bg-green-500/20 text-green-400' :
                          log.action === 'SESSION_END' ? 'bg-red-500/20 text-red-400' :
                          log.action === 'RECOMMENDATION_GEN' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-xs italic">
                        {log.details}
                        <div className="hidden group-hover:block mt-2 text-[9px] text-gray-600 bg-white/5 p-2 rounded">
                          {JSON.stringify(log.metadata)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Connection Status</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs">Spreadsheet Sync: Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Metadata Capture: Detailed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer / CTA Section */}
      <footer className="p-8 glass-card mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="font-bold text-lg">Download VibeCheck Pro</h4>
            <p className="text-sm text-gray-400">Get 1-on-1 stylist calls and closet digitizing.</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="secondary" className="px-8 rounded-full border border-white/10">
              <i className="fab fa-apple mr-2"></i> App Store
            </Button>
            <Button variant="secondary" className="px-8 rounded-full border border-white/10">
              <i className="fab fa-google-play mr-2"></i> Play Store
            </Button>
          </div>

          <div className="flex gap-4">
             <button 
                onClick={() => setShowStats(true)}
                className="text-xs uppercase tracking-widest text-green-500/60 hover:text-green-500 transition-colors font-bold"
              >
                Open Admin Tracker <i className="fas fa-database ml-1"></i>
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
