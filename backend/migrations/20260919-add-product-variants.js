module.exports = {
  up: async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const orderItemColumns = await queryInterface.describeTable('order_items');
    const productImageColumns = await queryInterface.describeTable('product_images');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id CHAR(36) NOT NULL,
        product_id CHAR(36) NOT NULL,
        variant_key VARCHAR(150) NOT NULL,
        size_label VARCHAR(50) NULL,
        color_name VARCHAR(50) NULL,
        color_hex CHAR(7) NULL,
        stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
        sort_order INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY product_variants_product_key_unique (product_id, variant_key),
        KEY product_variants_product_id_index (product_id),
        CONSTRAINT product_variants_product_id_fk
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    if (!orderItemColumns.selected_size) {
      await sequelize.query(`
        ALTER TABLE order_items
        ADD COLUMN selected_size VARCHAR(50) NULL AFTER quantity
      `);
    }

    if (!orderItemColumns.selected_color) {
      await sequelize.query(`
        ALTER TABLE order_items
        ADD COLUMN selected_color VARCHAR(50) NULL AFTER selected_size
      `);
    }

    if (!productImageColumns.variant_key) {
      await sequelize.query(`
        ALTER TABLE product_images
        ADD COLUMN variant_key VARCHAR(150) NULL AFTER product_id
      `);
    }

    if (!productImageColumns.variant_keys) {
      await sequelize.query(`
        ALTER TABLE product_images
        ADD COLUMN variant_keys JSON NULL AFTER variant_key
      `);
      await sequelize.query(`
        UPDATE product_images
        SET variant_keys = JSON_ARRAY(variant_key)
        WHERE variant_key IS NOT NULL
      `);
    }

    if (!productImageColumns.size_label) {
      await sequelize.query(`
        ALTER TABLE product_images
        ADD COLUMN size_label VARCHAR(50) NULL AFTER variant_key
      `);
    }

    if (!productImageColumns.color_name) {
      await sequelize.query(`
        ALTER TABLE product_images
        ADD COLUMN color_name VARCHAR(50) NULL AFTER size_label
      `);
    }
  },

  down: async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const orderItemColumns = await queryInterface.describeTable('order_items');
    const productImageColumns = await queryInterface.describeTable('product_images');

    if (productImageColumns.color_name) {
      await sequelize.query('ALTER TABLE product_images DROP COLUMN color_name');
    }
    if (productImageColumns.size_label) {
      await sequelize.query('ALTER TABLE product_images DROP COLUMN size_label');
    }
    if (productImageColumns.variant_key) {
      await sequelize.query('ALTER TABLE product_images DROP COLUMN variant_key');
    }
    if (productImageColumns.variant_keys) {
      await sequelize.query('ALTER TABLE product_images DROP COLUMN variant_keys');
    }

    await sequelize.query('DROP TABLE IF EXISTS product_variants');

    if (orderItemColumns.selected_color) {
      await sequelize.query('ALTER TABLE order_items DROP COLUMN selected_color');
    }
    if (orderItemColumns.selected_size) {
      await sequelize.query('ALTER TABLE order_items DROP COLUMN selected_size');
    }
  },
};