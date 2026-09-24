const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/resellers
// @desc    Get all resellers
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const {
      status = 'all',
      type = 'all',
      sortBy = 'registrationDate',
      page = 1,
      limit = 20,
      search = ''
    } = req.query;
    const parsedPage = Number.parseInt(page, 10) || 1;
    const parsedLimit = Number.parseInt(limit, 10) || 20;
    const offset = (parsedPage - 1) * parsedLimit;

    let statusFilter = '';
    let typeFilter = '';
    let searchFilter = '';
    const replacements = { limit: parsedLimit, offset };

    const statusFilters = {
      active: "AND u.is_active = 1 AND u.status = 'approved'",
      suspended: 'AND u.is_active = 0',
      inactive: "AND u.is_active = 1 AND (u.status IS NULL OR u.status <> 'approved')",
    };
    statusFilter = statusFilters[status] || '';

    if (type !== 'all') {
      typeFilter = 'AND r.reseller_type = :type';
      replacements.type = type;
    }

    if (search) {
      searchFilter = `AND (
        r.full_name LIKE :search
        OR r.reseller_code LIKE :search
        OR u.email LIKE :search
        OR u.mobile LIKE :search
      )`;
      replacements.search = `%${search}%`;
    }

    const sortOptions = {
      registrationDate: 'r.created_at DESC',
      name: 'r.full_name ASC',
      earnings: 'r.total_earnings DESC',
    };
    const orderBy = sortOptions[sortBy] || sortOptions.registrationDate;

    const resellers = await sequelize.query(`
      SELECT 
        r.id,
        r.user_id as userId,
        r.full_name as fullName,
        r.reseller_code as resellerCode,
        u.email,
        u.mobile as phoneNumber,
        r.reseller_type as resellerType,
        r.total_earnings as totalEarnings,
        r.pending_earnings as pendingEarnings,
        r.withdrawn_amount as withdrawnAmount,
        r.total_sales as totalOrders,
        CASE
          WHEN u.is_active = 0 THEN 'suspended'
          WHEN u.status = 'approved' THEN 'active'
          ELSE 'inactive'
        END as status,
        CASE
          WHEN u.is_active = 0 THEN 'suspended'
          WHEN u.status = 'approved' THEN 'active'
          ELSE 'inactive'
        END as accountStatus,
        u.status as approvalStatus,
        r.created_at as createdAt,
        (SELECT COUNT(*) FROM resellers r2 WHERE r2.sponsor_id = r.id) as referralCount
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 
        ${statusFilter} 
        ${typeFilter}
        ${searchFilter}
      ORDER BY ${orderBy}
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(DISTINCT r.id) as total
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 
        ${statusFilter} 
        ${typeFilter}
        ${searchFilter}
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        resellers,
        pagination: {
          total: Number.parseInt(totalResult[0]?.total || 0, 10),
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil((totalResult[0]?.total || 0) / parsedLimit),
        },
      },
    });
  } catch (error) {
    console.error('Resellers fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch resellers',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/resellers/:id
// @desc    Get reseller details
// @access  Private (Admin)
router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const resellerResult = await sequelize.query(`
      SELECT 
        r.id,
        r.user_id as userId,
        r.full_name as fullName,
        u.email,
        u.mobile as phoneNumber,
        r.reseller_type as resellerType,
        r.reseller_code as resellerCode,
        COALESCE(NULLIF(r.city, 'N/A'), u.city) as city,
        COALESCE(NULLIF(r.state, 'N/A'), u.state) as state,
        COALESCE(NULLIF(r.pincode, '000000'), u.pincode) as pincode,
        r.bank_account_number as bankAccountNumber,
        r.bank_ifsc_code as bankIfscCode,
        r.bank_account_holder as bankAccountHolder,
        r.upi_id as upiId,
        r.profile_photo_url as profilePhotoUrl,
        r.total_earnings as totalEarnings,
        r.pending_earnings as pendingEarnings,
        r.withdrawn_amount as withdrawnAmount,
        r.total_sales as totalOrders,
        u.is_active as accountStatus,
        u.status as approvalStatus,
        r.created_at as createdAt,
        (SELECT COUNT(*) FROM resellers r2 WHERE r2.sponsor_id = r.id) as referralCount,
        sponsor.full_name as sponsorName
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN resellers sponsor ON r.sponsor_id = sponsor.id
      WHERE r.id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    const reseller = resellerResult[0];

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found',
      });
    }

    res.json({
      status: 'success',
      data: reseller,
    });
  } catch (error) {
    console.error('Reseller details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reseller details',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/resellers/:id/suspend
// @desc    Suspend a reseller
// @access  Private (Admin)
router.put('/:id/suspend', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get user_id from reseller id
    const resellerResult = await sequelize.query(`
      SELECT user_id FROM resellers WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found',
      });
    }

    const userId = resellerResult[0].user_id;

    await sequelize.query(`
      UPDATE users 
      SET is_active = 0,
          updated_at = NOW()
      WHERE id = :userId
    `, {
      replacements: { userId },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Reseller suspended successfully',
    });
  } catch (error) {
    console.error('Reseller suspension error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend reseller',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/resellers/:id/activate
// @desc    Activate a reseller
// @access  Private (Admin)
router.put('/:id/activate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id from reseller id
    const resellerResult = await sequelize.query(`
      SELECT user_id FROM resellers WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found',
      });
    }

    const userId = resellerResult[0].user_id;

    await sequelize.query(`
      UPDATE users 
      SET is_active = 1,
          updated_at = NOW()
      WHERE id = :userId
    `, {
      replacements: { userId },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Reseller activated successfully',
    });
  } catch (error) {
    console.error('Reseller activation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate reseller',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/resellers/:id/referrals
// @desc    Get reseller's referral tree
// @access  Private (Admin)
router.get('/:id/referrals', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const referrals = await sequelize.query(`
      SELECT 
        r.id,
        r.user_id as userId,
        r.full_name as fullName,
        u.email,
        u.mobile as phoneNumber,
        r.created_at as createdAt,
        r.total_sales as totalSales,
        r.total_earnings as totalEarnings
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.sponsor_id = :id
      ORDER BY r.created_at DESC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: referrals,
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referrals',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/resellers/:id/approve
// @desc    Approve a reseller
// @access  Private (Admin)
router.put('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id from reseller id
    const resellerResult = await sequelize.query(`
      SELECT user_id FROM resellers WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found',
      });
    }

    const userId = resellerResult[0].user_id;

    await sequelize.query(`
      UPDATE users 
      SET is_active = 1,
          status = 'approved',
          updated_at = NOW()
      WHERE id = :userId
    `, {
      replacements: { userId },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Reseller approved successfully',
    });
  } catch (error) {
    console.error('Reseller approval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve reseller',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/resellers/:id
// @desc    Update reseller details
// @access  Private (Admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, mobile, resellerType, address, city, state, pincode } = req.body;

    // Get user_id from reseller id
    const resellerResult = await sequelize.query(`
      SELECT user_id FROM resellers WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found',
      });
    }

    const userId = resellerResult[0].user_id;

    // Update user table
    if (email || mobile) {
      const userUpdates = [];
      const userReplacements = { id: userId };
      
      if (email) {
        userUpdates.push('email = :email');
        userReplacements.email = email;
      }
      if (mobile) {
        userUpdates.push('mobile = :mobile');
        userReplacements.mobile = mobile;
      }
      
      if (userUpdates.length > 0) {
        await sequelize.query(`
          UPDATE users 
          SET ${userUpdates.join(', ')},
              updated_at = NOW()
          WHERE id = :id
        `, {
          replacements: userReplacements,
          type: QueryTypes.UPDATE
        });
      }
    }

    // Update reseller table
    const resellerUpdates = [];
    const resellerReplacements = { resellerId: id };
    
    if (fullName) {
      resellerUpdates.push('full_name = :fullName');
      resellerReplacements.fullName = fullName;
    }
    if (resellerType) {
      resellerUpdates.push('reseller_type = :resellerType');
      resellerReplacements.resellerType = resellerType;
    }
    if (city) {
      resellerUpdates.push('city = :city');
      resellerReplacements.city = city;
    }
    if (state) {
      resellerUpdates.push('state = :state');
      resellerReplacements.state = state;
    }
    if (pincode) {
      resellerUpdates.push('pincode = :pincode');
      resellerReplacements.pincode = pincode;
    }
    
    if (resellerUpdates.length > 0) {
      await sequelize.query(`
        UPDATE resellers 
        SET ${resellerUpdates.join(', ')},
            updated_at = NOW()
        WHERE id = :resellerId
      `, {
        replacements: resellerReplacements,
        type: QueryTypes.UPDATE
      });
    }

    res.json({
      status: 'success',
      message: 'Reseller details updated successfully',
    });
  } catch (error) {
    console.error('Reseller update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reseller details',
      error: error.message,
    });
  }
});

module.exports = router;
