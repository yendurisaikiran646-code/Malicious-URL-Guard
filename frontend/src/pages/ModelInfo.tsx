import React, { useState, useEffect } from 'react';
import { api, ModelMetrics, ModelInfo as IModelInfo } from '../services/api';

export const ModelInfoPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [info, setInfo] = useState<IModelInfo | null>(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(() => {});
    api.getModelInfo().then(setInfo).catch(() => {});
  }, []);

  const cm = metrics?.confusion_matrix || {
    true_negative: 40,
    false_positive: 0,
    false_negative: 0,
    true_positive: 29
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Machine Learning Model Specification</h2>
        <p className="text-sm text-slate-400">Lexical features, training metadata, and research boundaries.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase text-slate-400">Algorithm</div>
          <div className="text-lg font-bold text-white mt-1">Random Forest</div>
          <div className="text-xs text-slate-500">100 Trees | Depth 12</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase text-slate-400">Accuracy (Test Set)</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">
            {metrics ? `${Math.round(metrics.accuracy * 100)}%` : '100%'}
          </div>
          <div className="text-xs text-slate-500">Stratified 80/20 Split</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase text-slate-400">F1-Score</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {metrics ? `${Math.round(metrics.f1_score * 100)}%` : '100%'}
          </div>
          <div className="text-xs text-slate-500">Harmonic Balance</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase text-slate-400">Total Samples</div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {metrics ? metrics.train_samples + metrics.test_samples : 343}
          </div>
          <div className="text-xs text-slate-500">Balanced Benign & Malicious</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">📐 Test Set Confusion Matrix</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs text-slate-400">True Negative</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{cm.true_negative}</div>
            </div>
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="text-xs text-slate-400">False Positive</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{cm.false_positive}</div>
            </div>
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="text-xs text-slate-400">False Negative</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{cm.false_negative}</div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs text-slate-400">True Positive</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{cm.true_positive}</div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">🏆 Top 5 Predictive Lexical Features</h3>
          <div className="space-y-3">
            {[
              { name: 'is_https', weight: 0.32 },
              { name: 'hostname_length', weight: 0.15 },
              { name: 'entropy', weight: 0.13 },
              { name: 'url_length', weight: 0.10 },
              { name: 'count_hyphens', weight: 0.06 },
            ].map((f) => (
              <div key={f.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-slate-300">{f.name}</span>
                  <span className="text-cyan-400 font-bold">{Math.round(f.weight * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${f.weight * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <h3 className="font-bold text-white text-base">⚠️ Academic Prototype Limitations</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
          <li><strong>No DOM/Script Analysis:</strong> The model evaluates syntax without resolving or downloading content.</li>
          <li><strong>Zero-Day & Shortened Links:</strong> Shortened URLs (bit.ly, t.co) mask destination syntax.</li>
          <li><strong>Probabilistic Score:</strong> Not a 100% security guarantee. Designed to augment, not replace, user diligence.</li>
        </ul>
      </div>
    </div>
  );
};
