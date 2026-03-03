// On page load, check if alert is active and show banner
chrome.storage.local.get(["alertActive", "alertPrice", "priceThreshold"], (data) => {
  if (data.alertActive && data.alertPrice) {
    showBanner(data.alertPrice, data.priceThreshold ?? 250);
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.alertActive) {
    if (changes.alertActive.newValue === true) {
      chrome.storage.local.get(["alertPrice", "priceThreshold"], (data) => {
        if (data.alertPrice) showBanner(data.alertPrice, data.priceThreshold ?? 250);
      });
    } else {
      const banner = document.getElementById("walmart-price-alert-banner");
      if (banner) banner.remove();
    }
  }
});

function showBanner(price, threshold) {
  if (document.getElementById("walmart-price-alert-banner")) return;

  const banner = document.createElement("div");
  banner.id = "walmart-price-alert-banner";
  banner.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 2147483647;
      background: linear-gradient(135deg, #0071ce 0%, #004c91 100%);
      color: white;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      animation: wptSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <style>
        @keyframes wptSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes wptPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        #wpt-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; }
        #wpt-left { display: flex; align-items: center; gap: 14px; }
        #wpt-icon { font-size: 28px; animation: wptPulse 2s ease-in-out infinite; }
        #wpt-text h3 { margin: 0 0 2px 0; font-size: 15px; font-weight: 700; }
        #wpt-text p { margin: 0; font-size: 13px; opacity: 0.88; }
        #wpt-text strong { font-size: 18px; font-weight: 800; color: #ffd700; }
        #wpt-actions { display: flex; align-items: center; gap: 10px; }
        #wpt-buy {
          background: #ffd700; color: #004c91; border: none;
          padding: 8px 18px; border-radius: 6px; font-weight: 700;
          font-size: 13px; cursor: pointer; text-decoration: none;
          display: inline-block; transition: transform 0.1s;
        }
        #wpt-buy:hover { transform: scale(1.04); }
        #wpt-close {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
          color: white; width: 30px; height: 30px; border-radius: 50%; font-size: 16px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s; flex-shrink: 0; line-height: 1;
        }
        #wpt-close:hover { background: rgba(255,255,255,0.3); }
      </style>
      <div id="wpt-inner">
        <div id="wpt-left">
          <div id="wpt-icon">🎧</div>
          <div id="wpt-text">
            <h3>⚡ AirPods Pro 3 Price Alert!</h3>
            <p>Price dropped to <strong>$${price.toFixed(2)}</strong> — below your $${threshold} threshold on Walmart!</p>
          </div>
        </div>
        <div id="wpt-actions">
          <a id="wpt-buy" href="https://www.walmart.com/ip/AirPods-Pro-3/17835006350" target="_blank">Buy Now →</a>
          <button id="wpt-close" title="Dismiss">✕</button>
        </div>
      </div>
    </div>
  `;

  document.body.prepend(banner);

  document.getElementById("wpt-close").onclick = () => {
    chrome.runtime.sendMessage({ action: "dismissAll" });
  };
}
