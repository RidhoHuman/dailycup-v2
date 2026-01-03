-- DailyCup v2 Database Schema
-- Coffee Shop CRM System
-- Database: dailycup2_db

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database
CREATE DATABASE IF NOT EXISTS `dailycup2_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dailycup2_db`;

-- ================================================================
-- Table: users (Customer & Admin with OAuth support)
-- ================================================================
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `role` ENUM('customer', 'staff', 'admin', 'super_admin') DEFAULT 'customer',
  `oauth_provider` ENUM('manual', 'google', 'facebook') DEFAULT 'manual',
  `oauth_id` VARCHAR(255) DEFAULT NULL,
  `profile_picture` VARCHAR(255) DEFAULT NULL,
  `loyalty_points` INT(11) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_oauth` (`oauth_provider`, `oauth_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: categories
-- ================================================================
CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: products
-- ================================================================
CREATE TABLE `products` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category_id` INT(11) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `images_gallery` TEXT DEFAULT NULL COMMENT 'JSON array of additional images',
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_available` TINYINT(1) DEFAULT 1,
  `stock_quantity` INT(11) DEFAULT NULL COMMENT 'NULL for unlimited',
  `average_rating` DECIMAL(3,2) DEFAULT 0.00,
  `total_reviews` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_featured` (`is_featured`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: product_variants (Size & Temperature)
-- ================================================================
CREATE TABLE `product_variants` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) NOT NULL,
  `variant_type` ENUM('size', 'temperature') NOT NULL,
  `variant_value` VARCHAR(50) NOT NULL COMMENT 'small/medium/large or hot/iced',
  `price_adjustment` DECIMAL(10,2) DEFAULT 0.00,
  `is_available` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: carts
-- ================================================================
CREATE TABLE `carts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `size_variant` VARCHAR(50) DEFAULT NULL,
  `temperature_variant` VARCHAR(50) DEFAULT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_product` (`product_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: orders
-- ================================================================
CREATE TABLE `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `delivery_method` ENUM('dine_in', 'takeaway', 'delivery') NOT NULL,
  `delivery_address` TEXT DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `points_used` INT(11) DEFAULT 0,
  `points_discount` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL,
  `payment_method_id` INT(11) DEFAULT NULL,
  `payment_proof` VARCHAR(255) DEFAULT NULL,
  `payment_status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  `status` ENUM('pending', 'confirmed', 'processing', 'ready', 'delivering', 'completed', 'cancelled') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_method` (`payment_method_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: order_items
