// Popup logic - manages credentials and UI

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const saveBtn       = document.getElementById('saveBtn');
const status        = document.getElementById('status');
const togglePass    = document.getElementById('togglePass');
const eyeIcon       = document.getElementById('eyeIcon');
const enabledToggle = document.getElementById('enabledToggle');
const editBtn       = document.getElementById('editBtn');
const savedState    = document.getElementById('savedState');
const editForm      = document.getElementById('editForm');
const savedUsername = document.getElementById('savedUsername');

function showSavedState(username) {
  // Show first 3 chars + mask the rest
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

// Load saved credentials on open
chrome.storage.sync.get(['wifiUsername', 'wifiPassword', 'enabled'], (data) => {
  enabledToggle.checked = data.enabled !== false;

  if (data.wifiUsername && data.wifiPassword) {
    usernameInput.value = data.wifiUsername;
    passwordInput.value = data.wifiPassword;
    showSavedState(data.wifiUsername);
  } else {
    showEditForm();
  }
});

// Edit button — reveal the form
editBtn.addEventListener('click', () => {
  showEditForm();
  usernameInput.focus();
});

// Save credentials
saveBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showStatus('Please fill in both fields.', 'err');
    return;
  }

  chrome.storage.sync.set({
    wifiUsername: username,
    wifiPassword: password,
    enabled: enabledToggle.checked,
  }, () => {
    showStatus('✓ Saved!', 'ok');
    setTimeout(() => showSavedState(username), 800);
  });
});

// Toggle enabled state
enabledToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});

// Show/hide password toggle
togglePass.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  eyeIcon.innerHTML = isHidden
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

function showStatus(msg, type) {
  status.textContent = msg;
  status.className = 'status ' + type;
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}
