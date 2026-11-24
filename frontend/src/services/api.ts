/**
 * Central API Client for FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface PredictionResult {
  url: string;
  verdict: 'potentially_malicious' | 'benign' | 'uncertain';
  malicious_probability: number;
  confidence: number;
  model_version: string;
  features: Record<string, number>;
  feature_highlights: string[];
  safety_advice: string[];
  warnings: string[];
  scanned_at: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  train_samples: number;
  test_samples: number;
  top_features: Array<{ feature: string; importance: number }>;
  dataset_notes: string;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  algorithm: string;
  trained_at: string;
  n_estimators: number;
  max_depth: number;
  feature_count: number;
  feature_list: string[];
  limitations: string[];
  academic_disclaimer: string;
}

export interface ScanRecord {
  id: number;
  sanitized_url: string;
  verdict: string;
  probability: number;
  timestamp: string;
}

export interface ScanHistory {
  total_scans: number;
  benign_count: number;
  malicious_count: number;
  uncertain_count: number;
  recent_scans: ScanRecord[];
}

export const api = {
  async checkHealth(): Promise<{ status: string; model_loaded: boolean; model_version: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('API offline');
    return res.json();
  },

  async predict(url: string, saveHistory = true): Promise<PredictionResult> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, save_history: saveHistory })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getMetrics(): Promise<ModelMetrics> {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model-info`);
    if (!res.ok) throw new Error('Failed to fetch model info');
    return res.json();
  },

  async getHistory(limit = 50): Promise<ScanHistory> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async clearHistory(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/history/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  }
};
