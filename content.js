// VIT-Connect - Captive Portal Auto-Login Content Script

(function () {
  'use strict';

  // Prevent duplicate execution on same page instance
  if (window.__wifiAutoLoginDone) return;
  window.__wifiAutoLoginDone = true;

  const TARGET_HOST = 'phc.prontonetworks.com';

  const USERNAME_SELECTORS = [
    '#userId',
    '#username',
    'input[name="userId"]',
    'input[name="username"]',
    'input[name="user"]'
  ];

  const PASSWORD_SELECTORS = [
    '#password',
    '#pass',
    'input[name="password"]',
    'input[name="pass"]',
    'input[type="password"]'
  ];

  let hasClosed = false;

  function log(msg) {
    console.log('[VIT-Connect]', msg);
  }

  function isTargetPage() {
    return window.location.hostname === TARGET_HOST || window.location.hostname.endsWith('.prontonetworks.com');
  }

  function closeTabImmediately() {
    if (hasClosed) return;
    hasClosed = true;
    log('Connection success detected! Closing tab immediately...');
    chrome.runtime.sendMessage({ action: 'closeTab' });
    try { window.close(); } catch (_) {}
  }

  function isSuccessPage() {
    const url = window.location.href.toLowerCase();
    const bodyText = (document.body ? document.body.innerText : '') || '';
    const lower = bodyText.toLowerCase();

    // Check strong success phrases (instant trigger)
    const strongSuccessPhrases = [
      'access granted',
      'successfully connected',
      'connected successfully',
      'you are now connected',
      'login successful',
      'authentication successful'
    ];

    for (const phrase of strongSuccessPhrases) {
      if (lower.includes(phrase)) return true;
    }

    // Check secondary success states (when no password field is present on screen)
    const hasPasswordField = !!document.querySelector('input[type="password"]');
    if (!hasPasswordField) {
      const secondarySuccessPhrases = [
        'logged in',
        'session started',
        'remaining time',
        'account status',
        'welcome to pronto',
        'logout',
        'sign out',
        'disconnect'
      ];

      for (const phrase of secondarySuccessPhrases) {
        if (lower.includes(phrase)) return true;
      }

      // Check URL indicators
      if (
        url.includes('status') ||
        url.includes('success') ||
        url.includes('welcome') ||
        url.includes('logged') ||
        url.includes('logout')
      ) {
        return true;
      }

      // Check for standalone logout/disconnect buttons
      const logoutBtn = findButtonByText('LOGOUT') || findButtonByText('SIGN OUT') || findButtonByText('DISCONNECT');
      if (logoutBtn) return true;
    }

    return false;
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
    const btns = document.querySelectorAll('button[type="submit"], button, input[type="submit"], input[type="button"], a.btn, a.button, a');
    for (const btn of btns) {
      const label = (btn.innerText || btn.value || '').trim().toUpperCase();
      if (label === text.toUpperCase() || label.includes(text.toUpperCase())) return btn;
    }
    return null;
  }

  function dismissOverlay() {
    const okayBtn = findButtonByText('OKAY') || findButtonByText('ACCEPT') || findButtonByText('CONTINUE') || findButtonByText('AGREE');
    if (okayBtn) {
      log('Dismissing portal overlay...');
      okayBtn.click();
      return true;
    }
    return false;
  }

  function watchForSuccessAfterSubmit() {
    log('Monitoring for success confirmation...');

    // 1. Fast polling loop (every 50ms for up to 8s)
    let checks = 0;
    const maxChecks = 160; // 8 seconds total
    const pollTimer = setInterval(() => {
      checks++;
      if (isSuccessPage()) {
        clearInterval(pollTimer);
        if (observer) observer.disconnect();
        closeTabImmediately();
      } else if (checks >= maxChecks) {
        clearInterval(pollTimer);
        if (observer) observer.disconnect();
      }
    }, 50);

    // 2. DOM MutationObserver for instant trigger on dynamic DOM rewrite
    const observer = new MutationObserver(() => {
      if (isSuccessPage()) {
        clearInterval(pollTimer);
        observer.disconnect();
        closeTabImmediately();
      }
    });

    if (document.body || document.documentElement) {
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  function fillAndLogin(credentials) {
    const { username, password } = credentials;

    const userField = findElement(USERNAME_SELECTORS);
    const passField = findElement(PASSWORD_SELECTORS);

    if (!userField || !passField) {
      return false;
    }

    log('Entering login credentials...');
    simulateInput(userField, username);
    simulateInput(passField, password);

    setTimeout(() => {
      // Start watching for success response before triggering submit
      watchForSuccessAfterSubmit();

      const loginBtn = findButtonByText('Login') || findButtonByText('Sign In') || findButtonByText('Connect') || findButtonByText('Submit');
      if (loginBtn) {
        log('Clicking login button...');
        loginBtn.click();
      } else {
        const form = userField.closest('form');
        if (form) {
          log('Submitting login form directly...');
          form.submit();
        }
      }
    }, 250);

    return true;
  }

  function run(credentials) {
    if (!isTargetPage()) return;

    // If page is already on the success screen, close immediately with zero delay
    if (isSuccessPage()) {
      closeTabImmediately();
      return;
    }

    dismissOverlay();

    // Attempt immediate credential fill
    if (fillAndLogin(credentials)) return;

    // Retry loop for dynamically rendered portal forms
    let attempts = 0;
    const maxAttempts = 12;
    const retryInterval = setInterval(() => {
      attempts++;

      // Check if success page was reached in the meantime
      if (isSuccessPage()) {
        clearInterval(retryInterval);
        closeTabImmediately();
        return;
      }

      dismissOverlay();
      if (fillAndLogin(credentials) || attempts >= maxAttempts) {
        clearInterval(retryInterval);
      }
    }, 300);
  }

  // Load saved credentials
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
