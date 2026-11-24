/**
 * Popup Script for URLGuard AI
 * Obtains active tab URL, coordinates with background worker or direct API, and renders verdicts.
 */

let activeTabUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  const urlDisplay = document.getElementById("current-url");
  const scanBtn = document.getElementById("scan-btn");

  // Query active tab URL
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0 && tabs[0].url) {
      activeTabUrl = tabs[0].url;
      urlDisplay.textContent = activeTabUrl;

      // Disable scan button for internal browser pages
      if (
        activeTabUrl.startsWith("chrome://") ||
        activeTabUrl.startsWith("edge://") ||
        activeTabUrl.startsWith("about:")
      ) {
        urlDisplay.textContent = "Internal browser page (scanning not applicable)";
        scanBtn.disabled = true;
        return;
      }
    } else {
      urlDisplay.textContent = "Unable to read active tab URL.";
      scanBtn.disabled = true;
    }
  } catch (err) {
    urlDisplay.textContent = "Error querying tab: " + err.message;
  }

  scanBtn.addEventListener("click", () => {
    if (activeTabUrl) {
      performScan(activeTabUrl);
    }
  });
});

async function performScan(url) {
  const scanBtn = document.getElementById("scan-btn");
  const btnText = document.getElementById("btn-text");
  const resultBox = document.getElementById("result-container");
  const statusBox = document.getElementById("status-message");

  scanBtn.disabled = true;
  btnText.textContent = "Analyzing Lexical Features...";
  statusBox.classList.add("hidden");
  resultBox.classList.add("hidden");

  chrome.runtime.sendMessage({ action: "scan_url", url: url }, (response) => {
    scanBtn.disabled = false;
    btnText.textContent = "⚡ Re-scan Tab";

    if (!response) {
      showStatus("Scan unavailable (Service worker not responding).");
      return;
    }

    if (response.status === "unavailable") {
      showStatus(response.message || "Scan unavailable (Backend API offline).");
      return;
    }

    if (response.status === "error") {
      showStatus("Scan error: " + (response.message || "Unknown error"));
      return;
    }

    if (response.status === "success" && response.data) {
      renderResults(response.data);
    }
  });
}

function renderResults(data) {
  const resultBox = document.getElementById("result-container");
  const banner = document.getElementById("verdict-banner");
  const icon = document.getElementById("verdict-icon");
  const text = document.getElementById("verdict-text");
  const barFill = document.getElementById("risk-bar-fill");
  const pctText = document.getElementById("risk-percentage");
  const adviceList = document.getElementById("advice-list");
  const highlightsList = document.getElementById("highlights-list");

  banner.className = "verdict-banner";
  const pct = Math.round(data.malicious_probability * 100);
  pctText.textContent = `${pct}%`;
  barFill.style.width = `${Math.max(5, pct)}%`;

  if (data.verdict === "potentially_malicious") {
    banner.classList.add("banner-malicious");
    icon.textContent = "🚨";
    text.textContent = "Potentially Malicious URL";
    barFill.style.backgroundColor = "#ef4444";
  } else if (data.verdict === "benign") {
    banner.classList.add("banner-benign");
    icon.textContent = "✅";
    text.textContent = "No Known Malicious Indicators";
    barFill.style.backgroundColor = "#10b981";
  } else {
    banner.classList.add("banner-uncertain");
    icon.textContent = "⚠️";
    text.textContent = "Uncertain / Suspicious Structure";
    barFill.style.backgroundColor = "#f59e0b";
  }

  adviceList.innerHTML = (data.safety_advice || [])
    .slice(0, 3)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  highlightsList.innerHTML = (data.feature_highlights || [])
    .slice(0, 3)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  resultBox.classList.remove("hidden");
}

function showStatus(msg) {
  const statusBox = document.getElementById("status-message");
  statusBox.textContent = msg;
  statusBox.classList.remove("hidden");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
