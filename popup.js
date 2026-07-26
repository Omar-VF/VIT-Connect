// VIT-Connect Popup Logic - Manages credentials and UI state

const usernameInput   = document.getElementById('username');
const passwordInput   = document.getElementById('password');
const saveBtn         = document.getElementById('saveBtn');
const statusMsg       = document.getElementById('status');
const togglePass      = document.getElementById('togglePass');
const eyeIcon         = document.getElementById('eyeIcon');
const enabledToggle   = document.getElementById('enabledToggle');
const statusBadge     = document.getElementById('statusBadge');
const statusBadgeText = document.getElementById('statusBadgeText');
const editBtn         = document.getElementById('editBtn');
const testBtn         = document.getElementById('testBtn');
const savedState      = document.getElementById('savedState');
const editForm        = document.getElementById('editForm');
const savedUsername   = document.getElementById('savedUsername');

function updateBadgeState(isEnabled) {
  if (isEnabled) {
    statusBadge.classList.add('active');
    statusBadgeText.textContent = 'Auto-login On';
  } else {
    statusBadge.classList.remove('active');
    statusBadgeText.textContent = 'Disabled';
  }
}

function showSavedState(username) {
  const masked = username.length > 3
    ? username.slice(0, 3) + '•'.repeat(Math.min(username.length - 3, 6))
    : '•'.repeat(username.length);
  savedUsername.textContent = masked;
  savedState.classList.add('visible');
  editForm.classList.add('hidden');
}

function showEditForm() {
  savedState.classList.remove('visible');
  editForm.classList.remove('hidden');
}

// Load saved credentials on popup opening
chrome.storage.sync.get(['wifiUsername', 'wifiPassword', 'enabled'], (data) => {
  const isEnabled = data.enabled !== false;
  enabledToggle.checked = isEnabled;
  updateBadgeState(isEnabled);

  if (data.wifiUsername && data.wifiPassword) {
    usernameInput.value = data.wifiUsername;
    passwordInput.value = data.wifiPassword;
    showSavedState(data.wifiUsername);
  } else {
    showEditForm();
  }
});

// Edit button handler
editBtn?.addEventListener('click', () => {
  showEditForm();
  usernameInput.focus();
});

// Test Login on active tab handler
testBtn?.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      }).then(() => {
        showStatus('Triggered auto-login!', 'ok');
      }).catch(() => {
        showStatus('Open the WiFi portal tab first', 'err');
      });
    }
  });
});

// Save credentials handler
saveBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showStatus('Please fill in both username and password.', 'err');
    return;
  }

  chrome.storage.sync.set({
    wifiUsername: username,
    wifiPassword: password,
    enabled: enabledToggle.checked,
  }, () => {
    showStatus('✓ Saved credentials', 'ok');
    setTimeout(() => showSavedState(username), 600);
  });
});

// Enable/disable toggle handler
enabledToggle.addEventListener('change', () => {
  const isEnabled = enabledToggle.checked;
  chrome.storage.sync.set({ enabled: isEnabled });
  updateBadgeState(isEnabled);
});

// Password visibility toggle
togglePass.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  eyeIcon.innerHTML = isHidden
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg ' + type;
  setTimeout(() => {
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';
  }, 3000);
}
