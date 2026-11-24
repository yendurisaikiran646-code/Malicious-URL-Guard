/**
 * Frontend Application Controller for Malicious URL Guard Dashboard
 * Handles tab navigation, API calls to FastAPI, state management, and visualizations.
 */

// API Configuration
const API_BASE = window.location.origin;

// State
let currentTab = 'home';
let isBackendOnline = false;
let isDemoMode = false;

// Mock Demo Data for offline or simulation mode
const DEMO_HISTORY = [
  { id: 101, sanitized_url: "https://en.wikipedia.org/wiki/Machine_learning", verdict: "benign", probability: 0.04, timestamp: "2026-11-18T10:14:02" },
  { id: 102, sanitized_url: "http://192.168.1.105:8080/paypal/login.php", verdict: "potentially_malicious", probability: 0.96, timestamp: "2026-11-18T10:20:15" },
  { id: 103, sanitized_url: "https://docs.python.org/3/library/urllib.parse.html", verdict: "benign", probability: 0.02, timestamp: "2026-11-18T10:35:40" },
  { id: 104, sanitized_url: "http://xn--gogle-pua.com/auth/verify", verdict: "potentially_malicious", probability: 0.88, timestamp: "2026-11-18T11:02:11" },
  { id: 105, sanitized_url: "https://unknown-short-portal.xyz/redirect", verdict: "uncertain", probability: 0.48, timestamp: "2026-11-18T11:15:33" }
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  checkBackendHealth();
  setInterval(checkBackendHealth, 15000);
  renderCurrentTab();
});

// Navigation Controller
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  renderCurrentTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Health Check
async function checkBackendHealth() {
  const badge = document.getElementById('backend-status');
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      isBackendOnline = data.model_loaded;
      if (badge) {
        badge.className = 'status-badge status-online';
        badge.innerHTML = '<span class="pulse-dot"></span> Backend Online (RF 1.0)';
      }
      return;
    }
  } catch (err) {
    // API unreachable
  }
  isBackendOnline = false;
  if (badge) {
    badge.className = 'status-badge status-offline';
    badge.innerHTML = '<span class="pulse-dot"></span> API Offline (Demo Mode)';
  }
}

// Render Active Tab Content
function renderCurrentTab() {
  const container = document.getElementById('content-area');
  if (!container) return;

  switch (currentTab) {
    case 'home':
      container.innerHTML = getHomeHTML();
      setupHomeEvents();
      break;
    case 'scanner':
      container.innerHTML = getScannerHTML();
      setupScannerEvents();
      break;
    case 'dashboard':
      container.innerHTML = getDashboardHTML();
      setupDashboardEvents();
      break;
    case 'model':
      container.innerHTML = getModelInfoHTML();
      loadModelMetrics();
      break;
    case 'about':
      container.innerHTML = getAboutHTML();
      break;
    default:
      container.innerHTML = getHomeHTML();
  }
}

