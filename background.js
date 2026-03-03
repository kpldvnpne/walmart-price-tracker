const WALMART_URL = "https://www.walmart.com/ip/AirPods-Pro-3/17835006350";
const DEFAULT_THRESHOLD = 250;
const DEFAULT_INTERVAL = 1;

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["priceThreshold", "checkInterval"], (data) => {
      resolve({
        threshold: data.priceThreshold ?? DEFAULT_THRESHOLD,
        interval: data.checkInterval ?? DEFAULT_INTERVAL,
      });
    });
  });
}

async function resetAlarm() {
  const { interval } = await getSettings();
  await chrome.alarms.clearAll();
  chrome.alarms.create("priceCheck", { periodInMinutes: interval });
}

// Create alarm on install/startup
chrome.runtime.onInstalled.addListener(async () => {
  const { interval } = await getSettings();
  chrome.alarms.create("priceCheck", { periodInMinutes: interval });
  checkPrice();
});

chrome.runtime.onStartup.addListener(async () => {
  const { interval } = await getSettings();
  chrome.alarms.create("priceCheck", { periodInMinutes: interval });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "priceCheck") {
    checkPrice();
  }
});

async function checkPrice() {
  const { threshold } = await getSettings();

  try {
    const response = await fetch(WALMART_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const html = await response.text();
    const price = extractPrice(html);
    const lastChecked = new Date().toLocaleTimeString();

    if (price !== null) {
      chrome.storage.local.set({ lastPrice: price, lastChecked, error: null });

      if (price < threshold) {
        chrome.storage.local.set({ alertActive: true, alertPrice: price });
        injectBannerInAllTabs(price, threshold);
      } else {
        chrome.storage.local.set({ alertActive: false });
      }
    } else {
      chrome.storage.local.set({ lastChecked, error: "Could not parse price" });
    }
  } catch (err) {
    chrome.storage.local.set({ error: err.message, lastChecked: new Date().toLocaleTimeString() });
  }
}

function extractPrice(html) {
  const patterns = [
    /"priceInfo":\{"currentPrice":\{"price":(\d+(?:\.\d+)?)/,
    /"currentPrice":\{"price":(\d+(?:\.\d+)?)/,
    /itemprop="price"\s+content="(\d+(?:\.\d+)?)"/,
    /"price":(\d+(?:\.\d+)?),"currencyUnit":"USD"/,
    /\$(\d+\.\d{2})/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

async function injectBannerInAllTabs(price, threshold) {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showBanner,
        args: [price, threshold]
      });
    } catch (e) {}
  }
}

async function dismissBannerInAllTabs() {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const banner = document.getElementById("walmart-price-alert-banner");
          if (banner) {
            banner.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            banner.style.transform = "translateY(-100%)";
            banner.style.opacity = "0";
            setTimeout(() => banner.remove(), 300);
          }
        }
      });
    } catch (e) {}
  }
}

function showBanner(price, threshold) {
  if (document.getElementById("walmart-price-alert-banner")) return;

  const banner = document.createElement("div");
  banner.id = "walmart-price-alert-banner";
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: linear-gradient(135deg, #0071ce 0%, #004c91 100%);
      color: white;
      padding: 0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <style>
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        #walmart-price-alert-inner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; max-width: 100%;
        }
        #walmart-price-alert-left { display: flex; align-items: center; gap: 14px; }
        #walmart-price-alert-icon { font-size: 28px; animation: pulse 2s ease-in-out infinite; }
        #walmart-price-alert-text h3 { margin: 0 0 2px 0; font-size: 15px; font-weight: 700; }
        #walmart-price-alert-text p { margin: 0; font-size: 13px; opacity: 0.88; }
        #walmart-price-alert-text strong { font-size: 18px; font-weight: 800; color: #ffd700; }
        #walmart-price-alert-actions { display: flex; align-items: center; gap: 10px; }
        #walmart-price-alert-buy {
          background: #ffd700; color: #004c91; border: none;
          padding: 8px 18px; border-radius: 6px; font-weight: 700;
          font-size: 13px; cursor: pointer; text-decoration: none;
          display: inline-block; transition: transform 0.1s;
        }
        #walmart-price-alert-buy:hover { transform: scale(1.04); }
        #walmart-price-alert-close {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
          color: white; width: 30px; height: 30px; border-radius: 50%;
          font-size: 16px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.2s; flex-shrink: 0;
        }
        #walmart-price-alert-close:hover { background: rgba(255,255,255,0.3); }
      </style>
      <div id="walmart-price-alert-inner">
        <div id="walmart-price-alert-left">
          <div id="walmart-price-alert-icon">🎧</div>
          <div id="walmart-price-alert-text">
            <h3>⚡ AirPods Pro 3 Price Alert!</h3>
            <p>Price dropped to <strong>$${price.toFixed(2)}</strong> — below your $${threshold} threshold on Walmart!</p>
          </div>
        </div>
        <div id="walmart-price-alert-actions">
          <a id="walmart-price-alert-buy" href="https://www.walmart.com/ip/AirPods-Pro-3/17835006350" target="_blank">Buy Now →</a>
          <button id="walmart-price-alert-close" title="Dismiss">✕</button>
        </div>
      </div>
    </div>
  `;

  document.body.prepend(banner);

  document.getElementById("walmart-price-alert-close").onclick = () => {
    chrome.runtime.sendMessage({ action: "dismissAll" });
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "checkNow") {
    checkPrice().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === "dismissAll") {
    chrome.storage.local.set({ alertActive: false });
    dismissBannerInAllTabs();
  }
  if (msg.action === "saveSettings") {
    chrome.storage.local.set({
      priceThreshold: msg.threshold,
      checkInterval: msg.interval
    }, () => {
      resetAlarm();
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.action === "showBannerNow") {
    chrome.storage.local.get(["alertPrice"], async (data) => {
      if (data.alertPrice) {
        const { threshold } = await getSettings();
        injectBannerInAllTabs(data.alertPrice, threshold);
      }
    });
  }
});
