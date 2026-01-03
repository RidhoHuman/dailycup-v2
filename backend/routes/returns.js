const { sendResponse, errorResponse } = require('../utils/response');
const { requireAuth, requireStaff } = require('../middleware/auth');
const { parseMultipartForm } = require('../middleware/upload');
const { parseRequestBody } = require('../utils/helpers');
const returnController = require('../controllers/returnController');

async function returnRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // POST /api/returns - Create return request
    if (pathname === '/api/returns' && method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { fields, files } = await parseMultipartForm(req, 'returns');
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const result = await returnController.createReturn(user.id, fields, images);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/returns - Get user returns
    if (pathname === '/api/returns' && method === 'GET') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const result = await returnController.getUserReturns(user.id, query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/returns/:id - Get return details
    const getMatch = pathname.match(/^\/api\/returns\/(\d+)$/);
    if (getMatch && method === 'GET') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const returnId = getMatch[1];
      const result = await returnController.getReturn(returnId, user.id);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/returns/:id/process - Process return (Staff/Admin only)
    const processMatch = pathname.match(/^\/api\/returns\/(\d+)\/process$/);
    if (processMatch && method === 'PUT') {
      const staff = await requireStaff(req, res);
      if (!staff) return;

      const returnId = processMatch[1];
      const body = await parseRequestBody(req);
      const result = await returnController.processReturn(returnId, staff.id, body);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Return endpoint not found', 404));

  } catch (error) {
    console.error('Return route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = returnRoutes;