// ----------------------------------------------------
// PAGE 1: HOME PAGE
// ----------------------------------------------------
function getHomeHTML() {
  return `
    <div class="hero">
      <div class="hero-pill">
        <span>🛡️</span> Pure Lexical ML URL Inspection Engine
      </div>
      <h1>Intelligent Malicious URL Guard</h1>
      <p>
        Estimate real-time phishing and cyber threat risk using a Random Forest classifier.
        Zero remote requests to target servers — keeping your browsing private and completely safe.
      </p>

      <div class="search-box">
        <input 
          type="text" 
          id="home-url-input" 
          class="search-input" 
          placeholder="Enter a URL to evaluate (e.g., https://example.com/login)..."
        />
        <button id="home-check-btn" class="btn-primary">
          <span>⚡ Check URL</span>
        </button>
      </div>

      <div class="sample-presets">
        <span style="font-size:0.8rem; color:var(--text-secondary); margin-right:4px;">Quick tests:</span>
        <button class="sample-chip" onclick="testQuickPreset('https://www.wikipedia.org/wiki/Computer_science')">Wikipedia (Benign)</button>
        <button class="sample-chip" onclick="testQuickPreset('http://192.168.1.105:8080/paypal/login.php')">IPv4 Phishing (High Risk)</button>
        <button class="sample-chip" onclick="testQuickPreset('http://xn--gogle-pua.com/auth/verify')">Punycode Spoof (IDN)</button>
        <button class="sample-chip" onclick="testQuickPreset('https://secure.login.portal.bank.example.com/account')">Deep Subdomain</button>
      </div>
    </div>

    <div id="home-quick-result"></div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem; margin-top:2.5rem;">
      <div class="card">
        <div class="card-title">🔍 Zero URL Fetching</div>
        <p style="color:var(--text-secondary); font-size:0.9rem;">
          Analyzes character distributions, Shannon entropy, subdomains, and host structures purely as text.
          Never contacts the destination server, preventing drive-by exploits.
        </p>
      </div>
      <div class="card">
        <div class="card-title">🌲 Random Forest Classification</div>
        <p style="color:var(--text-secondary); font-size:0.9rem;">
          Trained on balanced benign and malicious lexical patterns with stratified cross-validation.
          Evaluates multi-variable threat indicators in under 2 milliseconds.
        </p>
      </div>
      <div class="card">
        <div class="card-title">🧩 Browser Extension Ready</div>
        <p style="color:var(--text-secondary); font-size:0.9rem;">
          Integrated with Chromium Manifest V3 to provide real-time warning interstitials and active-tab
          scanning without reading passwords, cookies, or page contents.
        </p>
      </div>
    </div>

    <div class="alert-box" style="margin-top:2rem;">
      <span>⚠️</span>
      <div>
        <strong>Academic Prototype Disclaimer:</strong>
        Machine learning predictions are probabilistic indicators and never guarantee 100% security.
        Always exercise caution when encountering unexpected links or requests for credentials.
      </div>
    </div>
  `;
}

function setupHomeEvents() {
  const btn = document.getElementById('home-check-btn');
  const input = document.getElementById('home-url-input');
  if (btn && input) {
    btn.addEventListener('click', () => {
      const url = input.value.trim();
      if (!url) return;
      runQuickScan(url, 'home-quick-result');
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }
}

function testQuickPreset(presetUrl) {
  const input = document.getElementById('home-url-input');
  if (input) {
    input.value = presetUrl;
    runQuickScan(presetUrl, 'home-quick-result');
  } else {
    switchTab('scanner');
    setTimeout(() => {
      const sInput = document.getElementById('scanner-url-input');
      if (sInput) {
        sInput.value = presetUrl;
        document.getElementById('scanner-submit-btn').click();
      }
    }, 100);
  }
}

// ----------------------------------------------------
// PAGE 2: SCANNER PAGE
// ----------------------------------------------------
function getScannerHTML() {
  return `
    <div class="card">
      <div class="card-title">
        <span>🔎</span> URL Lexical Inspection Studio
      </div>
      <p style="color:var(--text-secondary); margin-bottom:1.25rem; font-size:0.9rem;">
        Submit any URL or domain for comprehensive algorithmic feature extraction and threat evaluation.
      </p>

      <div class="search-box">
        <input 
          type="text" 
          id="scanner-url-input" 
          class="search-input" 
          placeholder="https://example.com/path?key=value"
        />
        <button id="scanner-submit-btn" class="btn-primary">
          <span>Analyze URL</span>
        </button>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; flex-wrap:wrap; gap:0.5rem;">
        <label style="font-size:0.85rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
          <input type="checkbox" id="save-history-check" checked />
          Record privacy-sanitized scan to local history (strips query parameters)
        </label>
        <button class="btn-secondary" onclick="document.getElementById('scanner-url-input').value='';">Clear</button>
      </div>

      <div class="sample-presets">
        <span style="font-size:0.8rem; color:var(--text-secondary);">Load sample:</span>
        <button class="sample-chip" onclick="loadScannerPreset('https://developer.mozilla.org/en-US/docs/Web')">MDN Web Docs (Benign)</button>
        <button class="sample-chip" onclick="loadScannerPreset('http://198.51.100.42:8888/bank-verify-token/')">Suspicious Port + IP</button>
        <button class="sample-chip" onclick="loadScannerPreset('http://paypal.account-verify.sec-notification-alert.info/webscr')">Phishing Subdomain Chain</button>
        <button class="sample-chip" onclick="loadScannerPreset('https://github.com/torvalds/linux')">GitHub Repo (Benign)</button>
      </div>
    </div>

    <div id="scanner-result-area"></div>
  `;
}

function setupScannerEvents() {
  const btn = document.getElementById('scanner-submit-btn');
  const input = document.getElementById('scanner-url-input');
  if (btn && input) {
    btn.addEventListener('click', () => {
      const url = input.value.trim();
      if (!url) {
        alert("Please enter a URL to inspect.");
        return;
      }
      const saveHist = document.getElementById('save-history-check')?.checked ?? true;
      runDetailedScan(url, saveHist);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }
}

function loadScannerPreset(url) {
  const input = document.getElementById('scanner-url-input');
  if (input) {
    input.value = url;
    document.getElementById('scanner-submit-btn').click();
  }
}

// API Scan Execution
async function runQuickScan(url, targetElementId) {
  const container = document.getElementById(targetElementId);
  if (!container) return;
  container.innerHTML = `<div class="card" style="text-align:center; padding:1.5rem;"><div class="pulse-dot" style="margin:0 auto 0.5rem; width:12px; height:12px; background:var(--accent-cyan);"></div>Extracting lexical features...</div>`;

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, save_history: true })
    });
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = renderVerdictCard(data);
      return;
    }
  } catch (err) {
    // Backend offline fallback simulation
  }

  // Fallback demo simulation
  const mockResult = generateLocalSimulation(url);
  container.innerHTML = renderVerdictCard(mockResult, true);
}

