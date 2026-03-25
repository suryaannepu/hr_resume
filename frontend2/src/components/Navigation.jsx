import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Zap,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import useAuthStore from '../context/authStore';

export const Navigation = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('candidate-dark-mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#050505';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#eef2ff';
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('candidate-dark-mode', String(next));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path;

  const navItems = userRole === 'recruiter' ? [
    { path: '/recruiter-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/post-job', label: 'Post Job', icon: PlusCircle },
  ] : [
    { path: '/jobs', label: 'Browse Jobs', icon: Search },
    { path: '/candidate-dashboard', label: 'My Applications', icon: FileText },
    { path: '/ats-checker', label: 'ATS Checker', icon: Zap },
  ];

  return (
    <nav className={`sticky top-0 z-50 border-b shadow-sm transition-colors duration-300 ${darkMode ? 'bg-slate-900/95 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 h-16">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div>
              <img
                src="/resumex-logo.png"
                alt="ResumeX Logo"
                className="transform scale-150 origin-left"
                style={{
                  width: '160px',
                  height: 'auto',
                  objectFit: 'contain',
                  mixBlendMode: darkMode ? 'normal' : 'multiply',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                  ? darkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'
                  : darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}

            <div className={`w-px h-6 mx-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 mr-1 rounded-xl transition-all duration-300 border ${darkMode
                ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50 shadow-sm'
                }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-medium hidden lg:inline ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {user?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className={`md:hidden pb-4 border-t mt-2 pt-4 space-y-1 animate-fade-in-up ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex px-4 py-2 mb-2">
              <button onClick={toggleDarkMode} className={`flex w-full items-center justify-center gap-2 py-2 rounded-lg ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
                {darkMode ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
              </button>
            </div>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(item.path)
                  ? darkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'
                  : darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            <div className="border-t border-slate-100 my-2" />
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
