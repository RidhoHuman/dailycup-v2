const bcrypt = require('bcrypt');
const { query, queryOne } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidEmail, sanitizeInput } = require('../utils/helpers');
const https = require('https');
const { URL } = require('url');
const oauthConfig = require('../config/oauth');

// Register new user
async function register(data) {
  try {
    const { name, email, password, phone } = data;

    // Validation
    if (!name || !email || !password) {
      return errorResponse('Name, email and password are required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Check if email already exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return errorResponse('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (name, email, password, phone, role, oauth_provider) VALUES (?, ?, ?, ?, ?, ?)',
      [sanitizeInput(name), email.toLowerCase(), hashedPassword, phone || null, 'customer', 'manual']
    );

    // Generate token
    const token = generateToken({ userId: result.insertId, email, role: 'customer' });

    return successResponse({
      token,
      user: {
        id: result.insertId,
        name: sanitizeInput(name),
        email: email.toLowerCase(),
        role: 'customer'
      }
    }, 'Registration successful', 201);

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Registration failed', 500);
  }
}

// Login user
async function login(data) {
  try {
    const { email, password } = data;

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user
    const user = await queryOne(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ? AND oauth_provider = ?',
      [email.toLowerCase(), 'manual']
    );

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.is_active) {
      return errorResponse('Account is inactive', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
}

// Get OAuth login URL for Google
function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: oauthConfig.google.clientId,
    redirect_uri: oauthConfig.google.redirectUri,
    response_type: 'code',
    scope: oauthConfig.google.scope,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${oauthConfig.google.authUrl}?${params.toString()}`;
}

// Get OAuth login URL for Facebook
function getFacebookAuthUrl() {
  const params = new URLSearchParams({
    client_id: oauthConfig.facebook.appId,
    redirect_uri: oauthConfig.facebook.redirectUri,
    response_type: 'code',
    scope: oauthConfig.facebook.scope
  });

  return `${oauthConfig.facebook.authUrl}?${params.toString()}`;
}

// Helper to make HTTPS requests
function httpsRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Handle Google OAuth callback
async function handleGoogleCallback(code) {
  try {
    // Exchange code for access token
    const tokenData = await httpsRequest(
      oauthConfig.google.tokenUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      },
      new URLSearchParams({
        code,
        client_id: oauthConfig.google.clientId,
        client_secret: oauthConfig.google.clientSecret,
        redirect_uri: oauthConfig.google.redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    );

    if (!tokenData.access_token) {
      return errorResponse('Failed to get access token', 400);
    }

    // Get user info
    const userInfo = await httpsRequest(
      `${oauthConfig.google.userInfoUrl}?access_token=${tokenData.access_token}`
    );

    // Check if user exists
    let user = await queryOne(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      ['google', userInfo.id]
    );

    if (!user) {
      // Create new user
      const result = await query(
        'INSERT INTO users (name, email, oauth_provider, oauth_id, profile_picture, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userInfo.name, userInfo.email, 'google', userInfo.id, userInfo.picture, 'customer']
      );
      
      user = {
        id: result.insertId,
        name: userInfo.name,
        email: userInfo.email,
        role: 'customer'
      };
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return successResponse({ token, user }, 'Google login successful');

  } catch (error) {
    console.error('Google OAuth error:', error);
    return errorResponse('Google authentication failed', 500);
  }
}

// Handle Facebook OAuth callback
async function handleFacebookCallback(code) {
  try {
    // Exchange code for access token
    const tokenUrl = `${oauthConfig.facebook.tokenUrl}?` + new URLSearchParams({
      client_id: oauthConfig.facebook.appId,
      client_secret: oauthConfig.facebook.appSecret,
      redirect_uri: oauthConfig.facebook.redirectUri,
      code
    });

    const tokenData = await httpsRequest(tokenUrl);

    if (!tokenData.access_token) {
      return errorResponse('Failed to get access token', 400);
    }

    // Get user info
    const userInfoUrl = `${oauthConfig.facebook.userInfoUrl}?` + new URLSearchParams({
      fields: 'id,name,email,picture',
      access_token: tokenData.access_token
    });

    const userInfo = await httpsRequest(userInfoUrl);

    // Check if user exists
    let user = await queryOne(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      ['facebook', userInfo.id]
    );

    if (!user) {
      // Create new user
      const result = await query(
        'INSERT INTO users (name, email, oauth_provider, oauth_id, profile_picture, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userInfo.name, userInfo.email || `fb_${userInfo.id}@dailycup.com`, 'facebook', userInfo.id, 
         userInfo.picture?.data?.url, 'customer']
      );
      
      user = {
        id: result.insertId,
        name: userInfo.name,
        email: userInfo.email || `fb_${userInfo.id}@dailycup.com`,
        role: 'customer'
      };
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return successResponse({ token, user }, 'Facebook login successful');

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return errorResponse('Facebook authentication failed', 500);
  }
}

module.exports = {
  register,
  login,
  getGoogleAuthUrl,
  getFacebookAuthUrl,
  handleGoogleCallback,
  handleFacebookCallback
};
