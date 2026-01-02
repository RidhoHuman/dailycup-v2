require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'dailycup_jwt_secret_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(','),
  UPLOAD_DIR: require('path').join(__dirname, '..', 'uploads'),

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Order Number Prefix
  ORDER_PREFIX: 'DC',
  RETURN_PREFIX: 'RT',

  // Email Configuration
  EMAIL_CONFIG: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  },
  EMAIL_FROM: process.env.EMAIL_FROM || 'DailyCup <noreply@dailycup.com>',

  // Default Password (hashed with bcrypt)
  // Plain text: admin123 and staff123
  DEFAULT_ADMIN_PASSWORD_HASH: '$2b$10$rQ8qLxKJ5QJZJZ5ZJ5ZJ5uGJZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5Z'
};
