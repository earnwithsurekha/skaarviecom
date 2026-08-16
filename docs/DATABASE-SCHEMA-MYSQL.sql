-- ============================================================================
-- SKAARVI RESELL MARKETPLACE - MySQL Database Schema
-- ============================================================================
-- Version: 1.0
-- Database: MySQL 8.0+
-- Created: June 13, 2026
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS skaarvi_resell_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE skaarvi_resell_db;

-- Set MySQL settings
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================================================
-- 1. USER MANAGEMENT TABLES
-- ============================================================================

-- 1.1 Users Table (Main user authentication)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manufacturer', 'reseller', 'customer')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_users_mobile (mobile),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Manufacturers Table
CREATE TABLE manufacturers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    gst_number VARCHAR(15) UNIQUE NOT NULL,
    pan_number VARCHAR(10),
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_account_holder VARCHAR(255),
    bank_name VARCHAR(255),
    upi_id VARCHAR(100),
    company_logo_url TEXT,
    gst_certificate_url TEXT,
    pan_card_url TEXT,
    cancelled_cheque_url TEXT,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_manufacturers_user (user_id),
    INDEX idx_manufacturers_status (approval_status),
    INDEX idx_manufacturers_gst (gst_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Resellers Table
CREATE TABLE resellers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    reseller_code VARCHAR(20) UNIQUE NOT NULL,
    reseller_type VARCHAR(50) DEFAULT 'free' CHECK (reseller_type IN ('free', 'verified', 'premium')),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_account_holder VARCHAR(255),
    upi_id VARCHAR(100),
    profile_photo_url TEXT,
    sponsor_id CHAR(36),
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    pending_earnings DECIMAL(12, 2) DEFAULT 0.00,
    withdrawn_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_sales INT DEFAULT 0,
    commission_rate DECIMAL(5, 2),
    is_featured BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sponsor_id) REFERENCES resellers(id),
    INDEX idx_resellers_user (user_id),
    INDEX idx_resellers_code (reseller_code),
    INDEX idx_resellers_type (reseller_type),
    INDEX idx_resellers_sponsor (sponsor_id),
    INDEX idx_resellers_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Customers Table
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    referred_by_reseller CHAR(36),
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_by_reseller) REFERENCES resellers(id),
    INDEX idx_customers_user (user_id),
    INDEX idx_customers_referrer (referred_by_reseller)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. AUTHENTICATION & SECURITY TABLES
-- ============================================================================

-- 2.1 OTP Storage Table
CREATE TABLE otp_verifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    mobile VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'login' CHECK (purpose IN ('login', 'registration', 'password_reset')),
    is_verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_mobile (mobile),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token TEXT NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_active (is_revoked, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 Token Blacklist Table (for logout)
CREATE TABLE token_blacklist (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_blacklist_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PRODUCT MANAGEMENT TABLES
-- ============================================================================

-- 3.1 Categories Table
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id CHAR(36),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    commission_override DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Products Table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    manufacturer_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    brand_name VARCHAR(200),
    description TEXT,
    specifications JSON,
    sku VARCHAR(100) UNIQUE,
    cost_price DECIMAL(12, 2) NOT NULL,
    reseller_margin DECIMAL(12, 2) NOT NULL DEFAULT 0,
    skaarvi_margin DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2),
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    weight DECIMAL(8, 2) COMMENT 'Weight in kg',
    dimensions JSON COMMENT 'JSON: {length, width, height} in cm',
    delivery_days INT,
    shipping_charges DECIMAL(10, 2),
    shipping_info TEXT,
    catalog_url TEXT,
    tags JSON,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'inactive')),
    rejection_reason TEXT,
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_products_manufacturer (manufacturer_id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_status (status),
    INDEX idx_products_sku (sku),
    INDEX idx_products_slug (slug),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_price (selling_price),
    INDEX idx_products_stock (stock_quantity),
    FULLTEXT INDEX idx_products_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 Product Images Table
CREATE TABLE product_images (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id),
    INDEX idx_product_images_primary (product_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 Product Videos Table
CREATE TABLE product_videos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INT,
    file_size INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_videos_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5 Product Pricing History Table
CREATE TABLE product_pricing_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL,
    reseller_margin DECIMAL(12, 2) NOT NULL,
    skaarvi_margin DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    changed_by CHAR(36),
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_pricing_history_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.6 Stock Logs Table (Inventory Management)
CREATE TABLE stock_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    manufacturer_id CHAR(36) NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'update', 'order_placed', 'order_cancelled', 'adjustment')),
    quantity_change INT NOT NULL COMMENT 'Positive for increase, negative for decrease',
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    changed_by CHAR(36),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stock_logs_product (product_id),
    INDEX idx_stock_logs_manufacturer (manufacturer_id),
    INDEX idx_stock_logs_date (changed_at DESC),
    INDEX idx_stock_logs_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ORDER MANAGEMENT TABLES
