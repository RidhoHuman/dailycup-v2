const { query, queryOne, pool } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { generateOrderNumber, calculateOffset } = require('../utils/helpers');
const { sendOrderCompletedEmail, sendOrderStatusEmail } = require('../utils/email');
const { ORDER_PREFIX } = require('../config/constants');

// Create order from cart
async function createOrder(userId, data) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { delivery_method, delivery_address, payment_method_id, redeem_code, points_used = 0 } = data;

    // Validation
    if (!delivery_method || !['dine_in', 'takeaway', 'delivery'].includes(delivery_method)) {
      throw new Error('Invalid delivery method');
    }

    if (delivery_method === 'delivery' && !delivery_address) {
      throw new Error('Delivery address is required');
    }

    // Get cart items
    const [cartItems] = await connection.execute(
      `SELECT c.*, p.name as product_name, p.is_available, p.stock_quantity
       FROM carts c
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Check product availability
    for (const item of cartItems) {
      if (!item.is_available) {
        throw new Error(`Product "${item.product_name}" is not available`);
      }
      if (item.stock_quantity !== null && item.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${item.product_name}"`);
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // Apply redeem code discount
    let discountAmount = 0;
    let redeemCodeId = null;
    
    if (redeem_code) {
      const [codes] = await connection.execute(
        `SELECT * FROM redeem_codes 
         WHERE code = ? AND is_active = 1 
         AND start_date <= CURDATE() AND end_date >= CURDATE()
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [redeem_code]
      );

      if (codes.length > 0) {
        const code = codes[0];
        
        if (subtotal >= parseFloat(code.min_purchase)) {
          redeemCodeId = code.id;
          
          if (code.discount_type === 'percentage') {
            discountAmount = subtotal * (parseFloat(code.discount_value) / 100);
            if (code.max_discount) {
              discountAmount = Math.min(discountAmount, parseFloat(code.max_discount));
            }
          } else {
            discountAmount = parseFloat(code.discount_value);
          }
        }
      }
    }

    // Apply loyalty points discount
    let pointsDiscount = 0;
    const [userResult] = await connection.execute(
      'SELECT loyalty_points FROM users WHERE id = ?',
      [userId]
    );
    const userPoints = userResult[0].loyalty_points;

    if (points_used > 0) {
      if (points_used > userPoints) {
        throw new Error('Insufficient loyalty points');
      }

      // Get loyalty settings
      const [settings] = await connection.execute('SELECT * FROM loyalty_settings WHERE is_active = 1 LIMIT 1');
      if (settings.length > 0) {
        const setting = settings[0];
        
        if (points_used >= setting.min_points_redeem) {
          const maxPoints = setting.max_points_per_order || points_used;
          const actualPoints = Math.min(points_used, maxPoints);
          pointsDiscount = actualPoints * parseFloat(setting.rupiah_per_point);
        }
      }
    }

    // Calculate total
    const total = Math.max(0, subtotal - discountAmount - pointsDiscount);

    // Generate order number
    const orderNumber = generateOrderNumber(ORDER_PREFIX);

    // Insert order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, delivery_method, delivery_address, subtotal, 
       discount_amount, points_used, points_discount, total, payment_method_id, payment_status, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [userId, orderNumber, delivery_method, delivery_address || null, subtotal, 
       discountAmount, points_used, pointsDiscount, total, payment_method_id || null]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, size_variant, 
         temperature_variant, quantity, price, subtotal, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.size_variant, 
         item.temperature_variant, item.quantity, item.price, 
         parseFloat(item.price) * item.quantity, item.notes]
      );

      // Update stock if applicable
      if (item.stock_quantity !== null) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // Insert order tracking
    await connection.execute(
      'INSERT INTO order_tracking (order_id, status, notes, created_by) VALUES (?, ?, ?, ?)',
      [orderId, 'pending', 'Order created', userId]
    );

    // Update redeem code usage
    if (redeemCodeId) {
      await connection.execute(
        'UPDATE redeem_codes SET used_count = used_count + 1 WHERE id = ?',
        [redeemCodeId]
      );
      await connection.execute(
        'INSERT INTO redeem_code_usage (redeem_code_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
        [redeemCodeId, userId, orderId, discountAmount]
      );
    }

    // Deduct loyalty points if used
    if (points_used > 0 && pointsDiscount > 0) {
      await connection.execute(
        'UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?',
        [points_used, userId]
      );
      await connection.execute(
        `INSERT INTO loyalty_transactions (user_id, order_id, transaction_type, points, 
         description, balance_before, balance_after) 
         VALUES (?, ?, 'redeem', ?, 'Redeem points for order', ?, ?)`,
        [userId, orderId, -points_used, userPoints, userPoints - points_used]
      );
    }

    // Clear cart
    await connection.execute('DELETE FROM carts WHERE user_id = ?', [userId]);

    // Create notification
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'order_status', ?, ?, ?)`,
      [userId, 'Order Created', `Your order ${orderNumber} has been created successfully`, `/customer/order-tracking.html?id=${orderId}`]
    );

    await connection.commit();

    return successResponse({
      order_id: orderId,
      order_number: orderNumber,
      total
    }, 'Order created successfully', 201);

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    return errorResponse(error.message || 'Failed to create order', 400);
  } finally {
    connection.release();
  }
}

