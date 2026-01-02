// DailyCup v2 - Utility Functions

// Format currency to Indonesian Rupiah
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Format datetime
function formatDateTime(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Show alert message
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '80px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';
  alertDiv.style.animation = 'slideIn 0.3s ease';
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(alertDiv);
    }, 300);
  }, 3000);
}

// Show loading spinner
function showLoading(element) {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.id = 'loading-spinner';
  
  if (element) {
    element.innerHTML = '';
    element.appendChild(spinner);
  } else {
    document.body.appendChild(spinner);
  }
}

// Hide loading spinner
function hideLoading(element) {
  if (element) {
    const spinner = element.querySelector('#loading-spinner');
    if (spinner) spinner.remove();
  } else {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
  }
}

// Validate email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone (Indonesian format)
function isValidPhone(phone) {
  const regex = /^(\+62|62|0)[0-9]{9,12}$/;
  return regex.test(phone);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set query parameter in URL
function setQueryParam(param, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

// Generate star rating HTML
function generateStars(rating, maxStars = 5) {
  let html = '';
  for (let i = 1; i <= maxStars; i++) {
    if (i <= rating) {
      html += '<i class="star filled">★</i>';
    } else {
      html += '<i class="star">☆</i>';
    }
  }
  return html;
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Slugify text
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showAlert('Copied to clipboard!', 'success');
  }).catch(() => {
    showAlert('Failed to copy', 'error');
  });
}

// File size formatter
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Validate file type
function isValidFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) {
  return allowedTypes.includes(file.type);
}

// Validate file size
function isValidFileSize(file, maxSize = 5242880) { // 5MB default
  return file.size <= maxSize;
}

// Preview image file
function previewImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(file);
}

// Confirm dialog
function confirmDialog(message) {
  return confirm(message);
}

// Modal functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
});

// Pagination helper
function generatePagination(currentPage, totalPages, onPageChange) {
  const maxButtons = 5;
  const buttons = [];
  
  // Previous button
  buttons.push({
    text: '←',
    page: currentPage - 1,
    disabled: currentPage === 1
  });
  
  // Page buttons
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    buttons.push({
      text: i,
      page: i,
      active: i === currentPage
    });
  }
  
  // Next button
  buttons.push({
    text: '→',
    page: currentPage + 1,
    disabled: currentPage === totalPages
  });
  
  // Generate HTML
  let html = '<div class="pagination">';
  buttons.forEach(btn => {
    const classes = ['btn-sm'];
    if (btn.active) classes.push('active');
    if (btn.disabled) {
      html += `<button class="${classes.join(' ')}" disabled>${btn.text}</button>`;
    } else {
      html += `<button class="${classes.join(' ')}" onclick="(${onPageChange})(${btn.page})">${btn.text}</button>`;
    }
  });
  html += '</div>';
  
  return html;
}

// Get status badge HTML
function getStatusBadge(status) {
  const statusMap = {
    pending: { text: 'Pending', class: 'status-pending' },
    confirmed: { text: 'Confirmed', class: 'status-confirmed' },
    processing: { text: 'Processing', class: 'status-processing' },
    ready: { text: 'Ready', class: 'status-ready' },
    delivering: { text: 'Delivering', class: 'status-delivering' },
    completed: { text: 'Completed', class: 'status-completed' },
    cancelled: { text: 'Cancelled', class: 'status-cancelled' }
  };
  
  const statusInfo = statusMap[status] || { text: status, class: 'status-pending' };
  return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Export utilities
window.Utils = {
  formatCurrency,
  formatDate,
  formatDateTime,
  showAlert,
  showLoading,
  hideLoading,
  isValidEmail,
  isValidPhone,
  debounce,
  getQueryParam,
  setQueryParam,
  generateStars,
  truncateText,
  slugify,
  copyToClipboard,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  previewImage,
  confirmDialog,
  showModal,
  hideModal,
  generatePagination,
  getStatusBadge
};
