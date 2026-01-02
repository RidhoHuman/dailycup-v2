const { sendResponse, errorResponse } = require('../utils/response');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { parseMultipartForm } = require('../middleware/upload');
const productController = require('../controllers/productController');

async function productRoutes(req, res, pathname, query) {
  const method = req.method;

  try {
    // GET /api/products - Get all products
    if (pathname === '/api/products' && method === 'GET') {
      const result = await productController.getAllProducts(query);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // GET /api/products/:id - Get single product
    const getMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
    if (getMatch && method === 'GET') {
      const identifier = getMatch[1];
      const result = await productController.getProduct(identifier);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // POST /api/products - Create product (Admin only)
    if (pathname === '/api/products' && method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const { fields, files } = await parseMultipartForm(req, 'products');
      const result = await productController.createProduct(fields, files.image);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // PUT /api/products/:id - Update product (Admin only)
    const updateMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const productId = updateMatch[1];
      const { fields, files } = await parseMultipartForm(req, 'products');
      const result = await productController.updateProduct(productId, fields, files.image);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // DELETE /api/products/:id - Delete product (Admin only)
    const deleteMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const productId = deleteMatch[1];
      const result = await productController.deleteProduct(productId);
      sendResponse(res, result.statusCode, result);
      return;
    }

    // 404 Not Found
    sendResponse(res, 404, errorResponse('Product endpoint not found', 404));

  } catch (error) {
    console.error('Product route error:', error);
    sendResponse(res, 500, errorResponse('Internal server error', 500));
  }
}

module.exports = productRoutes;
