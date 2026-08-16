-- Create store_visits table for tracking reseller store visits
CREATE TABLE IF NOT EXISTS store_visits (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reseller_id CHAR(36) NOT NULL,
  visitor_ip VARCHAR(45) NULL,
  referrer VARCHAR(500) NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE,
  INDEX idx_reseller_visited (reseller_id, visited_at),
  INDEX idx_visitor_ip (visitor_ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
