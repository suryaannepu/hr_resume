import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

export const Navigation = ({ userRole }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-50 bg-slate-925/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300">
              ⚡
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">Agentic AI Hiring</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {userRole === 'recruiter' ? (
              <>
                <button onClick={() => navigate('/recruiter-dashboard')} className="btn-ghost">📊 Dashboard</button>
                <button onClick={() => navigate('/post-job')} className="btn-ghost">➕ Post Job</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/jobs')} className="btn-ghost">🔍 Browse Jobs</button>
                <button onClick={() => navigate('/candidate-dashboard')} className="btn-ghost">📋 My Applications</button>
              </>
            )}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="btn-ghost text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                Logout
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-slate-400 hover:text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4 space-y-2 animate-slide-up">
            {userRole === 'recruiter' ? (
              <>
                <button onClick={() => { navigate('/recruiter-dashboard'); setMenuOpen(false); }} className="block w-full text-left btn-ghost">📊 Dashboard</button>
                <button onClick={() => { navigate('/post-job'); setMenuOpen(false); }} className="block w-full text-left btn-ghost">➕ Post Job</button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/jobs'); setMenuOpen(false); }} className="block w-full text-left btn-ghost">🔍 Browse Jobs</button>
                <button onClick={() => { navigate('/candidate-dashboard'); setMenuOpen(false); }} className="block w-full text-left btn-ghost">📋 My Applications</button>
              </>
            )}
            <button onClick={handleLogout} className="block w-full text-left btn-ghost text-rose-400">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};
