import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, Bug, Settings, 
  Sparkles, LogOut, User as UserIcon,
  ChevronLeft, ChevronRight, Terminal
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { useAuthState } from 'react-firebase-hooks/auth';

export const Sidebar = () => {
  const [user] = useAuthState(auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/generate', icon: <PlusCircle size={18} />, label: 'New Project' },
    { to: '/ide', icon: <Terminal size={18} />, label: 'Web IDE' },
    { to: '/debug', icon: <Bug size={18} />, label: 'Debug Assistant' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <div className={`relative h-full flex flex-col p-6 bg-black/60 backdrop-blur-3xl z-30 border-r border-white/5 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/20 hover:scale-110 transition-all z-50 hover:bg-white hover:text-black cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`mt-2 mb-12 transition-all duration-300 ${isCollapsed ? 'flex justify-center ml-0' : ''}`}>
        <Logo collapsed={isCollapsed} />
      </div>

      <nav className="flex-1 space-y-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden border ${
                isActive
                  ? 'bg-white/[0.06] text-white border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                  : 'text-white/40 hover:text-white border-transparent hover:bg-white/[0.03]'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? link.label : ''}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-1/2 bg-white rounded-r-full shadow-[0_0_8px_white]" />
                )}
                <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110'}`}>
                   {link.icon}
                </div>
                {!isCollapsed && <span className="font-bold text-sm tracking-wide truncate">{link.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-6 pt-6 relative">
		    {/* Elegant fade out for bottom scroll */}
		    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {user && (
          <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] ${isCollapsed ? 'flex-col gap-4 py-4 px-2' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center overflow-hidden border border-white/20 shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                 {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                 ) : (
                  <UserIcon size={14} className="text-white/60" />
                 )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{user.displayName}</span>
                  <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] mt-0.5">Pro Developer</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="text-white/20 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        
        {!isCollapsed ? (
          <div className="pt-2">
            <div className="flex items-center gap-2 px-5 py-4 bg-black border border-white/10 rounded-2xl justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Engine Status</span>
              <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                <span className="text-[9px] text-white font-bold uppercase tracking-widest pl-1">Ready</span>
                <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-2">
             <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.8)] border border-black" />
          </div>
        )}
      </div>
    </div>
  );
};
