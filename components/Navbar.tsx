
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, AppNotification, Role } from '../types.ts';

interface NavbarProps {
  user: User;
  appName: string;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, appName, onLogout, notifications, onMarkRead, onClearAll }) => {
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">{appName.charAt(0)}</div>
            <span className="text-xl font-bold text-indigo-900">{appName}</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className={`text-sm font-medium ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-600'}`}>Beranda</Link>
            <Link to="/profile" className={`text-sm font-medium ${location.pathname === '/profile' ? 'text-indigo-600' : 'text-slate-600'}`}>Profil</Link>
            {user.role === Role.ADMIN && (
              <>
                <Link to="/admin/payouts" className={`text-sm font-medium ${location.pathname === '/admin/payouts' ? 'text-indigo-600' : 'text-slate-600'}`}>Gaji</Link>
                <Link to="/settings" className={`text-sm font-medium ${location.pathname === '/settings' ? 'text-indigo-600' : 'text-slate-600'}`}>Pengaturan</Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user.role === Role.ADMIN && (
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 text-slate-400 hover:text-indigo-600 relative transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-sm">Notifikasi</h4>
                      {notifications.length > 0 && (
                        <button onClick={onClearAll} className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Tandai Semua Selesai</button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">Tidak ada notifikasi baru</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b hover:bg-slate-50 transition-colors">
                            <p className="font-bold text-xs text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-[9px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</span>
                              <button
                                onClick={() => onMarkRead(n.id)}
                                className="text-[9px] font-bold text-indigo-600 uppercase"
                              >
                                Selesaikan
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Keluar</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