-- ================================================================
CREATE TABLE `order_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `size_variant` VARCHAR(50) DEFAULT NULL,
  `temperature_variant` VARCHAR(50) DEFAULT NULL,
  `quantity` INT(11) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_product` (`product_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: order_tracking
-- ================================================================
CREATE TABLE `order_tracking` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'processing', 'ready', 'delivering', 'completed', 'cancelled') NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_created_by` (`created_by`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: payment_methods
-- ================================================================
CREATE TABLE `payment_methods` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('bank_transfer', 'qris', 'ewallet') NOT NULL,
  `provider` VARCHAR(100) DEFAULT NULL COMMENT 'BCA, Mandiri, BNI, GoPay, OVO, Dana, ShopeePay',
  `account_name` VARCHAR(255) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `qr_code_image` VARCHAR(255) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: reviews
-- ================================================================
CREATE TABLE `reviews` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `order_id` INT(11) DEFAULT NULL,
  `rating` INT(1) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` TEXT DEFAULT NULL,
  `images` TEXT DEFAULT NULL COMMENT 'JSON array of image paths',
  `admin_reply` TEXT DEFAULT NULL,
  `replied_at` TIMESTAMP NULL DEFAULT NULL,
  `is_visible` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_order` (`order_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: favorites
-- ================================================================
CREATE TABLE `favorites` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_favorite` (`user_id`, `product_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_product` (`product_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: returns
-- ================================================================
CREATE TABLE `returns` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `return_number` VARCHAR(50) NOT NULL UNIQUE,
  `reason` ENUM('wrong_order', 'damaged', 'quality_issue', 'missing_items', 'other') NOT NULL,
  `description` TEXT NOT NULL,
  `images` TEXT DEFAULT NULL COMMENT 'JSON array of proof images',
  `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  `admin_notes` TEXT DEFAULT NULL,
  `processed_by` INT(11) DEFAULT NULL,
  `processed_at` TIMESTAMP NULL DEFAULT NULL,
  `refund_amount` DECIMAL(10,2) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_return_number` (`return_number`),
  KEY `idx_status` (`status`),
  KEY `idx_processed_by` (`processed_by`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: return_items
-- ================================================================
CREATE TABLE `return_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `return_id` INT(11) NOT NULL,
  `order_item_id` INT(11) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT(11) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_return` (`return_id`),
  KEY `idx_order_item` (`order_item_id`),
  FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: partner_companies
-- ================================================================
CREATE TABLE `partner_companies` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `logo` VARCHAR(255) DEFAULT NULL,
  `banner_image` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: discounts
-- ================================================================
CREATE TABLE `discounts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `partner_company_id` INT(11) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase` DECIMAL(10,2) DEFAULT 0.00,
  `max_discount` DECIMAL(10,2) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `terms_conditions` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_partner` (`partner_company_id`),
  KEY `idx_dates` (`start_date`, `end_date`),
  FOREIGN KEY (`partner_company_id`) REFERENCES `partner_companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: redeem_codes
-- ================================================================
CREATE TABLE `redeem_codes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase` DECIMAL(10,2) DEFAULT 0.00,
  `max_discount` DECIMAL(10,2) DEFAULT NULL,
  `usage_limit` INT(11) DEFAULT NULL COMMENT 'NULL for unlimited',
  `used_count` INT(11) DEFAULT 0,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`),
  KEY `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: redeem_code_usage
-- ================================================================
CREATE TABLE `redeem_code_usage` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `redeem_code_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `order_id` INT(11) NOT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL,
  `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`redeem_code_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_order` (`order_id`),
  FOREIGN KEY (`redeem_code_id`) REFERENCES `redeem_codes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: loyalty_settings
-- ================================================================
CREATE TABLE `loyalty_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `points_per_rupiah` DECIMAL(10,4) NOT NULL DEFAULT 0.0100 COMMENT 'Points earned per Rp spent',
  `rupiah_per_point` DECIMAL(10,2) NOT NULL DEFAULT 100.00 COMMENT 'Rupiah value per point',
  `min_points_redeem` INT(11) DEFAULT 100 COMMENT 'Minimum points to redeem',
  `max_points_per_order` INT(11) DEFAULT NULL COMMENT 'Maximum points usable per order',
  `is_active` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: loyalty_transactions
-- ================================================================
CREATE TABLE `loyalty_transactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `order_id` INT(11) DEFAULT NULL,
  `transaction_type` ENUM('earn', 'redeem', 'admin_adjustment') NOT NULL,
  `points` INT(11) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `balance_before` INT(11) NOT NULL,
  `balance_after` INT(11) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_order` (`order_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table: notifications
-- ================================================================
CREATE TABLE `notifications` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `type` ENUM('order_status', 'payment', 'review', 'return', 'loyalty', 'promotion', 'system') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- INSERT SAMPLE DATA
-- ================================================================

-- Insert default admin users
INSERT INTO `users` (`name`, `email`, `password`, `role`, `oauth_provider`, `is_active`) VALUES
('Super Admin', 'admin@dailycup.com', '$2b$10$rQ8qLxKJ5QJZJZ5ZJ5ZJ5uGJZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5Z', 'super_admin', 'manual', 1),
('Staff Member', 'staff@dailycup.com', '$2b$10$rQ8qLxKJ5QJZJZ5ZJ5ZJ5uGJZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5Z', 'staff', 'manual', 1),
('John Customer', 'customer@example.com', '$2b$10$rQ8qLxKJ5QJZJZ5ZJ5ZJ5uGJZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5ZJ5Z', 'customer', 'manual', 1);

-- Insert categories
INSERT INTO `categories` (`name`, `slug`, `description`, `is_active`, `display_order`) VALUES
('Coffee', 'coffee', 'Our signature coffee beverages', 1, 1),
('Tea', 'tea', 'Fresh brewed tea selections', 1, 2),
('Food', 'food', 'Delicious food to accompany your drinks', 1, 3),
('Pastries', 'pastries', 'Freshly baked pastries', 1, 4),
('Snacks', 'snacks', 'Quick bites and snacks', 1, 5);

-- Insert sample products
INSERT INTO `products` (`category_id`, `name`, `slug`, `description`, `base_price`, `is_featured`, `is_available`) VALUES
(1, 'Espresso', 'espresso', 'Rich and bold espresso shot', 25000, 1, 1),
(1, 'Americano', 'americano', 'Espresso with hot water', 30000, 1, 1),
(1, 'Cappuccino', 'cappuccino', 'Espresso with steamed milk and foam', 35000, 1, 1),
(1, 'Latte', 'latte', 'Smooth espresso with steamed milk', 35000, 1, 1),
(1, 'Mocha', 'mocha', 'Chocolate-flavored latte', 40000, 0, 1),
(1, 'Caramel Macchiato', 'caramel-macchiato', 'Latte with caramel drizzle', 42000, 1, 1),
(2, 'Green Tea Latte', 'green-tea-latte', 'Creamy matcha latte', 38000, 1, 1),
(2, 'Thai Tea', 'thai-tea', 'Sweet and creamy Thai tea', 32000, 0, 1),
(3, 'Chicken Sandwich', 'chicken-sandwich', 'Grilled chicken with fresh vegetables', 45000, 0, 1),
(3, 'Club Sandwich', 'club-sandwich', 'Triple-decker sandwich with turkey and bacon', 50000, 0, 1),
(4, 'Croissant', 'croissant', 'Buttery flaky croissant', 25000, 0, 1),
(4, 'Chocolate Muffin', 'chocolate-muffin', 'Rich chocolate muffin', 22000, 0, 1),
(5, 'French Fries', 'french-fries', 'Crispy golden fries', 20000, 0, 1);

-- Insert product variants for coffee products
INSERT INTO `product_variants` (`product_id`, `variant_type`, `variant_value`, `price_adjustment`) VALUES
-- Espresso sizes
(1, 'size', 'single', 0),
(1, 'size', 'double', 5000),
-- Americano sizes and temperatures
(2, 'size', 'small', 0),
(2, 'size', 'medium', 3000),
(2, 'size', 'large', 5000),
(2, 'temperature', 'hot', 0),
(2, 'temperature', 'iced', 3000),
-- Cappuccino sizes and temperatures
(3, 'size', 'small', 0),
(3, 'size', 'medium', 3000),
(3, 'size', 'large', 5000),
(3, 'temperature', 'hot', 0),
(3, 'temperature', 'iced', 3000),
-- Latte sizes and temperatures
(4, 'size', 'small', 0),
(4, 'size', 'medium', 3000),
(4, 'size', 'large', 5000),
(4, 'temperature', 'hot', 0),
(4, 'temperature', 'iced', 3000),
-- Mocha sizes and temperatures
(5, 'size', 'small', 0),
(5, 'size', 'medium', 3000),
(5, 'size', 'large', 5000),
(5, 'temperature', 'hot', 0),
(5, 'temperature', 'iced', 3000),
-- Caramel Macchiato sizes and temperatures
(6, 'size', 'small', 0),
(6, 'size', 'medium', 3000),
(6, 'size', 'large', 5000),
(6, 'temperature', 'hot', 0),
(6, 'temperature', 'iced', 3000),
-- Green Tea Latte sizes and temperatures
(7, 'size', 'small', 0),
(7, 'size', 'medium', 3000),
(7, 'size', 'large', 5000),
(7, 'temperature', 'hot', 0),
(7, 'temperature', 'iced', 3000),
-- Thai Tea sizes and temperature
(8, 'size', 'small', 0),
(8, 'size', 'medium', 3000),
(8, 'size', 'large', 5000),
(8, 'temperature', 'iced', 0);

-- Insert payment methods
INSERT INTO `payment_methods` (`name`, `type`, `provider`, `account_name`, `account_number`, `instructions`, `is_active`, `display_order`) VALUES
('BCA Transfer', 'bank_transfer', 'BCA', 'PT DailyCup Indonesia', '1234567890', 'Transfer ke rekening BCA dan upload bukti transfer', 1, 1),
('Mandiri Transfer', 'bank_transfer', 'Mandiri', 'PT DailyCup Indonesia', '9876543210', 'Transfer ke rekening Mandiri dan upload bukti transfer', 1, 2),
('BNI Transfer', 'bank_transfer', 'BNI', 'PT DailyCup Indonesia', '5555666677', 'Transfer ke rekening BNI dan upload bukti transfer', 1, 3),
('QRIS', 'qris', 'QRIS', NULL, NULL, 'Scan QR Code untuk melakukan pembayaran', 1, 4),
('GoPay', 'ewallet', 'GoPay', NULL, '081234567890', 'Transfer ke nomor GoPay dan upload bukti transfer', 1, 5),
('OVO', 'ewallet', 'OVO', NULL, '081234567890', 'Transfer ke nomor OVO dan upload bukti transfer', 1, 6),
('Dana', 'ewallet', 'Dana', NULL, '081234567890', 'Transfer ke nomor Dana dan upload bukti transfer', 1, 7),
('ShopeePay', 'ewallet', 'ShopeePay', NULL, '081234567890', 'Transfer ke nomor ShopeePay dan upload bukti transfer', 1, 8);

-- Insert partner companies
INSERT INTO `partner_companies` (`name`, `description`, `is_active`) VALUES
('Tech Corp', 'Leading technology company with employee benefits', 1),
('Bank Mega', 'Special discounts for Bank Mega cardholders', 1),
('University XYZ', 'Student and staff discount program', 1);

-- Insert sample discounts
INSERT INTO `discounts` (`partner_company_id`, `title`, `description`, `discount_type`, `discount_value`, `min_purchase`, `start_date`, `end_date`, `is_active`) VALUES
(1, 'Tech Corp Employee Discount', 'Get 15% off for Tech Corp employees', 'percentage', 15, 50000, '2024-01-01', '2024-12-31', 1),
(2, 'Bank Mega Cardholder', '20% discount for Bank Mega credit card users', 'percentage', 20, 100000, '2024-01-01', '2024-12-31', 1),
(3, 'Student Discount', '10% off for university students', 'percentage', 10, 30000, '2024-01-01', '2024-12-31', 1);

-- Insert sample redeem codes
INSERT INTO `redeem_codes` (`code`, `discount_type`, `discount_value`, `min_purchase`, `usage_limit`, `start_date`, `end_date`, `is_active`, `description`) VALUES
('WELCOME10', 'percentage', 10, 0, NULL, '2024-01-01', '2024-12-31', 1, 'Welcome discount for new customers'),
('COFFEE50K', 'fixed', 50000, 200000, 100, '2024-01-01', '2024-12-31', 1, 'Rp 50,000 off for orders above Rp 200,000'),
('FREESHIP', 'percentage', 100, 100000, 50, '2024-01-01', '2024-12-31', 1, 'Free delivery for orders above Rp 100,000');

-- Insert loyalty settings
INSERT INTO `loyalty_settings` (`points_per_rupiah`, `rupiah_per_point`, `min_points_redeem`, `max_points_per_order`, `is_active`) VALUES
(0.0100, 100.00, 100, 1000, 1);

COMMIT;
