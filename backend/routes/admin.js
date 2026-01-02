const { sendResponse, errorResponse } = require('../utils/response');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const { parseRequestBody } = require('../utils/helpers');
const adminController = require('../controllers/adminController');
const returnController = require('../controllers/returnController');

async function adminRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // GET /api/admin/dashboard - Dashboard statistics
    if (pathname === '/api/admin/dashboard' && method === 'GET') {
      const admin = await requireStaff(req, res);
      if (!admin) return;

      const result = await adminController.getDashboardStats();
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/orders - Get all orders
    if (pathname === '/api/admin/orders' && method === 'GET') {
      const admin = await requireStaff(req, res);
      if (!admin) return;

      const result = await adminController.getAllOrders(query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/users - Get all users
    if (pathname === '/api/admin/users' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const result = await adminController.getAllUsers(query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/admin/users/:id/role - Update user role
    const roleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
    if (roleMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const userId = roleMatch[1];
      const body = await parseRequestBody(req);
      const result = await adminController.updateUserRole(userId, body.role);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/admin/users/:id/toggle - Toggle user status
    const toggleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/toggle$/);
    if (toggleMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const userId = toggleMatch[1];
      const result = await adminController.toggleUserStatus(userId);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/categories - Get all categories
    if (pathname === '/api/admin/categories' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const result = await adminController.getAllCategories();
      sendResponse(res, result.statusCode, result);
      return;
    }

    // POST /api/admin/categories - Create category
    if (pathname === '/api/admin/categories' && method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const body = await parseRequestBody(req);
      const result = await adminController.createCategory(body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/admin/categories/:id - Update category
    const catUpdateMatch = pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (catUpdateMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const categoryId = catUpdateMatch[1];
      const body = await parseRequestBody(req);
      const result = await adminController.updateCategory(categoryId, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // DELETE /api/admin/categories/:id - Delete category
    const catDeleteMatch = pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (catDeleteMatch && method === 'DELETE') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const categoryId = catDeleteMatch[1];
      const result = await adminController.deleteCategory(categoryId);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/returns - Get all returns
    if (pathname === '/api/admin/returns' && method === 'GET') {
      const admin = await requireStaff(req, res);
      if (!admin) return;

      const result = await returnController.getAllReturns(query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/payment-methods - Get payment methods
    if (pathname === '/api/admin/payment-methods' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const result = await adminController.getPaymentMethods();
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/admin/payment-methods/:id - Update payment method
    const pmMatch = pathname.match(/^\/api\/admin\/payment-methods\/(\d+)$/);
    if (pmMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const methodId = pmMatch[1];
      const body = await parseRequestBody(req);
      const result = await adminController.updatePaymentMethod(methodId, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/admin/loyalty-settings - Get loyalty settings
    if (pathname === '/api/admin/loyalty-settings' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const result = await adminController.getLoyaltySettings();
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/admin/loyalty-settings - Update loyalty settings
    if (pathname === '/api/admin/loyalty-settings' && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const body = await parseRequestBody(req);
      const result = await adminController.updateLoyaltySettings(body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Admin endpoint not found', 404));

  } catch (error) {
    console.error('Admin route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = adminRoutes;
