-- Migration: Add Support Tickets and FAQs Tables
-- Date: 2026-06-21

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `ticket_number` VARCHAR(50) UNIQUE NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `user_type` ENUM('reseller', 'customer', 'manufacturer') NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `category` ENUM('general', 'technical', 'billing', 'products', 'account', 'other') DEFAULT 'general',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`, `user_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket Replies Table
CREATE TABLE IF NOT EXISTS `support_ticket_replies` (
  `id` VARCHAR(36) PRIMARY KEY,
  `ticket_id` VARCHAR(36) NOT NULL,
  `message` TEXT NOT NULL,
  `replied_by_id` VARCHAR(36) NOT NULL,
  `replied_by_type` ENUM('admin', 'reseller', 'customer', 'manufacturer') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticket` (`ticket_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQs Table
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'general',
  `target_audience` ENUM('all', 'reseller', 'customer', 'manufacturer') DEFAULT 'all',
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_target_audience` (`target_audience`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample FAQs for Resellers
INSERT INTO `faqs` (`id`, `question`, `answer`, `category`, `target_audience`, `display_order`) VALUES
(UUID(), 'How do I generate a referral link for a product?', 'To generate a referral link:\n1. Go to Products section\n2. Click on any product\n3. Click the "Generate Referral Link" button\n4. Your unique referral link will be created with your reseller code\n5. Copy and share the link with your customers', 'products', 'reseller', 1),

(UUID(), 'When will I receive my commission?', 'Commissions are credited to your wallet immediately when an order is confirmed. However, they remain in "Pending" status until the order is delivered. Once delivered, the earnings move to "Available Balance" and can be withdrawn.', 'earnings', 'reseller', 2),

(UUID(), 'What is the minimum withdrawal amount?', 'The minimum withdrawal amount is ₹500. You can request a withdrawal once your Available Balance reaches this threshold.', 'withdrawals', 'reseller', 3),

(UUID(), 'How long does it take to process withdrawal requests?', 'Withdrawal requests are typically processed within 3-5 business days. Once approved, the amount will be transferred to your registered bank account or UPI within 24-48 hours.', 'withdrawals', 'reseller', 4),

(UUID(), 'Can I track clicks on my referral links?', 'Yes! Go to Analytics or Link Tracking section to see detailed statistics including:\n- Total clicks on your links\n- Orders generated\n- Conversion rates\n- Product-wise performance', 'analytics', 'reseller', 5),

(UUID(), 'How does the referral program work?', 'When you refer someone to become a reseller using your referral code:\n1. They register with your code\n2. They become part of your network (Level 1)\n3. You earn a percentage of their commission\n4. The system is ready for multi-level expansion in the future', 'referrals', 'reseller', 6),

(UUID(), 'Can I customize my store page?', 'Yes! Visit "My Store" section to:\n- Update your store name\n- Add a store description\n- Upload a profile photo\n- View your store analytics\n\nYour unique store URL: resell.skaarvi.com/store/[your-username]', 'store', 'reseller', 7),

(UUID(), 'What marketing materials can I download?', 'Visit the Media Center to download:\n- Product images (individual or bulk)\n- Product videos\n- Product catalog PDFs\n- Marketing creatives\n\nAll materials are optimized for easy sharing on social media and messaging apps.', 'marketing', 'reseller', 8),

(UUID(), 'How do I contact customer support?', 'You can reach us through:\n- Support Tickets: Raise a ticket from Support Center\n- Email: reseller@skaarvi.com\n- Phone: 1800-XXX-XXXX (Mon-Sat, 9 AM - 6 PM)\n- WhatsApp: Quick chat support during business hours', 'support', 'reseller', 9),

(UUID(), 'Can I save products for quick access?', 'Yes! Click the bookmark icon on any product card to save it. Access all saved products from the "Saved Products" section for quick sharing and promotion.', 'products', 'reseller', 10);

-- Add comments to tables
ALTER TABLE `support_tickets` COMMENT = 'Stores support tickets raised by users';
ALTER TABLE `support_ticket_replies` COMMENT = 'Stores replies/conversation on support tickets';
ALTER TABLE `faqs` COMMENT = 'Frequently Asked Questions for different user types';
