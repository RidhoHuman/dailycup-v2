# DailyCup v2 - Coffee Shop CRM System

<div align="center">
  <h1>☕ DailyCup v2</h1>
  <p><strong>Complete CRM Website for Coffee Shop</strong></p>
  <p>Node.js Native + MySQL + Vanilla JavaScript</p>
</div>

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Usage](#usage)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

DailyCup v2 is a comprehensive Customer Relationship Management (CRM) system built specifically for coffee shops. It features a complete e-commerce solution with product management, order processing, customer loyalty program, and admin dashboard - all built using **vanilla Node.js HTTP module** (no Express!), MySQL database, and pure HTML/CSS/JavaScript frontend.

---

## ✨ Features

### 🛍️ Customer Features
- **User Authentication**: Register/Login with JWT + OAuth (Google & Facebook)
- **Product Browsing**: Search, filter by category, view detailed product information
- **Shopping Cart**: Add items with size and temperature variants
- **Order Management**: Multiple delivery methods (dine-in, takeaway, delivery)
- **Payment Options**: Bank transfer, QRIS, E-wallets (GoPay, OVO, Dana, ShopeePay)
- **Order Tracking**: Real-time order status updates
- **Reviews & Ratings**: Rate products with photos
- **Loyalty Points**: Earn and redeem points for discounts
- **Voucher System**: Apply discount codes
- **Product Returns**: Request returns with photo evidence
- **Favorites**: Save favorite products
- **Notifications**: In-app notifications for order updates

### 👨‍💼 Admin Features
- **Dashboard**: Comprehensive statistics and charts
- **Product Management**: Full CRUD for products and categories
- **Order Management**: View, process, and update order status
- **User Management**: Manage customer and staff accounts
- **Returns Processing**: Review and approve/reject return requests
- **Review Management**: View and reply to customer reviews
- **Loyalty Settings**: Configure points earning and redemption
- **Payment Methods**: Manage payment options
- **Reports**: Sales reports and analytics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js (Native HTTP module) |
| **Database** | MySQL with mysql2 |
| **Authentication** | JWT + OAuth 2.0 |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Email** | Nodemailer |
| **File Upload** | Formidable |

**Core Dependencies:**
- `mysql2` - MySQL database driver
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemailer` - Email notifications
- `dotenv` - Environment configuration
- `formidable` - File upload handling

---

## 📋 Prerequisites

Before installing DailyCup v2, ensure you have:

1. **Node.js** (v14 or higher)
   ```bash
   node --version
   ```

2. **MySQL** (via Laragon or standalone)
   - Laragon recommended for Windows users
   - MySQL 5.7 or 8.0

3. **Web Browser** (Modern browser with ES6 support)

4. **Text Editor/IDE** (VS Code recommended)

---

## 🚀 Installation Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/RidhoHuman/dailycup-v2.git
cd dailycup-v2
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Database Setup

1. **Start MySQL** (via Laragon or standalone)

2. **Import Database**:
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create new database or use SQL import
   - Import file: `database/dailycup2_db.sql`

   Or via command line:
   ```bash
   mysql -u root -p < database/dailycup2_db.sql
   ```

3. **Verify Database**:
   - Database name: `dailycup2_db`
   - Should contain 20 tables
   - Sample data should be loaded

### Step 4: Environment Configuration

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your settings:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=dailycup2_db
   JWT_SECRET=dailycup_jwt_secret_key_2024
   FRONTEND_URL=http://localhost:5500
   ```

3. **Configure OAuth** (Optional - See [PANDUAN_OAUTH.md](docs/PANDUAN_OAUTH.md)):
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   ```

4. **Configure Email** (Optional):
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

### Step 5: Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Database connected successfully
📁 Upload directories ready
🚀 Server is running on port 3000
```

### Step 6: Open Frontend

**Option A: Using Live Server (Recommended)**
1. Install "Live Server" extension in VS Code
2. Right-click `frontend/index.html`
3. Select "Open with Live Server"
4. Browser opens at `http://localhost:5500`

**Option B: Direct File Access**
1. Open `frontend/index.html` in browser
2. Update `FRONTEND_URL` in `.env` accordingly

---

## ⚙️ Configuration

### Database Connection
Edit `backend/config/database.js` if you need custom MySQL configuration.

### Upload Directories
Files are uploaded to `backend/uploads/` with subdirectories:
- `products/` - Product images
- `reviews/` - Review images
- `returns/` - Return proof images
- `payment_proofs/` - Payment screenshots

### JWT Token
Token expiration is set to 7 days by default. Change in `.env`:
```env
JWT_EXPIRES_IN=7d
```

---

## 💻 Usage

### For Customers:

1. **Register/Login**: 
   - Navigate to Login/Register page
   - Use email or OAuth (Google/Facebook)

2. **Browse Menu**:
   - View all products
   - Filter by category
   - Search by name

3. **Order**:
   - Add products to cart
   - Select size and temperature
   - Choose delivery method
   - Select payment method
   - Upload payment proof

4. **Track Order**:
   - View order status in real-time
   - Receive notifications

5. **Leave Review**:
   - Rate completed orders
   - Upload photos

### For Admin:

1. **Login** with admin credentials

2. **Dashboard**: View statistics and charts

3. **Manage Products**: Add, edit, delete products

4. **Process Orders**: Update order status

5. **Handle Returns**: Approve or reject returns

6. **Review Management**: Reply to customer reviews

---

## 🔑 Default Credentials

### Super Admin
- **Email**: `admin@dailycup.com`
- **Password**: `admin123`

### Staff
- **Email**: `staff@dailycup.com`
- **Password**: `staff123`

### Customer (Sample)
- **Email**: `customer@example.com`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change these passwords in production!

---

## 📁 Project Structure

```
dailycup-v2/
├── backend/
│   ├── server.js              # Main HTTP server
│   ├── config/
│   │   ├── database.js        # MySQL connection
│   │   ├── constants.js       # App constants
│   │   └── oauth.js           # OAuth config
│   ├── routes/
│   │   ├── index.js           # Main router
│   │   ├── auth.js            # Authentication
│   │   ├── products.js        # Products
│   │   ├── cart.js            # Shopping cart
│   │   ├── orders.js          # Orders
│   │   ├── reviews.js         # Reviews
│   │   ├── returns.js         # Returns
│   │   └── admin.js           # Admin panel
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   ├── returnController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── cors.js            # CORS handler
│   │   └── upload.js          # File upload
│   ├── utils/
│   │   ├── helpers.js         # Helper functions
│   │   ├── email.js           # Email sender
│   │   ├── jwt.js             # JWT utilities
│   │   └── response.js        # Response formatter
│   └── package.json
├── frontend/
│   ├── index.html             # Landing page
│   ├── pages/
│   │   ├── auth/              # Login, Register
│   │   ├── customer/          # Customer pages
│   │   └── admin/             # Admin panel
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   ├── components.css     # Components
│   │   └── responsive.css     # Responsive
│   ├── js/
│   │   ├── api.js             # API handler
│   │   ├── auth.js            # Authentication
│   │   └── utils.js           # Utilities
│   └── assets/
│       └── images/
├── database/
│   └── dailycup2_db.sql       # Database schema
├── docs/
│   ├── API_DOCUMENTATION.md   # API docs
│   └── PANDUAN_OAUTH.md       # OAuth guide
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

---

## 📚 API Documentation

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete API reference.

### Quick API Overview:

**Base URL**: `http://localhost:3000/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login user |
| `/products` | GET | Get all products |
| `/products/:id` | GET | Get product details |
| `/cart` | GET/POST | Manage cart |
| `/orders` | GET/POST | Manage orders |
| `/reviews` | POST | Create review |
| `/returns` | POST | Create return |
| `/admin/dashboard` | GET | Admin dashboard |

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)
- ✅ CORS configuration
- ✅ File upload validation
- ✅ Role-based access control

---

## 📧 Email Notifications

Email notifications are sent for:
- Order completion
- Order status updates

Configure email in `.env` file to enable notifications.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@dailycup.com

---

## 🙏 Acknowledgments

- Coffee lovers worldwide ☕
- Node.js community
- MySQL contributors
- All open-source libraries used

---

<div align="center">
  <p>Made with ☕ and ❤️ by DailyCup Team</p>
  <p><strong>Happy Coding!</strong></p>
</div>