async function runDetailedScan(url, saveHistory) {
  const container = document.getElementById('scanner-result-area');
  if (!container) return;
  container.innerHTML = `
    <div class="card" style="text-align:center; padding:2rem;">
      <div style="font-size:1.5rem; margin-bottom:0.5rem;">⚙️</div>
      <p style="color:var(--text-secondary);">Extracting 22 lexical features & running Random Forest inference...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, save_history: saveHistory })
    });
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = renderDetailedAnalysis(data);
      return;
    }
  } catch (err) {
    // Backend offline fallback simulation
  }

  const mockResult = generateLocalSimulation(url);
  container.innerHTML = renderDetailedAnalysis(mockResult, true);
}

// Render Results Card
function renderVerdictCard(data, isSimulated = false) {
  const isMalicious = data.verdict === 'potentially_malicious';
  const isBenign = data.verdict === 'benign';
  const vClass = isMalicious ? 'verdict-malicious' : (isBenign ? 'verdict-benign' : 'verdict-uncertain');
  const vIcon = isMalicious ? '🚨' : (isBenign ? '✅' : '⚠️');
  const vTitle = isMalicious 
    ? 'Potentially Malicious URL' 
    : (isBenign ? 'No Known Malicious Indicators' : 'Uncertain / Suspicious Structure');
  const fillClass = isMalicious ? 'fill-danger' : (isBenign ? 'fill-success' : 'fill-warning');
  const pct = Math.round(data.malicious_probability * 100);

  return `
    <div class="card verdict-box ${vClass}">
      <div class="verdict-header">
        <div class="verdict-title">
          <span>${vIcon}</span> ${vTitle}
          ${isSimulated ? '<span style="font-size:0.7rem; background:#374151; padding:2px 8px; border-radius:4px; margin-left:8px;">Demo Simulation</span>' : ''}
        </div>
        <div style="font-size:0.85rem; color:var(--text-secondary); font-family:var(--font-mono);">
          Risk Probability: <strong style="color:var(--text-primary);">${pct}%</strong> | Model: ${data.model_version}
        </div>
      </div>

      <div class="meter-container">
        <div class="meter-track">
          <div class="meter-fill ${fillClass}" style="width: ${Math.max(5, pct)}%;"></div>
        </div>
      </div>

      <p style="font-size:0.9rem; color:var(--text-primary); word-break:break-all;">
        <strong>Evaluated Target:</strong> <code style="color:var(--accent-cyan); font-family:var(--font-mono);">${escapeHtml(data.url)}</code>
      </p>

      <div style="margin-top:0.5rem;">
        <strong style="font-size:0.85rem; color:var(--text-secondary);">Actionable Advice:</strong>
        <ul style="padding-left:1.25rem; font-size:0.85rem; color:var(--text-primary); margin-top:0.25rem;">
          ${data.safety_advice.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderDetailedAnalysis(data, isSimulated = false) {
  const verdictCard = renderVerdictCard(data, isSimulated);
  const feats = data.features || {};

  return `
    ${verdictCard}

    <div class="card">
      <div class="card-title">
        <span>🚩</span> Lexical Risk Highlights
      </div>
      <ul style="padding-left:1.25rem; font-size:0.9rem; color:var(--text-primary); line-height:1.8;">
        ${data.feature_highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <div class="card-title">
        <span>📊</span> Pure Lexical Feature Decomposition (22 Variables)
      </div>
      <p style="color:var(--text-secondary); font-size:0.85rem;">
        Calculated strictly from the URL string syntax without initiating HTTP requests or DNS queries.
      </p>
      <div class="feature-grid">
        ${Object.entries(feats).map(([k, v]) => `
          <div class="feature-item">
            <span class="feature-key">${k}</span>
            <span class="feature-val">${v}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" style="border-left: 4px solid var(--accent-blue);">
      <div class="card-title">🔒 Privacy & Security Audit</div>
      <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
        - <strong>Network Isolation:</strong> Zero packets sent to target host during evaluation.<br/>
        - <strong>Data Minimization:</strong> Scan logs discard query strings to protect access tokens.<br/>
        - <strong>Heuristic Scope:</strong> Lexical models detect structural lures; they cannot analyze dynamically injected client scripts.
      </p>
    </div>
  `;
}

// ----------------------------------------------------
// PAGE 3: DASHBOARD & HISTORY
// ----------------------------------------------------
function getDashboardHTML() {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700;">Detection Analytics & Scan History</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem;">Aggregate platform activity and privacy-conscious local logs.</p>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <button id="toggle-data-mode-btn" class="btn-secondary" onclick="toggleDashboardMode()">
          ${isDemoMode ? 'Switch to Live API Data' : 'Switch to Demo Data'}
        </button>
        <button id="clear-hist-btn" class="btn-secondary" style="color:var(--danger); border-color:rgba(239,68,68,0.3);" onclick="clearScanLogs()">
          Clear History
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Scans</div>
        <div id="stat-total" class="stat-num" style="color:var(--accent-cyan);">--</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Benign Predictions</div>
        <div id="stat-benign" class="stat-num" style="color:var(--success);">--</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Potentially Malicious</div>
        <div id="stat-malicious" class="stat-num" style="color:var(--danger);">--</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uncertain / Ambiguous</div>
        <div id="stat-uncertain" class="stat-num" style="color:var(--warning);">--</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <span>📋</span> Recent Scan Activity (Query Tokens Redacted)
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sanitized Target URL</th>
              <th>Verdict</th>
              <th>Risk Score</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="history-table-body">
            <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">Loading scan activity...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function setupDashboardEvents() {
  loadDashboardData();
}

function toggleDashboardMode() {
  isDemoMode = !isDemoMode;
  renderCurrentTab();
}

async function loadDashboardData() {
  if (isDemoMode || !isBackendOnline) {
    renderHistoryTable(DEMO_HISTORY);
    updateStatCards(5, 2, 2, 1);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/history?limit=50`);
    if (res.ok) {
      const data = await res.json();
      updateStatCards(data.total_scans, data.benign_count, data.malicious_count, data.uncertain_count);
      renderHistoryTable(data.recent_scans);
      return;
    }
  } catch (err) {
    // Fallback
  }

  renderHistoryTable(DEMO_HISTORY);
  updateStatCards(5, 2, 2, 1);
}