-- ============================================================================

-- 4.1 Orders Table
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id CHAR(36) NOT NULL,
    reseller_id CHAR(36),
    total_amount DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('razorpay', 'cod', 'upi', 'wallet')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id VARCHAR(255),
    order_status VARCHAR(50) DEFAULT 'new' CHECK (order_status IN ('new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    shipping_address JSON NOT NULL,
    billing_address JSON,
    tracking_number VARCHAR(255),
    courier_partner VARCHAR(100),
    notes TEXT,
    cancelled_reason TEXT,
    refund_amount DECIMAL(12, 2),
    refund_status VARCHAR(50),
    commission_paid BOOLEAN DEFAULT FALSE,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (reseller_id) REFERENCES resellers(id),
    INDEX idx_orders_order_number (order_number),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_reseller (reseller_id),
    INDEX idx_orders_status (order_status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_date (ordered_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 Order Items Table
CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    manufacturer_id CHAR(36) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL CHECK (quantity > 0),
    cost_price DECIMAL(12, 2) NOT NULL,
    reseller_margin DECIMAL(12, 2) NOT NULL,
    skaarvi_margin DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    item_total DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) NOT NULL,
    manufacturer_amount DECIMAL(12, 2) NOT NULL,
    reseller_commission DECIMAL(12, 2) NOT NULL,
    skaarvi_revenue DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id),
    INDEX idx_order_items_manufacturer (manufacturer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3 Order Status History Table
CREATE TABLE order_status_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_order_status_history_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. FINANCIAL MANAGEMENT TABLES
-- ============================================================================

-- 5.1 Wallets Table
CREATE TABLE wallets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reseller_id CHAR(36) UNIQUE NOT NULL,
    current_balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (current_balance >= 0),
    pending_balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (pending_balance >= 0),
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00,
    last_transaction_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE,
    INDEX idx_wallets_reseller (reseller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 Wallet Transactions Table
CREATE TABLE wallet_transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    wallet_id CHAR(36) NOT NULL,
    reseller_id CHAR(36) NOT NULL,
    order_id CHAR(36),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'bonus', 'penalty')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_wallet_transactions_wallet (wallet_id),
    INDEX idx_wallet_transactions_reseller (reseller_id),
    INDEX idx_wallet_transactions_order (order_id),
    INDEX idx_wallet_transactions_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3 Withdrawal Requests Table
CREATE TABLE withdrawal_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reseller_id CHAR(36) NOT NULL,
    wallet_id CHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 500),
    bank_account_number VARCHAR(50) NOT NULL,
    bank_ifsc_code VARCHAR(20) NOT NULL,
    bank_account_holder VARCHAR(255) NOT NULL,
    upi_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
    rejection_reason TEXT,
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_withdrawal_requests_reseller (reseller_id),
    INDEX idx_withdrawal_requests_status (status),
    INDEX idx_withdrawal_requests_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.4 Commission Logs Table
CREATE TABLE commission_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL,
    reseller_id CHAR(36) NOT NULL,
    manufacturer_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    order_amount DECIMAL(12, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'reversed')),
    credited_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reseller_id) REFERENCES resellers(id),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_commission_logs_order (order_id),
    INDEX idx_commission_logs_reseller (reseller_id),
    INDEX idx_commission_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. REFERRAL & TRACKING TABLES
-- ============================================================================

