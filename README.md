# ☕ DailyCup v2 - Coffee Shop CRM System

<div align="center">
  <h3>Complete Customer Relationship Management System</h3>
  <p><strong>Node.js Native HTTP + MySQL + Vanilla JavaScript</strong></p>
  <p>
    <a href="docs/README.md">📖 Full Documentation</a> •
    <a href="docs/API_DOCUMENTATION.md">📘 API Docs</a> •
    <a href="docs/PANDUAN_OAUTH.md">🔐 OAuth Guide (ID)</a>
  </p>
</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MySQL (via Laragon or standalone)
- Modern web browser

### Installation

```bash
# 1. Clone repository
git clone https://github.com/RidhoHuman/dailycup-v2.git
cd dailycup-v2

# 2. Install dependencies
cd backend
npm install

# 3. Import database
# Import database/dailycup2_db.sql to MySQL via phpMyAdmin

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Start backend server
npm start

# 6. Open frontend
# Open frontend/index.html in browser
# or use VS Code Live Server extension
```

Server will run on **http://localhost:3000**  
Frontend on **http://localhost:5500** (if using Live Server)

---

## ✨ Features

### For Customers
- 🔐 Register/Login (JWT + OAuth)
- 🛍️ Browse menu, search, filter products
- 🛒 Shopping cart with variants
- 📦 Multiple delivery methods
- 💳 Multiple payment options
- 📍 Real-time order tracking
- ⭐ Reviews & ratings with photos
- 🎁 Loyalty points system
- 🎟️ Voucher/discount codes
- 🔄 Order returns with proof
- ❤️ Favorite products

### For Admin/Staff
- 📊 Dashboard with statistics
- 📦 Product management (CRUD)
- 🏷️ Category management
- 📋 Order management
- 👥 User management
- 💰 Returns processing
- 💬 Review management
- ⚙️ Settings (loyalty, payments)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js (Native HTTP) |
| Database | MySQL |
| Authentication | JWT + OAuth 2.0 |
| Frontend | HTML5, CSS3, Vanilla JS |
| Email | Nodemailer |
| File Upload | Formidable |

---

## 📁 Project Structure

```
dailycup-v2/
├── backend/           # Node.js backend
│   ├── server.js     # Main server
│   ├── config/       # Configuration
│   ├── routes/       # API routes
│   ├── controllers/  # Business logic
│   ├── middleware/   # Middleware
│   └── utils/        # Utilities
├── frontend/         # HTML/CSS/JS frontend
│   ├── pages/       # HTML pages
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript
│   └── assets/      # Images, icons
├── database/        # SQL schema
└── docs/           # Documentation
```

---

## 🔑 Default Credentials

**Super Admin:**
- Email: `admin@dailycup.com`
- Password: `admin123`

**Staff:**
- Email: `staff@dailycup.com`
- Password: `staff123`

⚠️ **Change passwords in production!**

---

## 📚 Documentation

- [📖 Complete Installation Guide](docs/README.md)
- [📘 API Reference](docs/API_DOCUMENTATION.md)
- [🔐 OAuth Setup Guide (Indonesian)](docs/PANDUAN_OAUTH.md)

---

## 🔐 Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CORS configuration
- ✅ File upload validation
- ✅ Role-based access control

---

## 🎨 Design

Coffee-themed color palette:
- Primary Dark: `#4a2c2a`
- Primary Brown: `#6b4423`
- Cream: `#f5e6d3`
- Beige: `#d4c4b0`

Fully responsive, mobile-first design.

---

## 📧 Support

- 📝 [Create an Issue](https://github.com/RidhoHuman/dailycup-v2/issues)
- 📧 Email: support@dailycup.com

---

## 📄 License

ISC License - See LICENSE file

---

<div align="center">
  <p>Made with ☕ and ❤️</p>
  <p><strong>Happy Coding!</strong></p>
</div>
