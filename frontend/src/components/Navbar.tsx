import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isOnline }) => {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'scanner', label: 'URL Scanner' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'model', label: 'Model Info' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
          🛡️
        </div>
        <span className="font-bold text-lg text-white tracking-tight">
          URLGuard <span className="text-cyan-400 font-normal">AI</span>
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div
        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        {isOnline ? 'Backend Online' : 'API Offline (Demo Mode)'}
      </div>
    </header>
  );
};
