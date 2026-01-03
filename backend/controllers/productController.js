const { query, queryOne } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { calculateOffset, generateSlug } = require('../utils/helpers');

// Get all products with pagination and filters
async function getAllProducts(queryParams = {}) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      search, 
      is_featured, 
      sort = 'created_at', 
      order = 'DESC' 
    } = queryParams;

    let whereClauses = ['p.is_available = 1'];
    let params = [];

    // Filter by category
    if (category) {
      whereClauses.push('p.category_id = ?');
      params.push(category);
    }

    // Search by name or description
    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter featured products
    if (is_featured) {
      whereClauses.push('p.is_featured = 1');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countSQL = `SELECT COUNT(*) as total FROM products p ${whereSQL}`;
    const countResult = await queryOne(countSQL, params);
    const total = countResult.total;

    // Get products
    const offset = calculateOffset(page, pageSize);
    const validSort = ['name', 'base_price', 'average_rating', 'created_at'].includes(sort) ? sort : 'created_at';
    const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSQL}
      ORDER BY p.${validSort} ${validOrder}
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(pageSize), offset);
    const products = await query(sql, params);

    // Parse gallery images
    products.forEach(product => {
      try {
        product.images_gallery = product.images_gallery ? JSON.parse(product.images_gallery) : [];
      } catch {
        product.images_gallery = [];
      }
    });

    return paginatedResponse(products, page, pageSize, total);

  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse('Failed to get products', 500);
  }
}

// Get single product by ID or slug
async function getProduct(identifier) {
  try {
    const isNumeric = !isNaN(identifier);
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${isNumeric ? 'p.id' : 'p.slug'} = ?
    `;

    const product = await queryOne(sql, [identifier]);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Parse gallery images
    try {
      product.images_gallery = product.images_gallery ? JSON.parse(product.images_gallery) : [];
    } catch {
      product.images_gallery = [];
    }

    // Get variants
    const variants = await query(
      'SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1 ORDER BY variant_type, price_adjustment',
      [product.id]
    );

    // Group variants by type
    product.variants = {
      size: variants.filter(v => v.variant_type === 'size'),
      temperature: variants.filter(v => v.variant_type === 'temperature')
    };

    // Get reviews
    const reviews = await query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND r.is_visible = 1 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [product.id]
    );

    // Parse review images
    reviews.forEach(review => {
      try {
        review.images = review.images ? JSON.parse(review.images) : [];
      } catch {
        review.images = [];
      }
    });

    product.reviews = reviews;

    return successResponse(product);

  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse('Failed to get product', 500);
  }
}

// Create new product (Admin only)
async function createProduct(data, imageFile = null) {
  try {
    const { category_id, name, description, base_price, is_featured = 0, stock_quantity = null } = data;

    // Validation
    if (!category_id || !name || !base_price) {
      return errorResponse('Category, name and price are required', 400);
    }

    // Generate slug
    const slug = generateSlug(name);

    // Check if slug exists
    const existing = await queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing) {
      return errorResponse('Product with similar name already exists', 400);
    }

    // Insert product
    const result = await query(
      `INSERT INTO products (category_id, name, slug, description, base_price, image, is_featured, stock_quantity, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [category_id, name, slug, description || null, parseFloat(base_price), 
       imageFile ? imageFile.path : null, is_featured ? 1 : 0, stock_quantity]
    );

    return successResponse({ 
      id: result.insertId, 
      slug 
    }, 'Product created successfully', 201);

  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse('Failed to create product', 500);
  }
}

// Update product (Admin only)
async function updateProduct(id, data, imageFile = null) {
  try {
    // Check if product exists
    const existing = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Product not found', 404);
    }

    const { category_id, name, description, base_price, is_featured, is_available, stock_quantity } = data;

    let updateFields = [];
    let params = [];

    if (category_id) {
      updateFields.push('category_id = ?');
      params.push(category_id);
    }

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
      const slug = generateSlug(name);
      if (slug !== existing.slug) {
        const slugExists = await queryOne('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, id]);
        if (slugExists) {
          return errorResponse('Product with similar name already exists', 400);
        }
        updateFields.push('slug = ?');
        params.push(slug);
      }
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }

    if (base_price) {
      updateFields.push('base_price = ?');
      params.push(parseFloat(base_price));
    }

    if (imageFile) {
      updateFields.push('image = ?');
      params.push(imageFile.path);
    }

    if (is_featured !== undefined) {
      updateFields.push('is_featured = ?');
      params.push(is_featured ? 1 : 0);
    }

    if (is_available !== undefined) {
      updateFields.push('is_available = ?');
      params.push(is_available ? 1 : 0);
    }

    if (stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      params.push(stock_quantity);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    params.push(id);
    await query(`UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`, params);

    return successResponse(null, 'Product updated successfully');

  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse('Failed to update product', 500);
  }
}

// Delete product (Admin only)
async function deleteProduct(id) {
  try {
    const existing = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Product not found', 404);
    }

    await query('DELETE FROM products WHERE id = ?', [id]);

    return successResponse(null, 'Product deleted successfully');

  } catch (error) {
    console.error('Delete product error:', error);
    return errorResponse('Failed to delete product', 500);
  }
}

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
