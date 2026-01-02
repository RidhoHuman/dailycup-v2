const { sendResponse, errorResponse } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { parseRequestBody } = require('../utils/helpers');
const cartController = require('../controllers/cartController');

async function cartRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // All cart routes require authentication
    const user = await requireAuth(req, res);
    if (!user) return;

    // GET /api/cart - Get cart items
    if (pathname === '/api/cart' && method === 'GET') {
      const result = await cartController.getCart(user.id);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // POST /api/cart - Add to cart
    if (pathname === '/api/cart' && method === 'POST') {
      const body = await parseRequestBody(req);
      const result = await cartController.addToCart(user.id, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/cart/:id - Update cart item
    const updateMatch = pathname.match(/^\/api\/cart\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const cartId = updateMatch[1];
      const body = await parseRequestBody(req);
      const result = await cartController.updateCartItem(user.id, cartId, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // DELETE /api/cart/:id - Remove from cart
    const deleteMatch = pathname.match(/^\/api\/cart\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const cartId = deleteMatch[1];
      const result = await cartController.removeFromCart(user.id, cartId);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // DELETE /api/cart - Clear cart
    if (pathname === '/api/cart' && method === 'DELETE') {
      const result = await cartController.clearCart(user.id);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Cart endpoint not found', 404));

  } catch (error) {
    console.error('Cart route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = cartRoutes;
