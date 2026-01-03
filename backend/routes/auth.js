const { sendResponse, errorResponse } = require('../utils/response');
const { parseRequestBody } = require('../utils/helpers');
const authController = require('../controllers/authController');

async function authRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseRequestBody(req);
      const result = await authController.register(body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseRequestBody(req);
      const result = await authController.login(body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/auth/google
    if (pathname === '/api/auth/google' && method === 'GET') {
      const authUrl = authController.getGoogleAuthUrl();
      res.writeHead(302, { 'Location': authUrl });
      res.end();
      return;
    }

    // GET /api/auth/google/callback
    if (pathname === '/api/auth/google/callback' && method === 'GET') {
      const { code } = query;
      if (!code) {
        sendResponse(res, 400, errorResponse('Authorization code not provided', 400));
        return;
      }

      const result = await authController.handleGoogleCallback(code);
      
      // Redirect to frontend with token
      if (result.success) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        res.writeHead(302, { 
          'Location': `${frontendUrl}/pages/auth/login.html?token=${result.data.token}` 
        });
        res.end();
      } else {
        sendResponse(res, result.statusCode, result);
      }
      return;
    }

    // GET /api/auth/facebook
    if (pathname === '/api/auth/facebook' && method === 'GET') {
      const authUrl = authController.getFacebookAuthUrl();
      res.writeHead(302, { 'Location': authUrl });
      res.end();
      return;
    }

    // GET /api/auth/facebook/callback
    if (pathname === '/api/auth/facebook/callback' && method === 'GET') {
      const { code } = query;
      if (!code) {
        sendResponse(res, 400, errorResponse('Authorization code not provided', 400));
        return;
      }

      const result = await authController.handleFacebookCallback(code);
      
      // Redirect to frontend with token
      if (result.success) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        res.writeHead(302, { 
          'Location': `${frontendUrl}/pages/auth/login.html?token=${result.data.token}` 
        });
        res.end();
      } else {
        sendResponse(res, result.statusCode, result);
      }
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Auth endpoint not found', 404));

  } catch (error) {
    console.error('Auth route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = authRoutes;
