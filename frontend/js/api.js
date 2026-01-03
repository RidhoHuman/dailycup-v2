// DailyCup v2 - API Communication Module
// Handles all HTTP requests to the backend

const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('token');
}

// Set auth token
function setAuthToken(token) {
  localStorage.setItem('token', token);
}

// Remove auth token
function removeAuthToken() {
  localStorage.removeItem('token');
}

// Get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: getAuthHeaders()
  };
  
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    // Handle unauthorized
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/frontend/pages/auth/login.html';
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.'
    };
  }
}

// Auth API
const AuthAPI = {
  async register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  async login(credentials) {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }
};

// Products API
const ProductsAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/products?${queryString}`);
  },
  
  async getById(id) {
    return await apiRequest(`/products/${id}`);
  },
  
  async create(formData) {
    return await apiRequest('/products', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  },
  
  async update(id, formData) {
    return await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  },
  
  async delete(id) {
    return await apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};

// Cart API
const CartAPI = {
  async get() {
    return await apiRequest('/cart');
  },
  
  async add(item) {
    return await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },
  
  async update(cartId, data) {
    return await apiRequest(`/cart/${cartId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async remove(cartId) {
    return await apiRequest(`/cart/${cartId}`, {
      method: 'DELETE'
    });
  },
  
  async clear() {
    return await apiRequest('/cart', {
      method: 'DELETE'
    });
  }
};

// Orders API
const OrdersAPI = {
  async create(orderData) {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/orders?${queryString}`);
  },
  
  async getById(id) {
    return await apiRequest(`/orders/${id}`);
  },
  
  async updateStatus(id, status, notes = null) {
    return await apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  },
  
  async uploadPaymentProof(orderId, file) {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    return await apiRequest(`/orders/${orderId}/payment`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  }
};

// Reviews API
const ReviewsAPI = {
  async create(reviewData, images = []) {
    const formData = new FormData();
    
    for (const key in reviewData) {
      formData.append(key, reviewData[key]);
    }
    
    images.forEach(image => {
      formData.append('images', image);
    });
    
    return await apiRequest('/reviews', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  },
  
  async getByProduct(productId) {
    return await apiRequest(`/reviews/product/${productId}`);
  },
  
  async reply(reviewId, adminReply) {
    return await apiRequest(`/reviews/${reviewId}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ admin_reply: adminReply })
    });
  }
};

// Returns API
const ReturnsAPI = {
  async create(returnData, images = []) {
    const formData = new FormData();
    
    for (const key in returnData) {
      formData.append(key, returnData[key]);
    }
    
    images.forEach(image => {
      formData.append('images', image);
    });
    
    return await apiRequest('/returns', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  },
  
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/returns?${queryString}`);
  },
  
  async getById(id) {
    return await apiRequest(`/returns/${id}`);
  },
  
  async process(id, data) {
    return await apiRequest(`/returns/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Admin API
const AdminAPI = {
  async getDashboard() {
    return await apiRequest('/admin/dashboard');
  },
  
  async getAllOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/orders?${queryString}`);
  },
  
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/users?${queryString}`);
  },
  
  async updateUserRole(userId, role) {
    return await apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },
  
  async toggleUserStatus(userId) {
    return await apiRequest(`/admin/users/${userId}/toggle`, {
      method: 'PUT'
    });
  },
  
  async getCategories() {
    return await apiRequest('/admin/categories');
  },
  
  async createCategory(categoryData) {
    return await apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },
  
  async updateCategory(id, categoryData) {
    return await apiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },
  
  async deleteCategory(id) {
    return await apiRequest(`/admin/categories/${id}`, {
      method: 'DELETE'
    });
  },
  
  async getReturns(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/returns?${queryString}`);
  },
  
  async getPaymentMethods() {
    return await apiRequest('/admin/payment-methods');
  },
  
  async updatePaymentMethod(id, data) {
    return await apiRequest(`/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async getLoyaltySettings() {
    return await apiRequest('/admin/loyalty-settings');
  },
  
  async updateLoyaltySettings(data) {
    return await apiRequest('/admin/loyalty-settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Export APIs
window.API = {
  Auth: AuthAPI,
  Products: ProductsAPI,
  Cart: CartAPI,
  Orders: OrdersAPI,
  Reviews: ReviewsAPI,
  Returns: ReturnsAPI,
  Admin: AdminAPI,
  getAuthToken,
  setAuthToken,
  removeAuthToken
};
