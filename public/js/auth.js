document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');

  // Eye Password Toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.classList.toggle('fa-eye');
      togglePasswordBtn.classList.toggle('fa-eye-slash');
    });
  }

  // Forgot Password Click
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Please contact clinic system administrator to reset your password.');
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlert.classList.add('d-none');
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Authenticating...';

      const username = document.getElementById('username').value.trim();
      const password = passwordInput.value.trim();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('dental_jwt_token', data.token);
          localStorage.setItem('dental_user', JSON.stringify(data.user));
          if (data.user && data.user.role === 'doctor') {
            window.location.href = 'dashboard.html#doctors-note';
          } else {
            window.location.href = 'dashboard.html';
          }
        } else {
          loginAlert.innerText = data.message || 'Invalid login credentials.';
          loginAlert.classList.remove('d-none');
        }
      } catch (err) {
        console.error(err);
        loginAlert.innerText = 'Unable to connect to server. Please check backend status.';
        loginAlert.classList.remove('d-none');
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i> Login to Dashboard';
      }
    });
  }
});

// Auto-intercept expired session across all API calls
if (typeof window !== 'undefined' && window.fetch) {
  const _originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _originalFetch.apply(this, args);
    if (response.status === 401 || response.status === 403) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      if (url.includes('/api/') && !url.includes('/api/auth/login')) {
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          if (data && data.message && (data.message.includes('expired') || data.message.includes('denied') || data.message.includes('token'))) {
            console.warn('Session expired or invalid token. Redirecting to login.');
            localStorage.removeItem('dental_jwt_token');
            localStorage.removeItem('dental_user');
            if (!window.location.pathname.includes('login')) {
              window.location.href = 'login.html?expired=true';
            }
          }
        } catch (err) {}
      }
    }
    return response;
  };
}

// Auth Guard Utility for Dashboard
function checkAuthToken() {
  const token = localStorage.getItem('dental_jwt_token');
  if (!token) {
    window.location.href = 'login.html';
    return null;
  }

  // Validate JWT expiration client-side
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Stored JWT token has expired. Redirecting to login.');
        localStorage.removeItem('dental_jwt_token');
        localStorage.removeItem('dental_user');
        window.location.href = 'login.html?expired=true';
        return null;
      }
    }
  } catch (e) {
    console.warn('Invalid token format. Redirecting to login.');
    localStorage.removeItem('dental_jwt_token');
    localStorage.removeItem('dental_user');
    window.location.href = 'login.html';
    return null;
  }

  return token;
}

function logoutUser() {
  localStorage.removeItem('dental_jwt_token');
  localStorage.removeItem('dental_user');
  window.location.href = 'login.html';
}
