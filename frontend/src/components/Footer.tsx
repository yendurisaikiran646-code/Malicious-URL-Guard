import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/40 py-6 px-6 text-center text-xs text-slate-500 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          <span className="font-semibold text-slate-400">URLGuard AI</span> — Academic Machine Learning Prototype
        </div>
        <div>FastAPI &bull; Random Forest &bull; Manifest V3 Chromium Extension</div>
      </div>
    </footer>
  );
};
