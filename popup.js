let currentSettings = { threshold: 250, interval: 1 };

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['status', 'settings'][i] === name);
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

function setThreshold(val) {
  document.getElementById('input-threshold').value = val;
  updateThresholdPresets(val);
}

function setIntervalVal(val) {
  document.getElementById('input-interval').value = val;
  updateIntervalPresets(val);
}

function updateThresholdPresets(val) {
  document.querySelectorAll('.threshold-preset').forEach(p => {
    p.classList.toggle('selected', parseInt(p.dataset.value) === parseInt(val));
  });
}

function updateIntervalPresets(val) {
  document.querySelectorAll('.interval-preset').forEach(p => {
    p.classList.toggle('selected', parseInt(p.dataset.value) === parseInt(val));
  });
}

function saveSettings() {
  const threshold = parseFloat(document.getElementById('input-threshold').value);
  const interval = parseFloat(document.getElementById('input-interval').value);

  if (!threshold || threshold <= 0) { alert('Please enter a valid price threshold.'); return; }
  if (!interval || interval < 1) { alert('Minimum interval is 1 minute.'); return; }

  chrome.runtime.sendMessage({ action: 'saveSettings', threshold, interval }, () => {
    currentSettings = { threshold, interval };
    updateStatusDisplay();
    const confirmEl = document.getElementById('save-confirm');
    confirmEl.classList.add('show');
    setTimeout(() => confirmEl.classList.remove('show'), 2500);
  });
}

function updateStatusDisplay() {
  const { threshold, interval } = currentSettings;
  document.getElementById('threshold-display').textContent = `$${threshold.toFixed(2)}`;
  document.getElementById('interval-display').textContent =
    interval === 1 ? 'Every 1 min' : `Every ${interval} min`;
  document.getElementById('header-subtitle').textContent =
    `AirPods Pro 3 — Alert < $${threshold}`;
  document.getElementById('footer-text').innerHTML =
    `Checks every ${interval} min · <a href="https://www.walmart.com/ip/AirPods-Pro-3/17835006350" target="_blank">walmart.com</a>`;
}

function loadStatus() {
  chrome.storage.local.get(["lastPrice", "lastChecked", "alertActive", "error", "priceThreshold", "checkInterval"], (data) => {
    currentSettings.threshold = data.priceThreshold ?? 250;
    currentSettings.interval = data.checkInterval ?? 1;

    document.getElementById('input-threshold').value = currentSettings.threshold;
    document.getElementById('input-interval').value = currentSettings.interval;
    updateThresholdPresets(currentSettings.threshold);
    updateIntervalPresets(currentSettings.interval);
    updateStatusDisplay();

    const priceEl = document.getElementById("price");
    if (data.lastPrice != null) {
      priceEl.textContent = `$${data.lastPrice.toFixed(2)}`;
      priceEl.className = "price-val " + (data.lastPrice < currentSettings.threshold ? "below" : "above");
    }

    if (data.lastChecked) document.getElementById("last-checked").textContent = data.lastChecked;

    const badgeEl = document.getElementById("alert-badge");
    const alertTextEl = document.getElementById("alert-text");
    if (data.alertActive) {
      badgeEl.className = "alert-badge active";
      alertTextEl.textContent = "ALERT ACTIVE";
    } else {
      badgeEl.className = "alert-badge inactive";
      alertTextEl.textContent = "Watching";
    }

    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = data.error
      ? `<div class="error-msg">⚠️ ${data.error}</div>`
      : "";
  });
}

function checkNow() {
  const btn = document.getElementById("check-now-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Checking...';
  chrome.runtime.sendMessage({ action: "checkNow" }, () => {
    setTimeout(() => {
      loadStatus();
      btn.disabled = false;
      btn.textContent = "Check Price Now";
    }, 3000);
  });
}

function openWalmart() {
  chrome.tabs.create({ url: "https://www.walmart.com/ip/AirPods-Pro-3/17835006350" });
}

// Wire up all event listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  document.getElementById('tab-status').addEventListener('click', () => switchTab('status'));
  document.getElementById('tab-settings').addEventListener('click', () => switchTab('settings'));

  // Status panel buttons
  document.getElementById('check-now-btn').addEventListener('click', checkNow);
  document.getElementById('view-walmart-btn').addEventListener('click', openWalmart);

  // Settings panel — threshold presets
  document.querySelectorAll('.threshold-preset').forEach(p => {
    p.addEventListener('click', () => setThreshold(p.dataset.value));
  });

  // Settings panel — interval presets
  document.querySelectorAll('.interval-preset').forEach(p => {
    p.addEventListener('click', () => setIntervalVal(p.dataset.value));
  });

  // Settings panel inputs — sync presets on manual type
  document.getElementById('input-threshold').addEventListener('input', (e) => {
    updateThresholdPresets(e.target.value);
  });
  document.getElementById('input-interval').addEventListener('input', (e) => {
    updateIntervalPresets(e.target.value);
  });

  // Save & back buttons
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('back-btn').addEventListener('click', () => switchTab('status'));

  // Initial load
  loadStatus();
  setInterval(loadStatus, 2000);
});
