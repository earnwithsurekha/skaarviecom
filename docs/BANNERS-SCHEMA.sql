-- Banners Table for Homepage, Promotional, Festival, and Featured Product Banners
CREATE TABLE IF NOT EXISTS banners (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  banner_type ENUM('homepage', 'promotional', 'festival', 'featured') NOT NULL,
  link_url VARCHAR(500),
  link_type ENUM('product', 'category', 'external', 'none') DEFAULT 'none',
  link_id CHAR(36), -- product_id or category_id if applicable
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATETIME,
  end_date DATETIME,
  display_order INT DEFAULT 0,
  click_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  target ENUM('_blank', '_self') DEFAULT '_self',
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_banner_type (banner_type),
  INDEX idx_is_active (is_active),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_display_order (display_order),
  INDEX idx_deleted_at (deleted_at),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banner Analytics Table (optional - for detailed tracking)
CREATE TABLE IF NOT EXISTS banner_analytics (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  banner_id CHAR(36) NOT NULL,
  event_type ENUM('view', 'click') NOT NULL,
  user_id CHAR(36),
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_banner_id (banner_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
