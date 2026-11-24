import React, { useState, useEffect } from 'react';
import { api, PredictionResult } from '../services/api';

interface ScannerProps {
  initialUrl?: string;
}

export const Scanner: React.FC<ScannerProps> = ({ initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [saveHistory, setSaveHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      handleAnalyze(initialUrl);
    }
  }, [initialUrl]);

  const handleAnalyze = async (targetUrl = url) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.predict(targetUrl.trim(), saveHistory);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔎</span> URL Lexical Inspection Studio
        </h2>
        <p className="text-sm text-slate-400">
          Decompose any uniform resource locator into 22 structural signals.
        </p>

        <div className="flex gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-700 focus-within:border-cyan-500">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2 text-white outline-none placeholder:text-slate-500 font-mono text-sm"
            placeholder="https://example.com/login"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-95 disabled:opacity-50 text-sm"
          >
            {loading ? 'Evaluating...' : 'Analyze URL'}
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveHistory}
              onChange={(e) => setSaveHistory(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700"
            />
            Record privacy-sanitized scan to local history (strips query parameters)
          </label>
          <button onClick={() => setUrl('')} className="hover:text-white underline">
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-xl border ${
              result.verdict === 'potentially_malicious'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                : result.verdict === 'benign'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-xl">
                {result.verdict === 'potentially_malicious'
                  ? '🚨 Potentially Malicious URL'
                  : result.verdict === 'benign'
                  ? '✅ No Known Malicious Indicators'
                  : '⚠️ Uncertain / Ambiguous Structure'}
              </span>
              <span className="text-sm font-mono font-semibold">
                Risk Score: {Math.round(result.malicious_probability * 100)}%
              </span>
            </div>

            <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full ${
                  result.verdict === 'potentially_malicious'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                    : result.verdict === 'benign'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                }`}
                style={{ width: `${Math.max(5, Math.round(result.malicious_probability * 100))}%` }}
              />
            </div>

            <p className="font-mono text-sm break-all text-slate-200 mb-4">
              <strong>URL:</strong> {result.url}
            </p>

            <div className="space-y-1 text-sm">
              <strong>Actionable Advice:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {result.safety_advice.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-base">🚩 Lexical Risk Highlights</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
              {result.feature_highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">📊 Complete Lexical Feature Vector</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(result.features).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between text-xs">
                  <span className="font-mono text-slate-400">{key}</span>
                  <span className="font-bold text-white">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
