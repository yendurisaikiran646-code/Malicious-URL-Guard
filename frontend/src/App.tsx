import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { Dashboard } from './pages/Dashboard';
import { ModelInfoPage } from './pages/ModelInfo';
import { About } from './pages/About';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const [selectedScanUrl, setSelectedScanUrl] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.checkHealth();
        setIsOnline(res.model_loaded);
      } catch {
        setIsOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScanRequest = (url: string) => {
    setSelectedScanUrl(url);
    setActiveTab('scanner');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} />

      <main className="flex-1 px-4 sm:px-6 py-6">
        {activeTab === 'home' && <Home onCheckUrl={handleScanRequest} />}
        {activeTab === 'scanner' && <Scanner initialUrl={selectedScanUrl} />}
        {activeTab === 'dashboard' && <Dashboard onReScan={handleScanRequest} />}
        {activeTab === 'model' && <ModelInfoPage />}
        {activeTab === 'about' && <About />}
      </main>

      <Footer />
    </div>
  );
};
