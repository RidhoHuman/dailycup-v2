const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/database');
const { sendResponse, errorResponse } = require('../utils/response');

// Authenticate user with JWT
async function authenticate(req) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'No token provided' };
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Get user from database
    const user = await query(
      'SELECT id, name, email, role, loyalty_points, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user || user.length === 0) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, user: user[0] };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

// Middleware to require authentication
async function requireAuth(req, res) {
  const result = await authenticate(req);
  
  if (!result.success) {
    sendResponse(res, 401, errorResponse(result.message, 401));
    return null;
  }

  return result.user;
}

// Middleware to require specific role
async function requireRole(req, res, allowedRoles = []) {
  const user = await requireAuth(req, res);
  
  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    sendResponse(res, 403, errorResponse('Access denied', 403));
    return null;
  }

  return user;
}

// Middleware to require admin role
async function requireAdmin(req, res) {
  return await requireRole(req, res, ['admin', 'super_admin']);
}

// Middleware to require staff or admin role
async function requireStaff(req, res) {
  return await requireRole(req, res, ['staff', 'admin', 'super_admin']);
}

module.exports = {
  authenticate,
  requireAuth,
  requireRole,
  requireAdmin,
  requireStaff
};
