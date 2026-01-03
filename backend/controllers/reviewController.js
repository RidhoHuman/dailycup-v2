const { query, queryOne, pool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Create review
async function createReview(userId, data, images = []) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { product_id, order_id, rating, comment } = data;

    // Validation
    if (!product_id || !rating) {
      throw new Error('Product ID and rating are required');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has ordered this product
    if (order_id) {
      const [orderItems] = await connection.execute(
        'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
        [order_id, product_id]
      );

      if (orderItems.length === 0) {
        throw new Error('You have not ordered this product');
      }
    }

    // Check if user already reviewed this product for this order
    const [existing] = await connection.execute(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
      [userId, product_id, order_id || null]
    );

    if (existing.length > 0) {
      throw new Error('You have already reviewed this product for this order');
    }

    // Prepare images JSON
    const imagesJson = images.length > 0 ? JSON.stringify(images.map(img => img.path)) : null;

    // Insert review
    const [result] = await connection.execute(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, comment, images) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, product_id, order_id || null, rating, comment || null, imagesJson]
    );

    // Update product average rating
    const [stats] = await connection.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE product_id = ? AND is_visible = 1',
      [product_id]
    );

    await connection.execute(
      'UPDATE products SET average_rating = ?, total_reviews = ? WHERE id = ?',
      [stats[0].avg_rating || 0, stats[0].total_reviews, product_id]
    );

    await connection.commit();

    return successResponse({ id: result.insertId }, 'Review submitted successfully', 201);

  } catch (error) {
    await connection.rollback();
    console.error('Create review error:', error);
    return errorResponse(error.message || 'Failed to create review', 400);
  } finally {
    connection.release();
  }
}

// Get reviews for a product
async function getProductReviews(productId) {
  try {
    const reviews = await query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    // Parse images
    reviews.forEach(review => {
      try {
        review.images = review.images ? JSON.parse(review.images) : [];
      } catch {
        review.images = [];
      }
    });

    return successResponse(reviews);

  } catch (error) {
    console.error('Get reviews error:', error);
    return errorResponse('Failed to get reviews', 500);
  }
}

// Reply to review (Admin)
async function replyToReview(reviewId, adminReply) {
  try {
    const review = await queryOne('SELECT id FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return errorResponse('Review not found', 404);
    }

    await query(
      'UPDATE reviews SET admin_reply = ?, replied_at = NOW() WHERE id = ?',
      [adminReply, reviewId]
    );

    return successResponse(null, 'Reply added successfully');

  } catch (error) {
    console.error('Reply to review error:', error);
    return errorResponse('Failed to add reply', 500);
  }
}

module.exports = {
  createReview,
  getProductReviews,
  replyToReview
};