// Get user orders
async function getUserOrders(userId, queryParams = {}) {
  try {
    const { page = 1, pageSize = 10, status } = queryParams;

    let whereClauses = ['user_id = ?'];
    let params = [userId];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereSQL = whereClauses.join(' AND ');

    // Count total
    const countResult = await queryOne(`SELECT COUNT(*) as total FROM orders WHERE ${whereSQL}`, params);
    const total = countResult.total;

    // Get orders
    const offset = calculateOffset(page, pageSize);
    const orders = await query(
      `SELECT o.*, pm.name as payment_method_name
       FROM orders o
       LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
       WHERE ${whereSQL}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    return paginatedResponse(orders, page, pageSize, total);

  } catch (error) {
    console.error('Get orders error:', error);
    return errorResponse('Failed to get orders', 500);
  }
}

// Get order details
async function getOrder(orderId, userId = null) {
  try {
    let sql = `
      SELECT o.*, pm.name as payment_method_name, pm.type as payment_method_type,
             pm.account_name, pm.account_number, pm.instructions,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    
    let params = [orderId];
    
    if (userId) {
      sql += ' AND o.user_id = ?';
      params.push(userId);
    }

    const order = await queryOne(sql, params);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Get order items
    const items = await query(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
      [orderId]
    );

    order.items = items;

    // Get tracking history
    const tracking = await query(
      `SELECT ot.*, u.name as updated_by_name
       FROM order_tracking ot
       LEFT JOIN users u ON ot.created_by = u.id
       WHERE ot.order_id = ?
       ORDER BY ot.created_at ASC`,
      [orderId]
    );

    order.tracking = tracking;

    return successResponse(order);

  } catch (error) {
    console.error('Get order error:', error);
    return errorResponse('Failed to get order', 500);
  }
}

// Update order status (Admin only)
async function updateOrderStatus(orderId, status, userId, notes = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const validStatuses = ['pending', 'confirmed', 'processing', 'ready', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Get order
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    // Update order status
    await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    // Insert tracking
    await connection.execute(
      'INSERT INTO order_tracking (order_id, status, notes, created_by) VALUES (?, ?, ?, ?)',
      [orderId, status, notes, userId]
    );

    // Create notification
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'order_status', ?, ?, ?)`,
      [order.user_id, 'Order Update', `Your order ${order.order_number} status has been updated to ${status}`, 
       `/customer/order-tracking.html?id=${orderId}`]
    );

    // If order completed, award loyalty points and send email
    if (status === 'completed') {
      const [settings] = await connection.execute(
        'SELECT * FROM loyalty_settings WHERE is_active = 1 LIMIT 1'
      );

      if (settings.length > 0) {
        const setting = settings[0];
        const pointsEarned = Math.floor(parseFloat(order.total) * parseFloat(setting.points_per_rupiah));

        if (pointsEarned > 0) {
          const [userResult] = await connection.execute(
            'SELECT loyalty_points FROM users WHERE id = ?',
            [order.user_id]
          );
          const currentPoints = userResult[0].loyalty_points;
          const newPoints = currentPoints + pointsEarned;

          await connection.execute(
            'UPDATE users SET loyalty_points = ? WHERE id = ?',
            [newPoints, order.user_id]
          );

          await connection.execute(
            `INSERT INTO loyalty_transactions (user_id, order_id, transaction_type, points, 
             description, balance_before, balance_after) 
             VALUES (?, ?, 'earn', ?, ?, ?, ?)`,
            [order.user_id, orderId, pointsEarned, `Earned from order ${order.order_number}`, 
             currentPoints, newPoints]
          );
        }
      }

      // Send email notification
      const [users] = await connection.execute(
        'SELECT name, email FROM users WHERE id = ?',
        [order.user_id]
      );
      
      if (users.length > 0) {
        const user = users[0];
        await sendOrderCompletedEmail(user.email, user.name, order.order_number, parseFloat(order.total));
      }
    }

    await connection.commit();

    return successResponse(null, 'Order status updated successfully');

  } catch (error) {
    await connection.rollback();
    console.error('Update order status error:', error);
    return errorResponse(error.message || 'Failed to update order status', 400);
  } finally {
    connection.release();
  }
}

// Upload payment proof
async function uploadPaymentProof(orderId, userId, file) {
  try {
    // Check if order belongs to user
    const order = await queryOne(
      'SELECT id, status, payment_status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.payment_status === 'paid') {
      return errorResponse('Payment already confirmed', 400);
    }

    // Update payment proof
    await query(
      'UPDATE orders SET payment_proof = ?, payment_status = ? WHERE id = ?',
      [file.path, 'pending', orderId]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'payment', ?, ?, ?)`,
      [userId, 'Payment Proof Uploaded', 'Your payment proof has been uploaded and is being verified', 
       `/customer/order-tracking.html?id=${orderId}`]
    );

    return successResponse(null, 'Payment proof uploaded successfully');

  } catch (error) {
    console.error('Upload payment proof error:', error);
    return errorResponse('Failed to upload payment proof', 500);
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  uploadPaymentProof
};