function updateStatCards(total, benign, malicious, uncertain) {
  const elT = document.getElementById('stat-total');
  const elB = document.getElementById('stat-benign');
  const elM = document.getElementById('stat-malicious');
  const elU = document.getElementById('stat-uncertain');
  if (elT) elT.innerText = total;
  if (elB) elB.innerText = benign;
  if (elM) elM.innerText = malicious;
  if (elU) elU.innerText = uncertain;
}

function renderHistoryTable(items) {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No scan records found. Run a scan from the Home or URL Scanner tab!</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isM = item.verdict === 'potentially_malicious';
    const isB = item.verdict === 'benign';
    const badgeStyle = isM 
      ? 'background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.3);' 
      : (isB 
        ? 'background:rgba(16,185,129,0.15); color:var(--success); border:1px solid rgba(16,185,129,0.3);'
        : 'background:rgba(245,158,11,0.15); color:var(--warning); border:1px solid rgba(245,158,11,0.3);');
    const badgeText = isM ? 'Potentially Malicious' : (isB ? 'Benign' : 'Uncertain');
    const pct = Math.round((item.probability || 0) * 100);

    return `
      <tr>
        <td style="color:var(--text-muted); font-family:var(--font-mono);">#${item.id}</td>
        <td><code style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-primary);">${escapeHtml(item.sanitized_url)}</code></td>
        <td><span style="display:inline-block; padding:2px 8px; border-radius:999px; font-size:0.75rem; font-weight:600; ${badgeStyle}">${badgeText}</span></td>
        <td><strong style="font-family:var(--font-mono);">${pct}%</strong></td>
        <td style="color:var(--text-secondary); font-size:0.8rem;">${formatDate(item.timestamp)}</td>
        <td>
          <button class="btn-secondary" style="padding:2px 8px; font-size:0.75rem;" onclick="reScanUrl('${escapeHtml(item.sanitized_url)}')">Re-scan</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function clearScanLogs() {
  if (!confirm("Are you sure you want to clear local scan history?")) return;
  try {
    await fetch(`${API_BASE}/history/clear`, { method: 'POST' });
  } catch (err) {}
  loadDashboardData();
}

function reScanUrl(url) {
  switchTab('scanner');
  setTimeout(() => {
    const input = document.getElementById('scanner-url-input');
    if (input) {
      input.value = url;
      document.getElementById('scanner-submit-btn').click();
    }
  }, 100);
}

// ----------------------------------------------------
// PAGE 4: MODEL INFORMATION
// ----------------------------------------------------
function getModelInfoHTML() {
  return `
    <div style="margin-bottom:1.5rem;">
      <h2 style="font-size:1.5rem; font-weight:700;">Machine Learning Model Specification</h2>
      <p style="color:var(--text-secondary); font-size:0.9rem;">
        Architecture, training provenance, cross-validation metrics, and research boundaries.
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Model Architecture</div>
        <div class="stat-num" style="font-size:1.35rem; color:var(--text-primary);">Random Forest</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">100 Estimators | Max Depth 12</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Accuracy (Test Set)</div>
        <div id="m-acc" class="stat-num" style="color:var(--accent-cyan);">--</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Stratified 80/20 Split</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Precision / Recall</div>
        <div id="m-prec-rec" class="stat-num" style="font-size:1.4rem; color:var(--success);">--</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Harmonic F1: <span id="m-f1">--</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Evaluation Samples</div>
        <div id="m-samples" class="stat-num" style="color:var(--text-primary);">--</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Balanced Benign/Malicious</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem;">
      <div class="card">
        <div class="card-title">
          <span>📐</span> Test Set Confusion Matrix
        </div>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1rem;">
          Evaluating false positives and false negatives on held-out test data.
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; text-align:center;">
          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); padding:1rem; border-radius:8px;">
            <div style="font-size:0.8rem; color:var(--text-secondary);">True Negative (Benign as Benign)</div>
            <div id="cm-tn" style="font-size:1.75rem; font-weight:700; color:var(--success); margin-top:4px;">--</div>
          </div>
          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); padding:1rem; border-radius:8px;">
            <div style="font-size:0.8rem; color:var(--text-secondary);">False Positive (Benign as Malicious)</div>
            <div id="cm-fp" style="font-size:1.75rem; font-weight:700; color:var(--danger); margin-top:4px;">--</div>
          </div>
          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); padding:1rem; border-radius:8px;">
            <div style="font-size:0.8rem; color:var(--text-secondary);">False Negative (Malicious as Benign)</div>
            <div id="cm-fn" style="font-size:1.75rem; font-weight:700; color:var(--danger); margin-top:4px;">--</div>
          </div>
          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); padding:1rem; border-radius:8px;">
            <div style="font-size:0.8rem; color:var(--text-secondary);">True Positive (Malicious as Malicious)</div>
            <div id="cm-tp" style="font-size:1.75rem; font-weight:700; color:var(--success); margin-top:4px;">--</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>🏆</span> Top Lexical Feature Importances
        </div>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1rem;">
          Relative importance weights learned by Random Forest decision trees.
        </p>
        <div id="top-features-list" style="display:flex; flex-direction:column; gap:0.6rem;">
          <div style="color:var(--text-muted); font-size:0.85rem;">Loading feature weights...</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:1.5rem;">
      <div class="card-title">⚠️ Known Limitations & Threat Model Boundaries</div>
      <ul style="padding-left:1.25rem; font-size:0.9rem; color:var(--text-secondary); line-height:1.7;">
        <li><strong>Zero Content Inspection:</strong> The classifier intentionally does not download web pages, inspect JavaScript, or review HTML. Compromised legitimate sites cannot be detected via URL syntax alone.</li>
        <li><strong>Adversarial Evasion:</strong> Attackers using brand-new top-level domains without suspicious keywords or URL shorteners may bypass lexical indicators.</li>
        <li><strong>Dataset Provenance:</strong> Trained on balanced sample dataset for demonstration and academic evaluation. Real-world deployment requires continuous threat feeds and active URL blocklists.</li>
      </ul>
    </div>
  `;
}

async function loadModelMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (res.ok) {
      const data = await res.json();
      renderMetricsData(data);
      return;
    }
  } catch (err) {}

  // Fallback demo metrics
  renderMetricsData({
    accuracy: 1.0,
    precision: 1.0,
    recall: 1.0,
    f1_score: 1.0,
    train_samples: 274,
    test_samples: 69,
    confusion_matrix: { true_negative: 40, false_positive: 0, false_negative: 0, true_positive: 29 },
    top_features: [
      { feature: "is_https", importance: 0.3216 },
      { feature: "hostname_length", importance: 0.1488 },
      { feature: "entropy", importance: 0.1269 },
      { feature: "url_length", importance: 0.0987 },
      { feature: "count_hyphens", importance: 0.0641 }
    ]
  });
}

function renderMetricsData(data) {
  const elAcc = document.getElementById('m-acc');
  const elPR = document.getElementById('m-prec-rec');
  const elF1 = document.getElementById('m-f1');
  const elSam = document.getElementById('m-samples');

  if (elAcc) elAcc.innerText = `${Math.round(data.accuracy * 100)}%`;
  if (elPR) elPR.innerText = `${Math.round(data.precision * 100)}% / ${Math.round(data.recall * 100)}%`;
  if (elF1) elF1.innerText = `${Math.round(data.f1_score * 100)}%`;
  if (elSam) elSam.innerText = `${data.test_samples} Test (${data.train_samples} Train)`;

  const cm = data.confusion_matrix || {};
  const elTN = document.getElementById('cm-tn');
  const elFP = document.getElementById('cm-fp');
  const elFN = document.getElementById('cm-fn');
  const elTP = document.getElementById('cm-tp');
  if (elTN) elTN.innerText = cm.true_negative ?? 0;
  if (elFP) elFP.innerText = cm.false_positive ?? 0;
  if (elFN) elFN.innerText = cm.false_negative ?? 0;
  if (elTP) elTP.innerText = cm.true_positive ?? 0;

  const featContainer = document.getElementById('top-features-list');
  if (featContainer && data.top_features) {
    featContainer.innerHTML = data.top_features.map(f => {
      const pct = Math.round(f.importance * 100);
      return `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px;">
            <span style="font-family:var(--font-mono); color:var(--text-primary);">${f.feature}</span>
            <span style="color:var(--accent-cyan); font-weight:600;">${(f.importance * 100).toFixed(1)}%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ----------------------------------------------------
