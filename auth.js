// ─── Authentication UI & Logic ────────────────────────────────────────────────
let isOnlineMode = false;

async function initAuth() {
  // Initialize Supabase
  isOnlineMode = initSupabase();

  // Check if user is already logged in
  const user = await getCurrentUser();
  if (user) {
    showMainApp(user.email);
  } else {
    showAuthPages();
  }

  setupAuthEventListeners();
}

function setupAuthEventListeners() {
  // Toggle between login and register
  document.getElementById('toggleRegister').addEventListener('click', e => {
    e.preventDefault();
    toggleAuthPage('register');
  });

  document.getElementById('toggleLogin').addEventListener('click', e => {
    e.preventDefault();
    toggleAuthPage('login');
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    await handleLogin();
  });

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    await handleRegister();
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await handleLogout();
  });
}

function toggleAuthPage(page) {
  document.getElementById('loginPage').classList.toggle('active', page === 'login');
  document.getElementById('registerPage').classList.toggle('active', page === 'register');
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }

  errorEl.textContent = 'Signing in...';

  if (!isOnlineMode) {
    // Offline mode: store credentials locally (demo only - not secure)
    const storedCreds = JSON.parse(localStorage.getItem('auth_creds') || '{}');
    if (storedCreds[email] === password) {
      showMainApp(email);
      errorEl.textContent = '';
    } else {
      errorEl.textContent = 'Invalid email or password';
    }
    return;
  }

  const result = await signIn(email, password);
  if (result.error) {
    errorEl.textContent = result.error;
  } else {
    showMainApp(email);
  }
}

async function handleRegister() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const password2 = document.getElementById('registerPassword2').value;
  const errorEl = document.getElementById('registerError');

  if (!name || !email || !password || !password2) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }

  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters';
    return;
  }

  if (password !== password2) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }

  errorEl.textContent = 'Creating account...';

  if (!isOnlineMode) {
    // Offline mode: store credentials locally
    const storedCreds = JSON.parse(localStorage.getItem('auth_creds') || '{}');
    if (storedCreds[email]) {
      errorEl.textContent = 'Email already registered';
      return;
    }
    storedCreds[email] = password;
    localStorage.setItem('auth_creds', JSON.stringify(storedCreds));

    // Store user info
    const users = JSON.parse(localStorage.getItem('auth_users') || '{}');
    users[email] = { name, email };
    localStorage.setItem('auth_users', JSON.stringify(users));

    showMainApp(email);
    errorEl.textContent = '';
    return;
  }

  const result = await signUp(email, password, name);
  if (result.error) {
    errorEl.textContent = result.error;
  } else {
    errorEl.textContent = 'Account created! Please sign in.';
    setTimeout(() => toggleAuthPage('login'), 1500);
  }
}

async function handleLogout() {
  if (isOnlineMode) {
    await signOut();
  }

  // Clear localStorage session data
  localStorage.removeItem('currentUser');

  showAuthPages();
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

function showAuthPages() {
  document.getElementById('authContainer').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('menuToggle').style.display = 'none';
  toggleAuthPage('login');
}

function showMainApp(userEmail) {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('menuToggle').style.display = '';

  // Store current user
  localStorage.setItem('currentUser', userEmail);

  // Update user info in sidebar
  const userName = document.getElementById('userName');
  if (isOnlineMode && currentUser) {
    userName.textContent = currentUser.user_metadata?.name || userEmail.split('@')[0];
  } else {
    const users = JSON.parse(localStorage.getItem('auth_users') || '{}');
    const user = users[userEmail];
    userName.textContent = user?.name || userEmail.split('@')[0];
  }

  // Initialize main app if not already done
  if (!window.appInitialized) {
    // Import historical data on first login
    if (typeof shouldImportHistoricalData === 'function' && shouldImportHistoricalData()) {
      console.log('Importing historical game data...');
      importHistoricalData();
    }

    initializeMainApp();
    window.appInitialized = true;
  }
}

// ─── Offline Mode Support ─────────────────────────────────────────────────────

function getCurrentUserEmail() {
  return localStorage.getItem('currentUser');
}

function isUserLoggedIn() {
  return !!localStorage.getItem('currentUser');
}
