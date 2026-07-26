# 🛜 VIT-Connect

Automated captive portal WiFi login browser extension for VIT Vellore hostel networks.

## ✅ What it does
- Detects captive portal / WiFi login pages automatically (`phc.prontonetworks.com`)
- Dismisses any "OK / Accept / Continue" overlays
- Fills in your username & password with resilient field selectors
- Submits the form and safely closes the tab once connection is granted
- Works completely offline (using system font fallbacks)

---

## 📦 Installation (Developer / Unpacked Mode)

1. Open your browser and go to: `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select this project folder
5. The extension icon will appear in your toolbar

---

## ⚙️ Setup

1. Click the extension icon in the toolbar
2. Enter your **username/registration number** and **password**
3. Click **Save Credentials**
4. Done! The extension is active.

---

## 🚀 How to Share / Publish

### Option 1: Chrome Web Store
1. Create a zip of the root files (`manifest.json`, `content.js`, `background.js`, `popup.html`, `popup.js`, `icon.png`).
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
3. Register a developer account ($5 one-time fee) and upload your `.zip`.

### Option 2: GitHub Releases (Free)
1. Zip the extension files.
2. Create a Release on your GitHub repository and attach `vit-wifi-autologin.zip`.
3. Users can download the ZIP, extract it, and load it via `chrome://extensions` -> "Load unpacked".

---

## 🔒 Privacy
Your credentials are stored locally using Chrome's `sync storage` — they are never sent anywhere except to your hostel's portal page.

---

## 📁 Repository Structure
```
hostel-wifi-extension/
├── manifest.json    — Extension manifest (V3)
├── content.js       — Auto-login script (runs on portal page)
├── background.js    — Background service worker (tab management)
├── popup.html       — Settings UI layout
├── popup.js         — Settings logic & storage management
├── icon.png         — Extension icon
└── README.md        — Instructions & Documentation
```