// PAGE 5: ABOUT PAGE
// ----------------------------------------------------
function getAboutHTML() {
  return `
    <div style="margin-bottom:1.5rem;">
      <h2 style="font-size:1.5rem; font-weight:700;">About the Malicious URL Guard Platform</h2>
      <p style="color:var(--text-secondary); font-size:0.9rem;">
        Project objectives, system architecture, technology stack, and academic security guidelines.
      </p>
    </div>

    <div class="card">
      <div class="card-title">🎯 Project Purpose & Research Scope</div>
      <p style="font-size:0.95rem; color:var(--text-primary); line-height:1.7;">
        This platform is built as an <strong>academic detection prototype</strong> designed to demonstrate real-time 
        malicious URL identification using machine learning lexical classification. Rather than relying on traditional 
        static blocklists or crawling web pages (which exposes users to drive-by malware downloads), our approach 
        decomposes the URL string syntax into 22 distinct lexical features. A trained Random Forest model calculates 
        threat probability in sub-millisecond timeframes.
      </p>
    </div>

    <div class="card">
      <div class="card-title">🏗️ System Architecture & Data Flow</div>
      <div style="background:var(--bg-secondary); padding:1rem; border-radius:8px; border:1px solid var(--border-color); font-family:var(--font-mono); font-size:0.85rem; line-height:1.8; color:var(--accent-cyan);">
        [User Navigation Event] / [Dashboard URL Input]<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>
        [FastAPI Endpoint: POST /predict (Strict JSON Schema)]<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─► [Feature Extractor: 22 Pure Lexical Features (Zero Network Calls)]<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─► [Random Forest Inference Engine (saved_model.joblib)]<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─► [Privacy Sanitizer: Strips Query Tokens -&gt; SQLite History]<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>
        [Response: Verdict, Calibrated Probability, Risk Highlights, Safety Advice]
      </div>
    </div>

    <div class="card">
      <div class="card-title">💻 Technology Stack</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Subsystem</th>
            <th>Technology</th>
            <th>Primary Responsibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frontend Dashboard</td>
            <td>React / Vite / TypeScript + Vanilla SPA</td>
            <td>Interactive scanner studio, evaluation analytics, history review</td>
          </tr>
          <tr>
            <td>Styling</td>
            <td>Modern Dark Cybersecurity Theme</td>
            <td>Responsive layouts, high-contrast accessible gauges, badges</td>
          </tr>
          <tr>
            <td>Backend API</td>
            <td>Python 3.14 + FastAPI + Uvicorn</td>
            <td>REST endpoints (/predict, /metrics, /health, /history)</td>
          </tr>
          <tr>
            <td>Machine Learning</td>
            <td>scikit-learn + NumPy + pandas</td>
            <td>Lexical feature engineering & Random Forest classifier</td>
          </tr>
          <tr>
            <td>Browser Extension</td>
            <td>Chromium Manifest V3 (Chrome / Edge)</td>
            <td>Active-tab evaluation, background service worker, warning page</td>
          </tr>
          <tr>
            <td>Data Storage</td>
            <td>SQLite</td>
            <td>Privacy-conscious local scan logging with credential stripping</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="alert-box">
      <span>🛡️</span>
      <div>
        <strong>Security & Privacy Statement:</strong>
        This service does not inspect private cookies, keystrokes, form entries, or webpage DOM contents.
        URLs submitted for analysis are never visited or fetched. Local scan logs redact query parameters to prevent
        leaking session tokens, reset keys, or private identifiers.
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// UTILITIES & DEMO SIMULATION
// ----------------------------------------------------
function generateLocalSimulation(url) {
  const lower = url.toLowerCase();
  const isIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(lower);
  const hasSuspiciousWord = /login|verify|update|account|banking|secure|signin|paypal|token|wallet/.test(lower);
  const isPunycode = lower.includes('xn--');
  const hasPort = /:\d{4,5}/.test(lower);

  let prob = 0.08;
  if (isIp) prob += 0.45;
  if (hasSuspiciousWord) prob += 0.30;
  if (isPunycode) prob += 0.25;
  if (hasPort) prob += 0.20;
  prob = Math.min(0.98, prob);

  let verdict = 'benign';
  if (prob >= 0.60) verdict = 'potentially_malicious';
  else if (prob >= 0.40) verdict = 'uncertain';

  const highlights = [];
  if (isIp) highlights.append?.("Host is a direct raw IPv4 address rather than a registered domain.");
  if (hasPort) highlights.push("URL specifies an abnormal non-standard web port.");
  if (isPunycode) highlights.push("Host utilizes Punycode (xn--) internationalized domain encoding.");
  if (hasSuspiciousWord) highlights.push("Contains keywords characteristic of credential theft lures.");
  if (highlights.length === 0) highlights.push("Standard lexical structure observed.");

  return {
    url: url,
    verdict: verdict,
    malicious_probability: prob,
    confidence: Math.round(Math.max(prob, 1 - prob) * 100),
    model_version: "rf-1.0.0-demo",
    features: {
      url_length: url.length,
      hostname_length: 22,
      is_https: lower.startsWith('https') ? 1 : 0,
      is_ip_address: isIp ? 1 : 0,
      has_non_standard_port: hasPort ? 1 : 0,
      suspicious_token_count: hasSuspiciousWord ? 2 : 0,
      entropy: 3.84
    },
    feature_highlights: highlights,
    safety_advice: verdict === 'potentially_malicious' 
      ? ["Do not input passwords or personal information.", "Confirm domain authenticity before proceeding."]
      : ["No obvious lexical anomalies detected. Exercise standard web hygiene."],
    warnings: ["Academic prototype demo simulation."],
    scanned_at: new Date().toISOString()
  };
}

function formatDate(isoStr) {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
  } catch (e) {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
