const { sendResponse, errorResponse } = require('../utils/response');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { parseMultipartForm } = require('../middleware/upload');
const { parseRequestBody } = require('../utils/helpers');
const reviewController = require('../controllers/reviewController');

async function reviewRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // POST /api/reviews - Create review
    if (pathname === '/api/reviews' && method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;

      const { fields, files } = await parseMultipartForm(req, 'reviews');
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const result = await reviewController.createReview(user.id, fields, images);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/reviews/product/:id - Get product reviews
    const getMatch = pathname.match(/^\/api\/reviews\/product\/(\d+)$/);
    if (getMatch && method === 'GET') {
      const productId = getMatch[1];
      const result = await reviewController.getProductReviews(productId);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/reviews/:id/reply - Reply to review (Admin only)
    const replyMatch = pathname.match(/^\/api\/reviews\/(\d+)\/reply$/);
    if (replyMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const reviewId = replyMatch[1];
      const body = await parseRequestBody(req);
      const result = await reviewController.replyToReview(reviewId, body.admin_reply);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Review endpoint not found', 404));

  } catch (error) {
    console.error('Review route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = reviewRoutes;
