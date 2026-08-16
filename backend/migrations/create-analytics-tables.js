const { DataTypes } = require('sequelize');

/**
 * Migration: Create Analytics Tables
 * Creates tables for tracking product saves, shares, and clicks
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create product_saves table
    await queryInterface.createTable('product_saves', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Source where save was triggered (product_page, search_results, etc.)',
      },
      device_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Device type: mobile, tablet, desktop',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for product_saves
    await queryInterface.addIndex('product_saves', ['product_id'], {
      name: 'idx_product_saves_product_id',
    });
    await queryInterface.addIndex('product_saves', ['user_id'], {
      name: 'idx_product_saves_user_id',
    });
    await queryInterface.addIndex('product_saves', ['product_id', 'user_id'], {
      name: 'idx_product_saves_unique',
      unique: true,
    });
    await queryInterface.addIndex('product_saves', ['created_at'], {
      name: 'idx_product_saves_created_at',
    });

    // Create product_shares table
    await queryInterface.createTable('product_shares', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      platform: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Share platform: whatsapp, email, facebook, twitter, copy_link, qr_code',
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Source page where share was triggered',
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Session ID for anonymous tracking',
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP address for anonymous tracking',
      },
      device_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for product_shares
    await queryInterface.addIndex('product_shares', ['product_id'], {
      name: 'idx_product_shares_product_id',
    });
    await queryInterface.addIndex('product_shares', ['user_id'], {
      name: 'idx_product_shares_user_id',
    });
    await queryInterface.addIndex('product_shares', ['platform'], {
      name: 'idx_product_shares_platform',
    });
    await queryInterface.addIndex('product_shares', ['created_at'], {
      name: 'idx_product_shares_created_at',
    });

    // Create product_clicks table
    await queryInterface.createTable('product_clicks', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      referrer: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL of the referring page',
      },
      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Source of the click (search, category, featured, etc.)',
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Session ID for tracking',
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP address for tracking',
      },
      device_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Browser user agent string',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for product_clicks
    await queryInterface.addIndex('product_clicks', ['product_id'], {
      name: 'idx_product_clicks_product_id',
    });
    await queryInterface.addIndex('product_clicks', ['user_id'], {
      name: 'idx_product_clicks_user_id',
    });
    await queryInterface.addIndex('product_clicks', ['session_id'], {
      name: 'idx_product_clicks_session_id',
    });
    await queryInterface.addIndex('product_clicks', ['created_at'], {
      name: 'idx_product_clicks_created_at',
    });

    console.log('✓ Analytics tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_clicks');
    await queryInterface.dropTable('product_shares');
    await queryInterface.dropTable('product_saves');
    console.log('✓ Analytics tables dropped successfully');
  },
};
