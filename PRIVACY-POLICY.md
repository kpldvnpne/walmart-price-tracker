Privacy Policy — Walmart AirPods Price Tracker Chrome Extension

Last updated: March 2026

---

OVERVIEW

Walmart AirPods Price Tracker is a Chrome browser extension that monitors a specific Walmart product page and alerts you when the price drops below a threshold you set. This policy explains what data the extension handles and how.

---

DATA COLLECTED

This extension does not collect, record, transmit, or share any personal data.

The extension stores exactly two values locally in your browser using Chrome's built-in storage API (chrome.storage.local):
  - Your configured price threshold (a number, e.g. 250)
  - Your configured check interval (a number of minutes, e.g. 1)

These values are stored only on your own device and are never sent anywhere.

---

NETWORK REQUESTS

The extension makes periodic HTTP GET requests to the following URL to read the publicly displayed product price:

  https://www.walmart.com/ip/AirPods-Pro-3/17835006350

No personal information, authentication data, cookies, or user identifiers are included in or extracted from these requests beyond what a standard browser fetch sends (e.g. a User-Agent header). Only the numeric price shown on the page is parsed from the response. The full HTML response is immediately discarded after the price is extracted.

---

PERMISSIONS AND WHY THEY ARE NEEDED

- storage: Saves your price threshold and check interval locally on your device.
- alarms: Schedules the background price check at your chosen interval.
- scripting: Injects the alert banner into your open tabs when a price drop is detected.
- tabs: Identifies open tabs to inject the banner into, and opens the Walmart page on request.
- https://www.walmart.com/*: Allows the background script to fetch the Walmart product page.
- <all_urls>: Allows the banner to be injected into tabs on any site you are browsing.

---

THIRD PARTIES

This extension does not use any third-party services, analytics platforms, advertising networks, or external APIs. No data is shared with any third party.

---

CHILDREN

This extension does not knowingly collect data from children under 13.

---

CHANGES

If this policy changes materially, the version date above will be updated. Continued use of the extension after a policy update constitutes acceptance of the revised policy.

---

CONTACT

For questions about this privacy policy, contact: [walmart-price-tracke.poach960@passinbox.com]
