const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { v4: uuidv4 } = require('uuid');

// @route   GET /api/reseller/support/tickets
// @desc    Get all tickets for current reseller
// @access  Private (Reseller only)
router.get('/tickets', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const statusCondition = status ? `AND st.status = :status` : '';

    const tickets = await sequelize.query(`
      SELECT 
        st.id,
        st.ticket_number,
        st.subject,
        st.category,
        st.priority,
        st.status,
        st.description,
        st.created_at,
        st.updated_at,
        (SELECT COUNT(*) FROM support_ticket_replies WHERE ticket_id = st.id) as reply_count,
        (SELECT created_at FROM support_ticket_replies WHERE ticket_id = st.id ORDER BY created_at DESC LIMIT 1) as last_reply_at
      FROM support_tickets st
      WHERE st.user_id = :resellerId
      AND st.user_type = 'reseller'
      ${statusCondition}
      ORDER BY st.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { resellerId, status, limit: Number.parseInt(limit, 10), offset },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM support_tickets
      WHERE user_id = :resellerId
      AND user_type = 'reseller'
      ${statusCondition}
    `, {
      replacements: { resellerId, status },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        tickets,
        pagination: {
          page: Number.parseInt(page, 10),
          limit: Number.parseInt(limit, 10),
          total: countResult?.total || 0,
          total_pages: Math.ceil((countResult?.total || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// @route   POST /api/reseller/support/tickets
// @desc    Create a new support ticket
// @access  Private (Reseller only)
router.post('/tickets', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { subject, category, priority, description } = req.body;

    // Validation
    if (!subject || !category || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Subject, category, and description are required'
      });
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const ticketId = uuidv4();
    await sequelize.query(`
      INSERT INTO support_tickets 
      (id, ticket_number, user_id, user_type, subject, category, priority, status, description, created_at, updated_at)
      VALUES 
      (:id, :ticketNumber, :userId, 'reseller', :subject, :category, :priority, 'open', :description, NOW(), NOW())
    `, {
      replacements: {
        id: ticketId,
        ticketNumber,
        userId: resellerId,
        subject,
        category,
        priority: priority || 'medium',
        description
      }
    });

    // Fetch the created ticket
    const [ticket] = await sequelize.query(`
      SELECT * FROM support_tickets WHERE id = :ticketId
    `, {
      replacements: { ticketId },
      type: sequelize.QueryTypes.SELECT
    });

    res.status(201).json({
      status: 'success',
      message: 'Support ticket created successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/support/tickets/:id
// @desc    Get single ticket with replies
// @access  Private (Reseller only)
router.get('/tickets/:id', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;

    // Get ticket
    const [ticket] = await sequelize.query(`
      SELECT * FROM support_tickets
      WHERE id = :id AND user_id = :resellerId AND user_type = 'reseller'
    `, {
      replacements: { id, resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    // Get replies
    const replies = await sequelize.query(`
      SELECT 
        str.*,
        CASE 
          WHEN str.replied_by_type = 'admin' THEN a.name
          WHEN str.replied_by_type = 'reseller' THEN r.full_name
          ELSE 'Unknown'
        END as replier_name
      FROM support_ticket_replies str
      LEFT JOIN admins a ON str.replied_by_id = a.id AND str.replied_by_type = 'admin'
      LEFT JOIN resellers r ON str.replied_by_id = r.id AND str.replied_by_type = 'reseller'
      WHERE str.ticket_id = :id
      ORDER BY str.created_at ASC
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        ticket,
        replies
      }
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ticket details',
      error: error.message
    });
  }
});

// @route   POST /api/reseller/support/tickets/:id/reply
// @desc    Add reply to ticket
// @access  Private (Reseller only)
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Reply message is required'
      });
    }

    // Verify ticket ownership
    const [ticket] = await sequelize.query(`
      SELECT id FROM support_tickets
      WHERE id = :id AND user_id = :resellerId AND user_type = 'reseller'
    `, {
      replacements: { id, resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    // Add reply
    const replyId = uuidv4();
    await sequelize.query(`
      INSERT INTO support_ticket_replies 
      (id, ticket_id, message, replied_by_id, replied_by_type, created_at)
      VALUES 
      (:id, :ticketId, :message, :resellerId, 'reseller', NOW())
    `, {
      replacements: {
        id: replyId,
        ticketId: id,
        message,
        resellerId
      }
    });

    // Update ticket updated_at
    await sequelize.query(`
      UPDATE support_tickets 
      SET updated_at = NOW(),
          status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END
      WHERE id = :id
    `, {
      replacements: { id }
    });

    res.json({
      status: 'success',
      message: 'Reply added successfully'
    });

  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add reply',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/support/faqs
// @desc    Get FAQs
// @access  Private (Reseller only)
router.get('/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    const categoryCondition = category ? `AND category = :category` : '';

    const faqs = await sequelize.query(`
      SELECT 
        id, 
        question, 
        answer, 
        category,
        sort_order
      FROM faqs
      WHERE is_active = 1
      AND target_audience IN ('all', 'reseller')
      ${categoryCondition}
      ORDER BY sort_order ASC, created_at DESC
    `, {
      replacements: { category },
      type: sequelize.QueryTypes.SELECT
    });

    // Group by category
    const groupedFaqs = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        faqs,
        grouped_faqs: groupedFaqs
      }
    });

  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/support/stats
// @desc    Get support statistics
// @access  Private (Reseller only)
router.get('/stats', async (req, res) => {
  try {
    const resellerId = req.user.id;

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
      FROM support_tickets
      WHERE user_id = :resellerId
      AND user_type = 'reseller'
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: stats || {
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        resolved_tickets: 0,
        closed_tickets: 0
      }
    });

  } catch (error) {
    console.error('Get support stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch support statistics',
      error: error.message
    });
  }
});

module.exports = router;
