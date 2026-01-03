// DailyCup v2 - Authentication Module

// Check if user is authenticated
function isAuthenticated() {
  return !!API.getAuthToken();
}

// Get current user from token
function getCurrentUser() {
  const token = API.getAuthToken();
  if (!token) return null;
  
  try {
    // Decode JWT token (simple base64 decode of payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Check if user has specific role
function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

// Require authentication - redirect if not logged in
function requireAuth(redirectUrl = '/frontend/pages/auth/login.html') {
  if (!isAuthenticated()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

// Require specific role - redirect if not authorized
function requireRole(role, redirectUrl = '/frontend/index.html') {
  if (!requireAuth()) return false;
  
  if (!hasRole(role)) {
    Utils.showAlert('Access denied. Insufficient permissions.', 'error');
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
    return false;
  }
  return true;
}

// Logout function
function logout() {
  API.removeAuthToken();
  window.location.href = '/frontend/index.html';
}

// Update navbar based on auth status
function updateNavbar() {
  const navbar = document.querySelector('.navbar-nav');
  if (!navbar) return;
  
  if (isAuthenticated()) {
    const user = getCurrentUser();
    const role = user?.role || 'customer';
    
    // Customer nav items
    let navItems = `
      <li><a href="/frontend/pages/customer/menu.html">Menu</a></li>
      <li><a href="/frontend/pages/customer/cart.html">Cart</a></li>
      <li><a href="/frontend/pages/customer/orders.html">Orders</a></li>
      <li><a href="/frontend/pages/customer/profile.html">Profile</a></li>
    `;
    
    // Admin nav items
    if (['admin', 'super_admin', 'staff'].includes(role)) {
      navItems = `
        <li><a href="/frontend/pages/admin/dashboard.html">Dashboard</a></li>
        <li><a href="/frontend/pages/admin/products.html">Products</a></li>
        <li><a href="/frontend/pages/admin/orders.html">Orders</a></li>
        <li><a href="/frontend/pages/admin/users.html">Users</a></li>
      ` + navItems;
    }
    
    navItems += `<li><a href="#" onclick="Auth.logout(); return false;">Logout</a></li>`;
    
    navbar.innerHTML = navItems;
  } else {
    // Guest nav items
    navbar.innerHTML = `
      <li><a href="/frontend/index.html">Home</a></li>
      <li><a href="/frontend/pages/customer/menu.html">Menu</a></li>
      <li><a href="/frontend/pages/auth/login.html">Login</a></li>
      <li><a href="/frontend/pages/auth/register.html">Register</a></li>
    `;
  }
}

// Handle login
async function handleLogin(email, password) {
  Utils.showLoading();
  
  const result = await API.Auth.login({ email, password });
  
  Utils.hideLoading();
  
  if (result.success) {
    API.setAuthToken(result.data.token);
    Utils.showAlert('Login successful!', 'success');
    
    // Redirect based on role
    const user = getCurrentUser();
    if (['admin', 'super_admin', 'staff'].includes(user.role)) {
      setTimeout(() => {
        window.location.href = '/frontend/pages/admin/dashboard.html';
      }, 1000);
    } else {
      setTimeout(() => {
        window.location.href = '/frontend/pages/customer/menu.html';
      }, 1000);
    }
  } else {
    Utils.showAlert(result.message || 'Login failed', 'error');
  }
}

// Handle register
async function handleRegister(userData) {
  Utils.showLoading();
  
  const result = await API.Auth.register(userData);
  
  Utils.hideLoading();
  
  if (result.success) {
    API.setAuthToken(result.data.token);
    Utils.showAlert('Registration successful!', 'success');
    
    setTimeout(() => {
      window.location.href = '/frontend/pages/customer/menu.html';
    }, 1000);
  } else {
    Utils.showAlert(result.message || 'Registration failed', 'error');
  }
}

// Handle OAuth callback (for Google/Facebook)
function handleOAuthCallback() {
  const token = Utils.getQueryParam('token');
  if (token) {
    API.setAuthToken(token);
    Utils.showAlert('Login successful!', 'success');
    
    // Remove token from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);
    
    // Redirect after short delay
    const user = getCurrentUser();
    if (['admin', 'super_admin', 'staff'].includes(user?.role)) {
      setTimeout(() => {
        window.location.href = '/frontend/pages/admin/dashboard.html';
      }, 1000);
    } else {
      setTimeout(() => {
        window.location.href = '/frontend/pages/customer/menu.html';
      }, 1000);
    }
  }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  handleOAuthCallback();
});

// Export auth functions
window.Auth = {
  isAuthenticated,
  getCurrentUser,
  hasRole,
  requireAuth,
  requireRole,
  logout,
  handleLogin,
  handleRegister,
  updateNavbar
};
