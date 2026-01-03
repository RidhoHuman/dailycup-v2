const { query, queryOne } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { calculateOffset } = require('../utils/helpers');

// Dashboard statistics
async function getDashboardStats() {
  try {
    // Total orders today
    const ordersToday = await queryOne(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()'
    );

    // Total orders this month
    const ordersMonth = await queryOne(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
    );

    // Pending orders
    const pendingOrders = await queryOne(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed', 'processing')"
    );

    // Total products
    const totalProducts = await queryOne('SELECT COUNT(*) as count FROM products WHERE is_available = 1');

    // Total customers
    const totalCustomers = await queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND is_active = 1");

    // Recent orders
    const recentOrders = await query(
      `SELECT o.*, u.name as customer_name 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Top selling products
    const topProducts = await query(
      `SELECT p.name, p.image, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY oi.product_id
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    // Revenue by day (last 7 days)
    const revenueByDay = await query(
      `SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
       FROM orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    return successResponse({
      today: {
        orders: ordersToday.count,
        revenue: parseFloat(ordersToday.revenue)
      },
      month: {
        orders: ordersMonth.count,
        revenue: parseFloat(ordersMonth.revenue)
      },
      pending_orders: pendingOrders.count,
      total_products: totalProducts.count,
      total_customers: totalCustomers.count,
      recent_orders: recentOrders,
      top_products: topProducts,
      revenue_by_day: revenueByDay
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse('Failed to get dashboard statistics', 500);
  }
}

// Get all orders (Admin)
async function getAllOrders(queryParams = {}) {
  try {
    const { page = 1, pageSize = 20, status, payment_status, search } = queryParams;

    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('o.status = ?');
      params.push(status);
    }

    if (payment_status) {
      whereClauses.push('o.payment_status = ?');
      params.push(payment_status);
    }

    if (search) {
      whereClauses.push('(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id ${whereSQL}`,
      params
    );
    const total = countResult.total;

    // Get orders
    const offset = calculateOffset(page, pageSize);
    const orders = await query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, pm.name as payment_method_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
       ${whereSQL}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    return paginatedResponse(orders, page, pageSize, total);

  } catch (error) {
    console.error('Get all orders error:', error);
    return errorResponse('Failed to get orders', 500);
  }
}

// Get all users (Admin)
async function getAllUsers(queryParams = {}) {
  try {
    const { page = 1, pageSize = 20, role, search } = queryParams;

    let whereClauses = [];
    let params = [];

    if (role) {
      whereClauses.push('role = ?');
      params.push(role);
    }

    if (search) {
      whereClauses.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countResult = await queryOne(`SELECT COUNT(*) as total FROM users ${whereSQL}`, params);
    const total = countResult.total;

    // Get users
    const offset = calculateOffset(page, pageSize);
    const users = await query(
      `SELECT id, name, email, phone, role, oauth_provider, loyalty_points, is_active, created_at
       FROM users
       ${whereSQL}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    return paginatedResponse(users, page, pageSize, total);

  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse('Failed to get users', 500);
  }
}

// Update user role (Super Admin only)
async function updateUserRole(userId, role) {
  try {
    const validRoles = ['customer', 'staff', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return errorResponse('Invalid role', 400);
    }

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    return successResponse(null, 'User role updated successfully');

  } catch (error) {
    console.error('Update user role error:', error);
    return errorResponse('Failed to update user role', 500);
  }
}

// Toggle user active status (Admin)
async function toggleUserStatus(userId) {
  try {
    const user = await queryOne('SELECT id, is_active FROM users WHERE id = ?', [userId]);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const newStatus = user.is_active ? 0 : 1;
    await query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);

    return successResponse({ is_active: newStatus }, 'User status updated successfully');

  } catch (error) {
    console.error('Toggle user status error:', error);
    return errorResponse('Failed to update user status', 500);
  }
}

// Get all categories (Admin)
async function getAllCategories() {
  try {
    const categories = await query(
      'SELECT * FROM categories ORDER BY display_order ASC, name ASC'
    );

    return successResponse(categories);

  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse('Failed to get categories', 500);
  }
}

// Create category (Admin)
async function createCategory(data) {
  try {
    const { name, slug, description, display_order = 0 } = data;

    if (!name || !slug) {
      return errorResponse('Name and slug are required', 400);
    }

    // Check if slug exists
    const existing = await queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) {
      return errorResponse('Category with this slug already exists', 400);
    }

    const result = await query(
      'INSERT INTO categories (name, slug, description, display_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, slug, description || null, display_order]
    );

    return successResponse({ id: result.insertId }, 'Category created successfully', 201);

  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse('Failed to create category', 500);
  }
}

// Update category (Admin)
async function updateCategory(id, data) {
  try {
    const existing = await queryOne('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Category not found', 404);
    }

    const { name, slug, description, display_order, is_active } = data;

    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }

    if (slug) {
      // Check if slug already exists for another category
      const slugExists = await queryOne(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if (slugExists) {
        return errorResponse('Slug already exists', 400);
      }
      updateFields.push('slug = ?');
      params.push(slug);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }

    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      params.push(display_order);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    params.push(id);
    await query(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`, params);

    return successResponse(null, 'Category updated successfully');

  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse('Failed to update category', 500);
  }
}

// Delete category (Admin)
async function deleteCategory(id) {
  try {
    const existing = await queryOne('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Category not found', 404);
    }

    // Check if category has products
    const hasProducts = await queryOne(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (hasProducts.count > 0) {
      return errorResponse('Cannot delete category with products', 400);
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);

    return successResponse(null, 'Category deleted successfully');

  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse('Failed to delete category', 500);
  }
}

// Get payment methods (Admin)
async function getPaymentMethods() {
  try {
    const methods = await query(
      'SELECT * FROM payment_methods ORDER BY display_order ASC'
    );

    return successResponse(methods);

  } catch (error) {
    console.error('Get payment methods error:', error);
    return errorResponse('Failed to get payment methods', 500);
  }
}

// Update payment method (Admin)
async function updatePaymentMethod(id, data) {
  try {
    const existing = await queryOne('SELECT id FROM payment_methods WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Payment method not found', 404);
    }

    const { name, account_name, account_number, instructions, is_active } = data;

    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }

    if (account_name !== undefined) {
      updateFields.push('account_name = ?');
      params.push(account_name);
    }

    if (account_number !== undefined) {
      updateFields.push('account_number = ?');
      params.push(account_number);
    }

    if (instructions !== undefined) {
      updateFields.push('instructions = ?');
      params.push(instructions);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    params.push(id);
    await query(`UPDATE payment_methods SET ${updateFields.join(', ')} WHERE id = ?`, params);

    return successResponse(null, 'Payment method updated successfully');

  } catch (error) {
    console.error('Update payment method error:', error);
    return errorResponse('Failed to update payment method', 500);
  }
}

// Get loyalty settings (Admin)
async function getLoyaltySettings() {
  try {
    const settings = await queryOne('SELECT * FROM loyalty_settings WHERE is_active = 1 LIMIT 1');
    
    if (!settings) {
      return errorResponse('Loyalty settings not found', 404);
    }

    return successResponse(settings);

  } catch (error) {
    console.error('Get loyalty settings error:', error);
    return errorResponse('Failed to get loyalty settings', 500);
  }
}

// Update loyalty settings (Admin)
async function updateLoyaltySettings(data) {
  try {
    const { points_per_rupiah, rupiah_per_point, min_points_redeem, max_points_per_order } = data;

    let updateFields = [];
    let params = [];

    if (points_per_rupiah !== undefined) {
      updateFields.push('points_per_rupiah = ?');
      params.push(parseFloat(points_per_rupiah));
    }

    if (rupiah_per_point !== undefined) {
      updateFields.push('rupiah_per_point = ?');
      params.push(parseFloat(rupiah_per_point));
    }

    if (min_points_redeem !== undefined) {
      updateFields.push('min_points_redeem = ?');
      params.push(parseInt(min_points_redeem));
    }

    if (max_points_per_order !== undefined) {
      updateFields.push('max_points_per_order = ?');
      params.push(max_points_per_order ? parseInt(max_points_per_order) : null);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    await query(`UPDATE loyalty_settings SET ${updateFields.join(', ')} WHERE is_active = 1`, params);

    return successResponse(null, 'Loyalty settings updated successfully');

  } catch (error) {
    console.error('Update loyalty settings error:', error);
    return errorResponse('Failed to update loyalty settings', 500);
  }
}

module.exports = {
  getDashboardStats,
  getAllOrders,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPaymentMethods,
  updatePaymentMethod,
  getLoyaltySettings,
  updateLoyaltySettings
};
