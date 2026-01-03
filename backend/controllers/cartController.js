const { query, queryOne } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get cart items for user
async function getCart(userId) {
  try {
    const cartItems = await query(
      `SELECT c.*, p.name as product_name, p.image, p.is_available
       FROM carts c
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    return successResponse({
      items: cartItems,
      subtotal,
      totalItems: cartItems.length
    });

  } catch (error) {
    console.error('Get cart error:', error);
    return errorResponse('Failed to get cart', 500);
  }
}

// Add item to cart
async function addToCart(userId, data) {
  try {
    const { product_id, size_variant, temperature_variant, quantity = 1, notes } = data;

    // Validation
    if (!product_id) {
      return errorResponse('Product ID is required', 400);
    }

    // Get product details
    const product = await queryOne(
      'SELECT id, base_price, is_available FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    if (!product.is_available) {
      return errorResponse('Product is not available', 400);
    }

    // Calculate price with variants
    let price = parseFloat(product.base_price);

    if (size_variant) {
      const sizeVar = await queryOne(
        'SELECT price_adjustment FROM product_variants WHERE product_id = ? AND variant_type = ? AND variant_value = ?',
        [product_id, 'size', size_variant]
      );
      if (sizeVar) price += parseFloat(sizeVar.price_adjustment);
    }

    if (temperature_variant) {
      const tempVar = await queryOne(
        'SELECT price_adjustment FROM product_variants WHERE product_id = ? AND variant_type = ? AND variant_value = ?',
        [product_id, 'temperature', temperature_variant]
      );
      if (tempVar) price += parseFloat(tempVar.price_adjustment);
    }

    // Check if item already exists in cart with same variants
    const existing = await queryOne(
      `SELECT id, quantity FROM carts 
       WHERE user_id = ? AND product_id = ? AND 
       (size_variant = ? OR (size_variant IS NULL AND ? IS NULL)) AND
       (temperature_variant = ? OR (temperature_variant IS NULL AND ? IS NULL))`,
      [userId, product_id, size_variant, size_variant, temperature_variant, temperature_variant]
    );

    if (existing) {
      // Update quantity
      await query(
        'UPDATE carts SET quantity = quantity + ?, price = ?, notes = ? WHERE id = ?',
        [quantity, price, notes || null, existing.id]
      );
      return successResponse({ id: existing.id }, 'Cart updated successfully');
    } else {
      // Insert new cart item
      const result = await query(
        'INSERT INTO carts (user_id, product_id, size_variant, temperature_variant, quantity, price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, product_id, size_variant || null, temperature_variant || null, quantity, price, notes || null]
      );
      return successResponse({ id: result.insertId }, 'Item added to cart', 201);
    }

  } catch (error) {
    console.error('Add to cart error:', error);
    return errorResponse('Failed to add to cart', 500);
  }
}

// Update cart item quantity
async function updateCartItem(userId, cartId, data) {
  try {
    const { quantity, notes } = data;

    // Check if cart item belongs to user
    const cartItem = await queryOne(
      'SELECT id FROM carts WHERE id = ? AND user_id = ?',
      [cartId, userId]
    );

    if (!cartItem) {
      return errorResponse('Cart item not found', 404);
    }

    // Validation
    if (quantity !== undefined && quantity < 1) {
      return errorResponse('Quantity must be at least 1', 400);
    }

    let updateFields = [];
    let params = [];

    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      params.push(quantity);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    params.push(cartId);
    await query(`UPDATE carts SET ${updateFields.join(', ')} WHERE id = ?`, params);

    return successResponse(null, 'Cart item updated successfully');

  } catch (error) {
    console.error('Update cart error:', error);
    return errorResponse('Failed to update cart', 500);
  }
}

// Remove item from cart
async function removeFromCart(userId, cartId) {
  try {
    // Check if cart item belongs to user
    const cartItem = await queryOne(
      'SELECT id FROM carts WHERE id = ? AND user_id = ?',
      [cartId, userId]
    );

    if (!cartItem) {
      return errorResponse('Cart item not found', 404);
    }

    await query('DELETE FROM carts WHERE id = ?', [cartId]);

    return successResponse(null, 'Item removed from cart');

  } catch (error) {
    console.error('Remove from cart error:', error);
    return errorResponse('Failed to remove from cart', 500);
  }
}

// Clear cart
async function clearCart(userId) {
  try {
    await query('DELETE FROM carts WHERE user_id = ?', [userId]);
    return successResponse(null, 'Cart cleared successfully');
  } catch (error) {
    console.error('Clear cart error:', error);
    return errorResponse('Failed to clear cart', 500);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
