const url = require('url');
const { parseQueryString, parseRequestBody } = require('../utils/helpers');
const { sendResponse, errorResponse } = require('../utils/response');

// Import route handlers
const authRoutes = require('./auth');
const productRoutes = require('./products');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const reviewRoutes = require('./reviews');
const returnRoutes = require('./returns');
const adminRoutes = require('./admin');

// Main router
async function router(req, res) {
  try {
    // Parse URL
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    const query = parseQueryString(parsedUrl.query);

    // Route matching
    if (pathname.startsWith('/api/auth')) {
      return await authRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/products')) {
      return await productRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/cart')) {
      return await cartRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/orders')) {
      return await orderRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/reviews')) {
      return await reviewRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/returns')) {
      return await returnRoutes(req, res, pathname, query);
    } else if (pathname.startsWith('/api/admin')) {
      return await adminRoutes(req, res, pathname, query);
    } else if (pathname === '/api/health') {
      // Health check endpoint
      sendResponse(res, 200, { success: true, message: 'Server is running' });
      return;
    } else {
      // 404 Not Found
      sendResponse(res, 404, errorResponse('Endpoint not found', 404));
      return;
    }

  } catch (error) {
    console.error('Router error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = router;