-- 6.1 Referral Clicks Table
CREATE TABLE referral_clicks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reseller_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer_url TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    session_id VARCHAR(255),
    converted BOOLEAN DEFAULT FALSE,
    order_id CHAR(36),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_referral_clicks_reseller (reseller_id),
    INDEX idx_referral_clicks_product (product_id),
    INDEX idx_referral_clicks_session (session_id),
    INDEX idx_referral_clicks_date (clicked_at DESC),
    INDEX idx_referral_clicks_converted (converted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.2 Product Views Table
CREATE TABLE product_views (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    ip_address VARCHAR(45),
    session_id VARCHAR(255),
    referrer_url TEXT,
    device_type VARCHAR(50),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_product_views_product (product_id),
    INDEX idx_product_views_user (user_id),
    INDEX idx_product_views_date (viewed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.3 Analytics Events Table
CREATE TABLE analytics_events (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    user_id CHAR(36),
    session_id VARCHAR(255),
    event_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_analytics_events_type (event_type),
    INDEX idx_analytics_events_user (user_id),
    INDEX idx_analytics_events_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. NOTIFICATION & COMMUNICATION TABLES
-- ============================================================================

-- 7.1 Notifications Table
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_unread (user_id, is_read),
    INDEX idx_notifications_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.2 Email Logs Table
CREATE TABLE email_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_email_logs_user (user_id),
    INDEX idx_email_logs_status (status),
    INDEX idx_email_logs_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.3 SMS Logs Table
CREATE TABLE sms_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    mobile VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    purpose VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_sms_logs_mobile (mobile),
    INDEX idx_sms_logs_status (status),
    INDEX idx_sms_logs_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. SYSTEM CONFIGURATION TABLES
-- ============================================================================

-- 8.1 System Settings Table
CREATE TABLE system_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    INDEX idx_system_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.2 Platform Commission Rates Table
CREATE TABLE commission_rates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reseller_type VARCHAR(50) NOT NULL CHECK (reseller_type IN ('free', 'verified', 'premium')),
    commission_percentage DECIMAL(5, 2) NOT NULL,
    bonus_percentage DECIMAL(5, 2) DEFAULT 0.00,
    min_payout DECIMAL(10, 2) DEFAULT 500.00,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_commission_rates_type (reseller_type),
    INDEX idx_commission_rates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.3 Banners Table
CREATE TABLE banners (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'resellers', 'manufacturers', 'customers')),
    position VARCHAR(50) DEFAULT 'home_slider',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_banners_active (is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. AUDIT & LOGGING TABLES
-- ============================================================================

-- 9.1 Audit Logs Table
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9.2 Error Logs Table
CREATE TABLE error_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_payload JSON,
    severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_error_logs_type (error_type),
    INDEX idx_error_logs_severity (severity),
    INDEX idx_error_logs_date (created_at DESC),
    INDEX idx_error_logs_unresolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. TRIGGERS & AUTO-INCREMENT
-- ============================================================================

-- Reseller code auto-generation (handled by application)
-- Order number auto-generation (handled by application)

-- Trigger: Update product stock on order
DELIMITER //
CREATE TRIGGER update_stock_on_order 
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        sales_count = sales_count + NEW.quantity
    WHERE id = NEW.product_id;
END//
DELIMITER ;

-- Trigger: Create wallet on reseller registration
DELIMITER //
CREATE TRIGGER auto_create_wallet 
AFTER INSERT ON resellers
FOR EACH ROW
BEGIN
    INSERT INTO wallets (reseller_id) VALUES (NEW.id);
END//
DELIMITER ;

-- Trigger: Log order status changes
DELIMITER //
CREATE TRIGGER log_status_change 
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.order_status <> NEW.order_status THEN
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (NEW.id, NEW.order_status, CONCAT('Status changed from ', OLD.order_status, ' to ', NEW.order_status));
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- 11. INITIAL DATA SEEDING
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_fee_percentage', '5.00', 'number', 'Platform fee percentage charged to manufacturers', FALSE),
('minimum_withdrawal_amount', '500.00', 'number', 'Minimum amount for withdrawal request', TRUE),
('default_reseller_margin', '200.00', 'number', 'Default reseller margin in INR', FALSE),
('default_skaarvi_margin', '100.00', 'number', 'Default Skaarvi margin in INR', FALSE),
('low_stock_threshold', '10', 'number', 'Default low stock alert threshold', FALSE),
('otp_expiry_minutes', '5', 'number', 'OTP expiry time in minutes', FALSE),
('max_otp_attempts', '3', 'number', 'Maximum OTP attempts allowed', FALSE),
('referral_cookie_days', '30', 'number', 'Referral attribution cookie validity in days', FALSE);

-- Insert default commission rates
INSERT INTO commission_rates (reseller_type, commission_percentage, bonus_percentage, min_payout, is_active) VALUES
('free', 0.00, 0.00, 500.00, TRUE),
('verified', 5.00, 0.00, 500.00, TRUE),
('premium', 10.00, 2.00, 500.00, TRUE);

-- Insert default categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
('Electronics', 'electronics', 'Electronic items and gadgets', TRUE, 1),
('Fashion & Apparel', 'fashion-apparel', 'Clothing, footwear, and accessories', TRUE, 2),
('Home & Kitchen', 'home-kitchen', 'Home appliances and kitchenware', TRUE, 3),
('Beauty & Personal Care', 'beauty-personal-care', 'Cosmetics and personal care products', TRUE, 4),
('Sports & Fitness', 'sports-fitness', 'Sports equipment and fitness gear', TRUE, 5),
('Books & Stationery', 'books-stationery', 'Books, office supplies, and stationery', TRUE, 6),
('Toys & Games', 'toys-games', 'Toys, games, and hobby items', TRUE, 7),
('Health & Wellness', 'health-wellness', 'Health supplements and wellness products', TRUE, 8);

-- ============================================================================
-- 12. VIEWS FOR REPORTING
-- ============================================================================

-- View: Reseller Performance Summary
CREATE VIEW vw_reseller_performance AS
SELECT 
    r.id,
    r.reseller_code,
    r.full_name,
    r.reseller_type,
    r.total_sales,
    r.total_earnings,
    r.pending_earnings,
    r.withdrawn_amount,
    w.current_balance,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT rc.id) as total_clicks,
    CASE 
        WHEN COUNT(DISTINCT rc.id) > 0 
        THEN ROUND((COUNT(DISTINCT o.id) / COUNT(DISTINCT rc.id) * 100), 2)
        ELSE 0
    END as conversion_rate
FROM resellers r
LEFT JOIN wallets w ON r.id = w.reseller_id
LEFT JOIN orders o ON r.id = o.reseller_id AND o.order_status = 'delivered'
LEFT JOIN referral_clicks rc ON r.id = rc.reseller_id
GROUP BY r.id, r.reseller_code, r.full_name, r.reseller_type, r.total_sales, 
         r.total_earnings, r.pending_earnings, r.withdrawn_amount, w.current_balance;

-- View: Product Performance Summary
CREATE VIEW vw_product_performance AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.selling_price,
    p.stock_quantity,
    p.views_count,
    p.sales_count,
    p.status,
    c.name as category_name,
    m.company_name as manufacturer_name,
    COUNT(DISTINCT oi.order_id) as total_orders,
    COALESCE(SUM(oi.item_total), 0) as total_revenue,
    CASE 
        WHEN p.views_count > 0 
        THEN ROUND((p.sales_count / p.views_count * 100), 2)
        ELSE 0
    END as conversion_rate
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.sku, p.selling_price, p.stock_quantity, 
         p.views_count, p.sales_count, p.status, c.name, m.company_name;

-- View: Order Revenue Breakdown
CREATE VIEW vw_order_revenue_breakdown AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.ordered_at,
    o.order_status,
    o.final_amount,
    COALESCE(SUM(oi.manufacturer_amount), 0) as total_to_manufacturer,
    COALESCE(SUM(oi.reseller_commission), 0) as total_to_reseller,
    COALESCE(SUM(oi.skaarvi_revenue), 0) as total_to_skaarvi,
    COALESCE(SUM(oi.platform_fee), 0) as total_platform_fee,
    r.reseller_code,
    r.full_name as reseller_name,
    c.full_name as customer_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN resellers r ON o.reseller_id = r.id
LEFT JOIN customers c ON o.customer_id = c.id
GROUP BY o.id, o.order_number, o.ordered_at, o.order_status, o.final_amount,
         r.reseller_code, r.full_name, c.full_name;

-- ============================================================================
-- 13. STORED PROCEDURES FOR CLEANUP
-- ============================================================================

-- Procedure to clean expired OTPs
DELIMITER //
CREATE PROCEDURE cleanup_expired_otps()
BEGIN
    DELETE FROM otp_verifications 
    WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
END//
DELIMITER ;

-- Procedure to clean expired blacklisted tokens
DELIMITER //
CREATE PROCEDURE cleanup_expired_blacklist()
BEGIN
    DELETE FROM token_blacklist 
    WHERE expires_at < NOW();
END//
DELIMITER ;

-- Procedure to clean old analytics events (keep 90 days)
DELIMITER //
CREATE PROCEDURE cleanup_old_analytics()
BEGIN
    DELETE FROM analytics_events 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END//
DELIMITER ;

-- ============================================================================
-- 14. ENABLE FOREIGN KEY CHECKS
-- ============================================================================

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- END OF MySQL SCHEMA
-- ============================================================================

-- To run cleanup procedures, schedule them with MySQL Event Scheduler:
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT daily_cleanup ON SCHEDULE EVERY 1 DAY DO CALL cleanup_expired_otps();
