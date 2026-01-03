const { query, queryOne, pool } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { generateOrderNumber, calculateOffset } = require('../utils/helpers');
const { RETURN_PREFIX } = require('../config/constants');

// Create return request
async function createReturn(userId, data, images = []) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { order_id, reason, description, items } = data;

    // Validation
    if (!order_id || !reason || !description) {
      throw new Error('Order ID, reason, and description are required');
    }

    if (images.length === 0) {
      throw new Error('Proof images are required');
    }

    // Check if order belongs to user
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, userId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    // Check if order is completed
    if (order.status !== 'completed') {
      throw new Error('Can only return completed orders');
    }

    // Check if return already exists
    const [existingReturn] = await connection.execute(
      'SELECT id FROM returns WHERE order_id = ?',
      [order_id]
    );

    if (existingReturn.length > 0) {
      throw new Error('Return request already exists for this order');
    }

    // Generate return number
    const returnNumber = generateOrderNumber(RETURN_PREFIX);

    // Prepare images JSON
    const imagesJson = JSON.stringify(images.map(img => img.path));

    // Insert return
    const [result] = await connection.execute(
      'INSERT INTO returns (order_id, user_id, return_number, reason, description, images, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order_id, userId, returnNumber, reason, description, imagesJson, 'pending']
    );

    const returnId = result.insertId;

    // Insert return items (if specified, otherwise all order items)
    if (items && items.length > 0) {
      for (const item of items) {
        await connection.execute(
          `INSERT INTO return_items (return_id, order_item_id, product_name, quantity, price, subtotal) 
           SELECT ?, ?, product_name, quantity, price, subtotal FROM order_items WHERE id = ?`,
          [returnId, item.order_item_id, item.order_item_id]
        );
      }
    } else {
      // Return all items
      await connection.execute(
        `INSERT INTO return_items (return_id, order_item_id, product_name, quantity, price, subtotal) 
         SELECT ?, id, product_name, quantity, price, subtotal FROM order_items WHERE order_id = ?`,
        [returnId, order_id]
      );
    }

    // Create notification
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'return', ?, ?, ?)`,
      [userId, 'Return Request Created', `Your return request ${returnNumber} has been submitted`, 
       `/customer/returns.html?id=${returnId}`]
    );

    await connection.commit();

    return successResponse({
      id: returnId,
      return_number: returnNumber
    }, 'Return request created successfully', 201);

  } catch (error) {
    await connection.rollback();
    console.error('Create return error:', error);
    return errorResponse(error.message || 'Failed to create return request', 400);
  } finally {
    connection.release();
  }
}

// Get user returns
async function getUserReturns(userId, queryParams = {}) {
  try {
    const { page = 1, pageSize = 10 } = queryParams;

    // Count total
    const countResult = await queryOne(
      'SELECT COUNT(*) as total FROM returns WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    // Get returns
    const offset = calculateOffset(page, pageSize);
    const returns = await query(
      `SELECT r.*, o.order_number
       FROM returns r
       LEFT JOIN orders o ON r.order_id = o.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );

    // Parse images
    returns.forEach(ret => {
      try {
        ret.images = ret.images ? JSON.parse(ret.images) : [];
      } catch {
        ret.images = [];
      }
    });

    return paginatedResponse(returns, page, pageSize, total);

  } catch (error) {
    console.error('Get returns error:', error);
    return errorResponse('Failed to get returns', 500);
  }
}

// Get return details
async function getReturn(returnId, userId = null) {
  try {
    let sql = `
      SELECT r.*, o.order_number, u.name as customer_name, u.email as customer_email
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `;
    
    let params = [returnId];
    
    if (userId) {
      sql += ' AND r.user_id = ?';
      params.push(userId);
    }

    const returnData = await queryOne(sql, params);

    if (!returnData) {
      return errorResponse('Return not found', 404);
    }

    // Parse images
    try {
      returnData.images = returnData.images ? JSON.parse(returnData.images) : [];
    } catch {
      returnData.images = [];
    }

    // Get return items
    const items = await query(
      'SELECT * FROM return_items WHERE return_id = ?',
      [returnId]
    );

    returnData.items = items;

    return successResponse(returnData);

  } catch (error) {
    console.error('Get return error:', error);
    return errorResponse('Failed to get return', 500);
  }
}

// Process return (Admin)
async function processReturn(returnId, userId, data) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { status, admin_notes, refund_amount } = data;

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      throw new Error('Invalid status');
    }

    // Get return
    const [returns] = await connection.execute(
      'SELECT * FROM returns WHERE id = ?',
      [returnId]
    );

    if (returns.length === 0) {
      throw new Error('Return not found');
    }

    const returnData = returns[0];

    // Update return
    await connection.execute(
      'UPDATE returns SET status = ?, admin_notes = ?, refund_amount = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
      [status, admin_notes || null, refund_amount || null, userId, returnId]
    );

    // Create notification
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'return', ?, ?, ?)`,
      [returnData.user_id, 'Return Update', 
       `Your return request ${returnData.return_number} has been ${status}`, 
       `/customer/returns.html?id=${returnId}`]
    );

    await connection.commit();

    return successResponse(null, 'Return processed successfully');

  } catch (error) {
    await connection.rollback();
    console.error('Process return error:', error);
    return errorResponse(error.message || 'Failed to process return', 400);
  } finally {
    connection.release();
  }
}

// Get all returns (Admin)
async function getAllReturns(queryParams = {}) {
  try {
    const { page = 1, pageSize = 20, status } = queryParams;

    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('r.status = ?');
      params.push(status);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countResult = await queryOne(`SELECT COUNT(*) as total FROM returns r ${whereSQL}`, params);
    const total = countResult.total;

    // Get returns
    const offset = calculateOffset(page, pageSize);
    const returns = await query(
      `SELECT r.*, o.order_number, u.name as customer_name, u.email as customer_email
       FROM returns r
       LEFT JOIN orders o ON r.order_id = o.id
       LEFT JOIN users u ON r.user_id = u.id
       ${whereSQL}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    // Parse images
    returns.forEach(ret => {
      try {
        ret.images = ret.images ? JSON.parse(ret.images) : [];
      } catch {
        ret.images = [];
      }
    });

    return paginatedResponse(returns, page, pageSize, total);

  } catch (error) {
    console.error('Get all returns error:', error);
    return errorResponse('Failed to get returns', 500);
  }
}

module.exports = {
  createReturn,
  getUserReturns,
  getReturn,
  processReturn,
  getAllReturns
};
