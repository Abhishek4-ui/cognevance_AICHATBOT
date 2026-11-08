import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, MessageSquare, BarChart3, Database, Shield, Settings, 
  User, LogOut, Sparkles, Brain, Cpu, Menu, X, History 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, authOnly: true },
    { id: 'history', label: 'History', icon: History, authOnly: true },
    { id: 'nlp', label: 'NLP Engine', icon: Brain, authOnly: false },
    { id: 'models', label: 'Model Perf', icon: Cpu, authOnly: false },
    { id: 'datasets', label: 'Datasets', icon: Database, authOnly: false },
    { id: 'predictai', label: 'PredictAI', icon: BarChart3, authOnly: false },
    { id: 'admin', label: 'Admin Hub', icon: Shield, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, authOnly: true },
  ];

  const handleNav = (id) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-navy-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNav(isAuthenticated ? 'chat' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] glow-cyan">
              <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center group-hover:bg-opacity-80 transition-all">
                <Brain className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent">
                NeuroChat<span className="text-cyan-400 font-mono text-sm ml-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">AI</span>
              </span>
              <p className="text-[10px] text-cyan-400 font-mono tracking-wider font-semibold">ENTERPRISE NLP & ML</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              if (item.authOnly && !isAuthenticated) return null;
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 glow-cyan'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNav('profile')}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-800/80 border border-slate-700/60 hover:border-cyan-500/40 text-xs text-slate-200 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-medium max-w-[100px] truncate">{user?.username}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[9px] font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </button>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-1 bg-navy-900">
          {navItems.map((item) => {
            if (item.authOnly && !isAuthenticated) return null;
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNav('profile')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  <span>{user?.username} ({user?.role})</span>
                  <User className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2 text-center text-xs font-semibold border border-slate-700 rounded-lg text-slate-200"
                >
                  Log in
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2 text-center text-xs font-semibold bg-cyan-500 text-black rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
