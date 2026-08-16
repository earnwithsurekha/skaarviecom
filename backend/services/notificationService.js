const Notification = require('../models/notification');
const { Product } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Check if product stock is at or below low stock threshold
   */
  async checkLowStock(productId) {
    try {
      const product = await Product.findByPk(productId);
      
      if (!product) {
        return { isLowStock: false, product: null };
      }

      const isLowStock = product.stockQuantity <= product.lowStockThreshold;
      
      return { isLowStock, product };
    } catch (error) {
      console.error('Check low stock error:', error);
      throw error;
    }
  }

  /**
   * Create low stock alert notification for manufacturer
   */
  async createLowStockAlert(userId, productData) {
    try {
      const { productId, productName, currentStock, threshold } = productData;

      // Check if a similar alert was created in the last 24 hours (avoid spam)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const existingAlert = await Notification.findOne({
        where: {
          userId,
          type: 'low_stock_alert',
          createdAt: { [Op.gte]: oneDayAgo },
          data: {
            productId,
          },
        },
      });

      if (existingAlert) {
        console.log(`Low stock alert already exists for product ${productId}`);
        return existingAlert;
      }

      // Create new notification
      const notification = await Notification.create({
        userId,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `Stock for "${productName}" is running low. Current stock: ${currentStock}, Threshold: ${threshold}`,
        data: {
          productId,
          productName,
          currentStock,
          threshold,
        },
        priority: currentStock === 0 ? 'urgent' : 'high',
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error('Create low stock alert error:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId, type = null) {
    try {
      const whereClause = {
        userId,
        isRead: false,
      };

      if (type) {
        whereClause.type = type;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });

      return notifications;
    } catch (error) {
      console.error('Get unread notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds) {
    try {
      await Notification.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            id: { [Op.in]: notificationIds },
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            userId,
            isRead: false,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      await Notification.destroy({
        where: { id: notificationId },
      });

      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Create a generic notification
   */
  async createNotification(notificationData) {
    try {
      const { userId, type, title, message, data, priority = 'normal' } = notificationData;

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Notify manufacturer about account approval
   */
  async notifyAccountApproved(userId, manufacturerData) {
    try {
      const { companyName, approvedBy } = manufacturerData;

      const notification = await this.createNotification({
        userId,
        type: 'account_approved',
        title: 'Account Approved!',
        message: `Congratulations! Your manufacturer account for "${companyName}" has been approved. You can now start adding products.`,
        data: { companyName, approvedBy },
        priority: 'high',
      });

      return notification;
    } catch (error) {
      console.error('Notify account approved error:', error);
      throw error;
    }
  }

  /**
   * Notify manufacturer about product status (approved/rejected)
   */
  async notifyProductStatus(userId, productData) {
    try {
      const { productId, productName, status, reason } = productData;

      let title, message, priority;

      if (status === 'approved') {
        title = 'Product Approved';
        message = `Your product "${productName}" has been approved and is now live on the marketplace.`;
        priority = 'normal';
      } else if (status === 'rejected') {
        title = 'Product Rejected';
        message = `Your product "${productName}" has been rejected. Reason: ${reason || 'Not specified'}`;
        priority = 'high';
      } else {
        return null;
      }

      const notification = await this.createNotification({
        userId,
        type: `product_${status}`,
        title,
        message,
        data: { productId, productName, status, reason },
        priority,
      });

      return notification;
    } catch (error) {
      console.error('Notify product status error:', error);
      throw error;
    }
  }

  /**
   * Notify manufacturer about new order
   */
  async notifyNewOrder(userId, orderData) {
    try {
      const { orderId, orderNumber, itemsCount, totalAmount } = orderData;

      const notification = await this.createNotification({
        userId,
        type: 'new_order',
        title: 'New Order Received',
        message: `You have a new order ${orderNumber} with ${itemsCount} item(s) worth ₹${totalAmount}`,
        data: { orderId, orderNumber, itemsCount, totalAmount },
        priority: 'high',
      });

      return notification;
    } catch (error) {
      console.error('Notify new order error:', error);
      throw error;
    }
  }

  /**
   * Notify manufacturer about order shipment
   */
  async notifyOrderShipped(userId, orderData) {
    try {
      const { orderId, orderNumber, trackingNumber, courierPartner } = orderData;

      const notification = await this.createNotification({
        userId,
        type: 'order_shipped',
        title: 'Order Shipped',
        message: `Order ${orderNumber} has been shipped. Tracking: ${trackingNumber || 'N/A'}`,
        data: { orderId, orderNumber, trackingNumber, courierPartner },
        priority: 'normal',
      });

      return notification;
    } catch (error) {
      console.error('Notify order shipped error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
