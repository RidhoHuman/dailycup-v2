const { sendResponse, errorResponse } = require('../utils/response');
const { requireAuth, requireStaff } = require('../middleware/auth');
const { parseRequestBody } = require('../utils/helpers');
const { parseMultipartForm } = require('../middleware/upload');
const orderController = require('../controllers/orderController');

async function orderRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // POST /api/orders - Create order
    if (pathname === '/api/orders' && method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const body = await parseRequestBody(req);
      const result = await orderController.createOrder(user.id, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/orders - Get user orders
    if (pathname === '/api/orders' && method === 'GET') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const result = await orderController.getUserOrders(user.id, query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/orders/:id - Get order details
    const getMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (getMatch && method === 'GET') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const orderId = getMatch[1];
      const result = await orderController.getOrder(orderId, user.id);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/orders/:id/status - Update order status (Staff/Admin only)
    const statusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
    if (statusMatch && method === 'PUT') {
      const staff = await requireStaff(req, res);
      if (!staff) return;

      const orderId = statusMatch[1];
      const body = await parseRequestBody(req);
      const result = await orderController.updateOrderStatus(orderId, body.status, staff.id, body.notes);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // POST /api/orders/:id/payment - Upload payment proof
    const paymentMatch = pathname.match(/^\/api\/orders\/(\d+)\/payment$/);
    if (paymentMatch && method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const orderId = paymentMatch[1];
      const { fields, files } = await parseMultipartForm(req, 'payment_proofs');
      const result = await orderController.uploadPaymentProof(orderId, user.id, files.payment_proof);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Order endpoint not found', 404));

  } catch (error) {
    console.error('Order route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = orderRoutes;
