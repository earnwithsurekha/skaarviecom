const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Notification = require('../models/notification');
const { Op } = require('sequelize');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get(
  '/',
  authMiddleware,
  [
    query('type').optional().trim(),
    query('is_read').optional().isBoolean(),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        type,
        is_read,
        priority,
        page = 1,
        limit = 20,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { userId: req.user.id };

      // Apply filters
      if (type) {
        whereClause.type = type;
      }
      if (is_read !== undefined) {
        whereClause.isRead = is_read === 'true';
      }
      if (priority) {
        whereClause.priority = priority;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      const unreadCount = await notificationService.getUnreadCount(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve notifications',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/notifications/unread/count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
});

// @route   GET /api/notifications/types/low_stock
// @desc    Get low stock alert notifications
// @access  Private (Manufacturer)
router.get('/types/low_stock', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: 'low_stock_alert',
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.status(200).json({
      status: 'success',
      data: { notifications },
    });
  } catch (error) {
    console.error('Get low stock notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve low stock notifications',
      error: error.message,
    });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        status: 'success',
        message: 'Notification already marked as read',
      });
    }

    await notificationService.markAsRead([notification.id]);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
});

// @route   POST /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }

    await notificationService.deleteNotification(notification.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

module.exports = router;
