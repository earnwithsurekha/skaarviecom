const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get authentication helper
const getAuthenticatedUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const { verifyToken } = require('../../utils/jwt');
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// @route   GET /api/customer/profile
// @desc    Get customer profile
// @access  Private (Customer)
router.get('/profile', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Get user details
    const [userDetails] = await sequelize.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.address,
        u.city,
        u.state,
        u.pincode,
        u.created_at,
        c.total_orders,
        c.total_spent
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = ? AND u.role = 'customer'`,
      {
        replacements: [user.id],
        type: QueryTypes.SELECT
      }
    );

    if (!userDetails) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.json({
      status: 'success',
      data: {
        user: userDetails,
      }
    });

  } catch (error) {
    console.error('[Customer Profile] Error fetching profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @route   PUT /api/customer/profile
// @desc    Update customer profile
// @access  Private (Customer)
router.put('/profile', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const {
      name,
      email,
      mobile,
      address,
      city,
      state,
      pincode,
    } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !mobile?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and mobile are required',
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
    }

    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid mobile number. Must be 10 digits',
      });
    }

    // Check if email or mobile already exists for another user
    const [existingUser] = await sequelize.query(
      `SELECT id FROM users WHERE (email = ? OR mobile = ?) AND id != ?`,
      {
        replacements: [email, mobile, user.id],
        type: QueryTypes.SELECT
      }
    );

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or mobile number already in use',
      });
    }

    // Update user details
    await sequelize.query(
      `UPDATE users 
       SET full_name = ?,
           email = ?,
           mobile = ?,
           address = ?,
           city = ?,
           state = ?,
           pincode = ?,
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [name, email, mobile, address || null, city || null, state || null, pincode || null, user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Also update customer record if exists
    await sequelize.query(
      `UPDATE customers 
       SET full_name = ?,
           address = ?,
           city = ?,
           state = ?,
           pincode = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      {
        replacements: [name, address || null, city || null, state || null, pincode || null, user.id],
        type: QueryTypes.UPDATE
      }
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        name,
        email,
        mobile,
        address,
        city,
        state,
        pincode,
      }
    });

  } catch (error) {
    console.error('[Customer Profile] Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   POST /api/customer/change-password
// @desc    Change customer password
// @access  Private (Customer)
router.post('/change-password', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters',
      });
    }

    // Get current password hash
    const [userRecord] = await sequelize.query(
      `SELECT password FROM users WHERE id = ?`,
      {
        replacements: [user.id],
        type: QueryTypes.SELECT
      }
    );

    if (!userRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await sequelize.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      {
        replacements: [hashedPassword, user.id],
        type: QueryTypes.UPDATE
      }
    );

    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('[Customer Profile] Error changing password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
      error: error.message
    });
  }
});

module.exports = router;
