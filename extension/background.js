/**
 * Background Service Worker for URLGuard AI Extension
 * Handles API queries, navigation monitoring, and interstitial warning triggers.
 */

const DEFAULT_API_BASE = "http://127.0.0.1:8000";

// Retrieve configured API base from chrome storage or default
async function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || DEFAULT_API_BASE);
    });
  });
}

// Check URL against the FastAPI backend
async function checkUrl(url) {
  // Ignore browser internal schemes
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    return { status: "ignored", reason: "Internal browser scheme" };
  }

  const apiBase = await getApiBase();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${apiBase}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url, save_history: true }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { status: "success", data: data };
    } else {
      return { status: "error", message: `Server error: ${response.status}` };
    }
  } catch (err) {
    // Report Scan unavailable when backend is offline or timed out
    return { status: "unavailable", message: "Scan unavailable (API offline or unreachable)" };
  }
}

// Message Listener for Popup and Content queries
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scan_url") {
    checkUrl(request.url).then((result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "trigger_warning") {
    const warningUrl = chrome.runtime.getURL(
      `warning.html?url=${encodeURIComponent(request.url)}&prob=${request.prob || 0}`
    );
    if (sender.tab && sender.tab.id) {
      chrome.tabs.update(sender.tab.id, { url: warningUrl });
    } else {
      chrome.tabs.create({ url: warningUrl });
    }
    sendResponse({ status: "ok" });
    return true;
  }
});
