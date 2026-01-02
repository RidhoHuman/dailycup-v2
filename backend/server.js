require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const http = require('http');
const fs = require('fs');
const path = require('path');
const { testConnection } = require('./config/database');
const { PORT, UPLOAD_DIR } = require('./config/constants');
const corsMiddleware = require('./middleware/cors');
const { ensureUploadDirs } = require('./middleware/upload');
const router = require('./routes');

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Handle CORS
  const isOptions = corsMiddleware(req, res);
  if (isOptions) return;

  // Handle static file serving for uploads
  if (req.url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOAD_DIR, req.url.replace('/uploads/', ''));
    
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size
        });
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        return;
      }
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
  }

  // Route all API requests
  await router(req, res);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      console.error('Make sure MySQL is running and the database exists.');
      process.exit(1);
    }

    // Ensure upload directories exist
    await ensureUploadDirs();
    console.log('📁 Upload directories ready');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('   ☕ DailyCup v2 Backend Server');
      console.log('========================================');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log('========================================');
      console.log('');
      console.log('📝 Available API Endpoints:');
      console.log('   Authentication:');
      console.log('     POST   /api/auth/register');
      console.log('     POST   /api/auth/login');
      console.log('     GET    /api/auth/google');
      console.log('     GET    /api/auth/facebook');
      console.log('');
      console.log('   Products:');
      console.log('     GET    /api/products');
      console.log('     GET    /api/products/:id');
      console.log('     POST   /api/products (Admin)');
      console.log('     PUT    /api/products/:id (Admin)');
      console.log('     DELETE /api/products/:id (Admin)');
      console.log('');
      console.log('   Cart:');
      console.log('     GET    /api/cart');
      console.log('     POST   /api/cart');
      console.log('     PUT    /api/cart/:id');
      console.log('     DELETE /api/cart/:id');
      console.log('');
      console.log('   Orders:');
      console.log('     GET    /api/orders');
      console.log('     GET    /api/orders/:id');
      console.log('     POST   /api/orders');
      console.log('     PUT    /api/orders/:id/status (Staff)');
      console.log('     POST   /api/orders/:id/payment');
      console.log('');
      console.log('   Reviews:');
      console.log('     GET    /api/reviews/product/:id');
      console.log('     POST   /api/reviews');
      console.log('     PUT    /api/reviews/:id/reply (Admin)');
      console.log('');
      console.log('   Returns:');
      console.log('     GET    /api/returns');
      console.log('     GET    /api/returns/:id');
      console.log('     POST   /api/returns');
      console.log('     PUT    /api/returns/:id/process (Staff)');
      console.log('');
      console.log('   Admin:');
      console.log('     GET    /api/admin/dashboard');
      console.log('     GET    /api/admin/orders');
      console.log('     GET    /api/admin/users');
      console.log('     GET    /api/admin/categories');
      console.log('     GET    /api/admin/returns');
      console.log('     GET    /api/admin/payment-methods');
      console.log('     GET    /api/admin/loyalty-settings');
      console.log('     And more...');
      console.log('');
      console.log('========================================');
      console.log('Press Ctrl+C to stop the server');
      console.log('========================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Start the server
startServer();
