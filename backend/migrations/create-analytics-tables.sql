-- Migration: Create Analytics Tables
-- Creates tables for tracking product saves, shares, and clicks

-- Create product_saves table
CREATE TABLE IF NOT EXISTS `product_saves` (
  `id` CHAR(36) PRIMARY KEY,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `source` VARCHAR(50) DEFAULT NULL COMMENT 'Source where save was triggered (product_page, search_results, etc.)',
  `device_type` VARCHAR(20) DEFAULT NULL COMMENT 'Device type: mobile, tablet, desktop',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `idx_product_saves_unique` (`product_id`, `user_id`),
  KEY `idx_product_saves_product_id` (`product_id`),
  KEY `idx_product_saves_user_id` (`user_id`),
  KEY `idx_product_saves_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_shares table
CREATE TABLE IF NOT EXISTS `product_shares` (
  `id` CHAR(36) PRIMARY KEY,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `platform` VARCHAR(50) NOT NULL COMMENT 'Share platform: whatsapp, email, facebook, twitter, copy_link, qr_code',
  `source` VARCHAR(50) DEFAULT NULL COMMENT 'Source page where share was triggered',
  `session_id` VARCHAR(255) DEFAULT NULL COMMENT 'Session ID for anonymous tracking',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address for anonymous tracking',
  `device_type` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  KEY `idx_product_shares_product_id` (`product_id`),
  KEY `idx_product_shares_user_id` (`user_id`),
  KEY `idx_product_shares_platform` (`platform`),
  KEY `idx_product_shares_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create product_clicks table
CREATE TABLE IF NOT EXISTS `product_clicks` (
  `id` CHAR(36) PRIMARY KEY,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `referrer` TEXT DEFAULT NULL COMMENT 'URL of the referring page',
  `source` VARCHAR(100) DEFAULT NULL COMMENT 'Source of the click (search, category, featured, etc.)',
  `session_id` VARCHAR(255) DEFAULT NULL COMMENT 'Session ID for tracking',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address for tracking',
  `device_type` VARCHAR(20) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL COMMENT 'Browser user agent string',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  KEY `idx_product_clicks_product_id` (`product_id`),
  KEY `idx_product_clicks_user_id` (`user_id`),
  KEY `idx_product_clicks_session_id` (`session_id`),
  KEY `idx_product_clicks_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification
SELECT 'Analytics tables created successfully!' AS status;
