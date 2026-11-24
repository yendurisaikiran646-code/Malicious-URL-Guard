import React, { useState, useEffect } from 'react';
import { api, ScanHistory, ScanRecord } from '../services/api';

interface DashboardProps {
  onReScan: (url: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onReScan }) => {
  const [data, setData] = useState<ScanHistory | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const demoData: ScanHistory = {
    total_scans: 5,
    benign_count: 2,
    malicious_count: 2,
    uncertain_count: 1,
    recent_scans: [
      { id: 1, sanitized_url: 'https://en.wikipedia.org/wiki/Data_science', verdict: 'benign', probability: 0.04, timestamp: '2026-11-18T10:14:02' },
      { id: 2, sanitized_url: 'http://192.168.1.105:8080/paypal/login.php', verdict: 'potentially_malicious', probability: 0.96, timestamp: '2026-11-18T10:20:15' },
      { id: 3, sanitized_url: 'https://github.com/torvalds/linux', verdict: 'benign', probability: 0.02, timestamp: '2026-11-18T10:35:40' },
      { id: 4, sanitized_url: 'http://xn--gogle-pua.com/auth/verify', verdict: 'potentially_malicious', probability: 0.88, timestamp: '2026-11-18T11:02:11' },
      { id: 5, sanitized_url: 'https://unknown-short-portal.xyz/redirect', verdict: 'uncertain', probability: 0.48, timestamp: '2026-11-18T11:15:33' },
    ]
  };

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setData(demoData);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getHistory(50);
      setData(res);
    } catch {
      setData(demoData);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemo]);

  const handleClear = async () => {
    if (!confirm('Clear local scan logs?')) return;
    try {
      await api.clearHistory();
      loadData();
    } catch (e) {
      alert('Failed to clear history');
    }
  };

  const activeData = data || demoData;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Detection Analytics & Scan History</h2>
          <p className="text-sm text-slate-400">Aggregate platform telemetry and privacy-sanitized scan records.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDemo(!isDemo)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 border border-slate-700"
          >
            {isDemo ? 'Use Live API' : 'Use Demo Simulation'}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-xs font-medium text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400">Total Scans</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">{activeData.total_scans}</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400">Benign</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{activeData.benign_count}</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400">Malicious Flags</div>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">{activeData.malicious_count}</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400">Uncertain</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{activeData.uncertain_count}</div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base">Recent Activity (Query Parameters Stripped)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Sanitized Target URL</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeData.recent_scans.map((r: ScanRecord) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-500">#{r.id}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-200 break-all">{r.sanitized_url}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.verdict === 'potentially_malicious'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : r.verdict === 'benign'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {r.verdict}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs font-bold text-white">
                    {Math.round(r.probability * 100)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onReScan(r.sanitized_url)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Re-scan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
