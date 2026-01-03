# 📘 DailyCup v2 - API Documentation

Complete API reference for DailyCup Coffee Shop CRM System.

---

## 📍 Base URL

```
http://localhost:3000/api
```

---

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Table of Contents

- [Authentication](#authentication-endpoints)
- [Products](#products-endpoints)
- [Cart](#cart-endpoints)
- [Orders](#orders-endpoints)
- [Reviews](#reviews-endpoints)
- [Returns](#returns-endpoints)
- [Admin](#admin-endpoints)

---

## 🔑 Authentication Endpoints

### Register User

**POST** `/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "081234567890"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

### Login User

**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

### OAuth Login

**GET** `/auth/google`
- Redirects to Google OAuth consent screen

**GET** `/auth/facebook`
- Redirects to Facebook OAuth consent screen

---

## 🛍️ Products Endpoints

### Get All Products

**GET** `/products`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Results per page (default: 20)
- `category` (number): Filter by category ID
- `search` (string): Search by name or description
- `is_featured` (boolean): Filter featured products
- `sort` (string): Sort field (name, base_price, average_rating, created_at)
- `order` (string): Sort order (ASC, DESC)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Americano",
      "slug": "americano",
      "description": "Espresso with hot water",
      "base_price": 30000,
      "image": "products/americano.jpg",
      "is_featured": 1,
      "is_available": 1,
      "average_rating": 4.5,
      "total_reviews": 120,
      "category_name": "Coffee"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Product Details

**GET** `/products/:id` or `/products/:slug`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Americano",
    "description": "Espresso with hot water",
    "base_price": 30000,
    "variants": {
      "size": [
        { "id": 1, "variant_value": "small", "price_adjustment": 0 },
        { "id": 2, "variant_value": "medium", "price_adjustment": 3000 },
        { "id": 3, "variant_value": "large", "price_adjustment": 5000 }
      ],
      "temperature": [
        { "id": 4, "variant_value": "hot", "price_adjustment": 0 },
        { "id": 5, "variant_value": "iced", "price_adjustment": 3000 }
      ]
    },
    "reviews": [ /* review objects */ ]
  }
}
```

### Create Product (Admin)

**POST** `/products`

**Headers:**
- `Authorization: Bearer TOKEN`
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `category_id`: Category ID
- `name`: Product name
- `description`: Product description
- `base_price`: Base price
- `is_featured`: 1 or 0
- `stock_quantity`: Stock (optional)
- `image`: Product image file

### Update Product (Admin)

**PUT** `/products/:id`

Same as create, all fields optional.

### Delete Product (Admin)

**DELETE** `/products/:id`

---

## 🛒 Cart Endpoints

### Get Cart

**GET** `/cart`

**Headers:**
- `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Americano",
        "size_variant": "medium",
        "temperature_variant": "iced",
        "quantity": 2,
        "price": 36000,
        "notes": "Less ice"
      }
    ],
    "subtotal": 72000,
    "totalItems": 1
  }
}
```

### Add to Cart

**POST** `/cart`

**Body:**
```json
{
  "product_id": 1,
  "size_variant": "medium",
  "temperature_variant": "iced",
  "quantity": 1,
  "notes": "Less ice"
}
```

### Update Cart Item

**PUT** `/cart/:id`

**Body:**
```json
{
  "quantity": 3,
  "notes": "Extra shot"
}
```

### Remove from Cart

**DELETE** `/cart/:id`

### Clear Cart

**DELETE** `/cart`

---

## 📦 Orders Endpoints

### Create Order

**POST** `/orders`

**Body:**
```json
{
  "delivery_method": "delivery",
  "delivery_address": "Jl. Example No. 123, Jakarta",
  "payment_method_id": 1,
  "redeem_code": "WELCOME10",
  "points_used": 100,
  "notes": "Please ring the bell"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order created successfully",
  "data": {
    "order_id": 1,
    "order_number": "DC1704123456001",
    "total": 65000
  }
}
```

### Get User Orders

**GET** `/orders`

**Query Parameters:**
- `page`: Page number
- `pageSize`: Results per page
- `status`: Filter by status

### Get Order Details

**GET** `/orders/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "DC1704123456001",
    "status": "completed",
    "payment_status": "paid",
    "total": 65000,
    "items": [ /* order items */ ],
    "tracking": [ /* tracking history */ ]
  }
}
```

### Update Order Status (Staff/Admin)

**PUT** `/orders/:id/status`

**Body:**
```json
{
  "status": "confirmed",
  "notes": "Order confirmed and being prepared"
}
```

### Upload Payment Proof

**POST** `/orders/:id/payment`

**Headers:**
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `payment_proof`: Payment screenshot file

---

## ⭐ Reviews Endpoints

### Create Review

**POST** `/reviews`

**Headers:**
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `product_id`: Product ID
- `order_id`: Order ID (optional)
- `rating`: Rating (1-5)
- `comment`: Review text
- `images`: Review images (multiple files)

### Get Product Reviews

**GET** `/reviews/product/:productId`

### Reply to Review (Admin)

**PUT** `/reviews/:id/reply`

**Body:**
```json
{
  "admin_reply": "Thank you for your feedback!"
}
```

---

## 🔄 Returns Endpoints

### Create Return Request

**POST** `/returns`

**Headers:**
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `order_id`: Order ID
- `reason`: Reason (wrong_order, damaged, quality_issue, missing_items, other)
- `description`: Detailed description
- `images`: Proof images (multiple files, required)

### Get User Returns

**GET** `/returns`

### Get Return Details

**GET** `/returns/:id`

### Process Return (Staff/Admin)

**PUT** `/returns/:id/process`

**Body:**
```json
{
  "status": "approved",
  "admin_notes": "Return approved, refund processed",
  "refund_amount": 50000
}
```

---

## 👨‍💼 Admin Endpoints

### Get Dashboard Statistics

**GET** `/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 15,
      "revenue": 750000
    },
    "month": {
      "orders": 450,
      "revenue": 22500000
    },
    "pending_orders": 8,
    "total_products": 25,
    "total_customers": 350,
    "recent_orders": [ /* orders */ ],
    "top_products": [ /* products */ ],
    "revenue_by_day": [ /* data */ ]
  }
}
```

### Get All Orders (Admin)

**GET** `/admin/orders`

**Query Parameters:**
- `page`, `pageSize`
- `status`: Filter by status
- `payment_status`: Filter by payment status
- `search`: Search by order number, customer name, or email

### Get All Users (Admin)

**GET** `/admin/users`

**Query Parameters:**
- `page`, `pageSize`
- `role`: Filter by role
- `search`: Search by name or email

### Update User Role (Admin)

**PUT** `/admin/users/:id/role`

**Body:**
```json
{
  "role": "staff"
}
```

### Toggle User Status (Admin)

**PUT** `/admin/users/:id/toggle`

### Category Management

**GET** `/admin/categories` - Get all categories

**POST** `/admin/categories` - Create category
```json
{
  "name": "Beverages",
  "slug": "beverages",
  "description": "All beverages",
  "display_order": 1
}
```

**PUT** `/admin/categories/:id` - Update category

**DELETE** `/admin/categories/:id` - Delete category

### Payment Methods Management

**GET** `/admin/payment-methods` - Get all payment methods

**PUT** `/admin/payment-methods/:id` - Update payment method

### Loyalty Settings

**GET** `/admin/loyalty-settings` - Get loyalty settings

**PUT** `/admin/loyalty-settings` - Update loyalty settings
```json
{
  "points_per_rupiah": 0.01,
  "rupiah_per_point": 100,
  "min_points_redeem": 100,
  "max_points_per_order": 1000
}
```

---

## 🚦 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": null
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔒 Role-Based Access

| Role | Access Level |
|------|-------------|
| `customer` | Can browse, order, review |
| `staff` | Customer access + order management |
| `admin` | Staff access + product/user management |
| `super_admin` | Full access including settings |

---

<div align="center">
  <p><strong>For more information, visit the main README.md</strong></p>
</div>
