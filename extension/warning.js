/**
 * Interstitial Warning Controller for URLGuard AI
 */

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get("url") || "Unknown Target URL";
  const prob = parseFloat(params.get("prob") || "0.85");

  const urlDisplay = document.getElementById("flagged-url");
  const pillDisplay = document.getElementById("risk-score-pill");
  const safetyBtn = document.getElementById("safety-btn");
  const overrideBtn = document.getElementById("override-btn");

  urlDisplay.textContent = targetUrl;
  const pct = Math.round(prob * 100);
  pillDisplay.textContent = `Estimated Malicious Risk: ${pct}%`;

  // Return to safety: go back or close tab
  safetyBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });

  // Academic prototype override: proceed to URL
  overrideBtn.addEventListener("click", () => {
    if (confirm("ACADEMIC PROTOTYPE OVERRIDE:\nThis site has been flagged as potentially malicious. Are you certain you wish to proceed?")) {
      window.location.href = targetUrl;
    }
  });
});
