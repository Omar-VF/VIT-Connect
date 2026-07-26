// Hostel WiFi Auto-Login - ProntoNetworks & Captive Portal Content Script

(function () {
  'use strict';

  // Prevent running twice on same page load
  if (window.__wifiAutoLoginDone) return;
  window.__wifiAutoLoginDone = true;

  const TARGET_HOST = 'phc.prontonetworks.com';

  // Selector fallbacks for username and password fields across portal versions
  const USERNAME_SELECTORS = ['#userId', '#username', 'input[name="userId"]', 'input[name="username"]', 'input[name="user"]'];
  const PASSWORD_SELECTORS = ['#password', '#pass', 'input[name="password"]', 'input[name="pass"]', 'input[type="password"]'];

  function isTargetPage() {
    return window.location.hostname === TARGET_HOST || window.location.hostname.endsWith('.prontonetworks.com');
  }

  function log(msg) {
    console.log('[WiFi AutoLogin]', msg);
  }

  function findElement(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function simulateInput(el, value) {
    el.focus();
    el.value = value;
    ['input', 'change', 'keyup'].forEach(evt =>
      el.dispatchEvent(new Event(evt, { bubbles: true }))
    );
  }

  function findButtonByText(text) {
    const btns = document.querySelectorAll('button[type="submit"], button, input[type="submit"], input[type="button"], a.btn, a.button');
    for (const btn of btns) {
      const label = (btn.innerText || btn.value || '').trim().toUpperCase();
      if (label === text.toUpperCase() || label.includes(text.toUpperCase())) return btn;
    }
    return null;
  }

  function dismissOverlay() {
    const okayBtn = findButtonByText('OKAY') || findButtonByText('ACCEPT') || findButtonByText('CONTINUE');
    if (okayBtn) {
      log('Dismissing overlay popup...');
      okayBtn.click();
      return true;
    }
    return false;
  }

  function fillAndLogin(credentials) {
    const { username, password } = credentials;

    const userField = findElement(USERNAME_SELECTORS);
    const passField = findElement(PASSWORD_SELECTORS);

    if (!userField || !passField) {
      return false;
    }

    log('Filling in login credentials...');
    simulateInput(userField, username);
    simulateInput(passField, password);

    setTimeout(() => {
      const loginBtn = findButtonByText('Login') || findButtonByText('Sign In') || findButtonByText('Connect');
      if (loginBtn) {
        log('Clicking Login button...');
        loginBtn.click();
      } else {
        const form = userField.closest('form');
        if (form) {
          log('Submitting login form directly...');
          form.submit();
        }
      }
    }, 400);

    return true;
  }

  function run(credentials) {
    if (!isTargetPage()) return;

    log('Captive portal detected!');

    // Check if we're on the success page
    const bodyText = document.body?.innerText || '';
    if (
      bodyText.includes('Access Granted') ||
      bodyText.includes('successfully connected') ||
      bodyText.includes('Logged In') ||
      bodyText.includes('You are now connected')
    ) {
      log('Success page detected - closing tab after brief delay');
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'closeTab' });
        try { window.close(); } catch (_) {}
      }, 1200);
      return;
    }

    dismissOverlay();

    // Attempt immediate form filling
    if (fillAndLogin(credentials)) return;

    // Retries with interval for dynamically loaded DOM elements (up to 5s)
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      log(`Retrying field detection... (Attempt ${attempts}/${maxAttempts})`);
      dismissOverlay();
      if (fillAndLogin(credentials) || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);
  }

  chrome.storage.sync.get(['wifiUsername', 'wifiPassword', 'enabled'], (data) => {
    if (data.enabled === false) return;

    const credentials = {
      username: data.wifiUsername || '',
      password: data.wifiPassword || '',
    };

    if (!credentials.username || !credentials.password) return;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      run(credentials);
    } else {
      window.addEventListener('DOMContentLoaded', () => run(credentials));
    }
  });

})();
