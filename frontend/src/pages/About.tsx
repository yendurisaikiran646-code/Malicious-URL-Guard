import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold text-white">About the Project</h2>
        <p className="text-sm text-slate-400">Objectives, architecture, and technology stack.</p>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="font-bold text-white text-base">🎯 Project Overview</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          The Malicious URL Guard platform is an academic detection prototype combining pure lexical URL feature extraction,
          a Random Forest machine learning classifier, a responsive web dashboard, and a Manifest V3 browser extension.
          By analyzing lexical characteristics (such as character entropy, IP host indicators, subdomain counts, and suspicious tokens),
          the platform estimates malicious probability without ever requesting or downloading content from the target URL.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="font-bold text-white text-base">🏗️ Proposed Architecture</h3>
        <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400 leading-loose">
          User Navigation / Tab &rarr; Chromium Extension (Manifest V3) / Web Dashboard<br />
          &nbsp;&nbsp;&darr; HTTPS JSON request containing URL<br />
          Python FastAPI Backend (Validation + Feature Extraction + RF Inference)<br />
          &nbsp;&nbsp;&darr; Verdict & Probability<br />
          Warning Interstitial / Dashboard Safety Advice
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="font-bold text-white text-base">🛡️ Privacy and Safety Guarantees</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
          <li><strong>Zero Remote Calls:</strong> The target website is never contacted during feature extraction.</li>
          <li><strong>No Content Inspection:</strong> Passwords, session cookies, and DOM contents are neither collected nor monitored.</li>
          <li><strong>Query Parameter Stripping:</strong> Local history logs sanitize tokens, session IDs, and sensitive parameters.</li>
        </ul>
      </div>
    </div>
  );
};
