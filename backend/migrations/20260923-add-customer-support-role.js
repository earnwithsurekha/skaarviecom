module.exports = {
  up: async (sequelize) => {
    const [roleChecks] = await sequelize.query(`
      SELECT tc.CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS AS tc
      JOIN information_schema.CHECK_CONSTRAINTS AS cc
        ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
        AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
        AND tc.TABLE_NAME = 'users'
        AND tc.CONSTRAINT_TYPE = 'CHECK'
        AND cc.CHECK_CLAUSE LIKE '%role%'
    `);

    for (const { CONSTRAINT_NAME: constraintName } of roleChecks) {
      const escapedConstraintName = constraintName.replaceAll('`', '``');
      await sequelize.query(`ALTER TABLE users DROP CHECK \`${escapedConstraintName}\``);
    }

    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin', 'customer_support', 'manufacturer', 'reseller', 'customer')
      NOT NULL DEFAULT 'manufacturer'
    `);

    await sequelize.query(`
      ALTER TABLE chat_messages
      MODIFY COLUMN sender_role ENUM('admin', 'customer_support', 'manufacturer', 'reseller', 'customer') NOT NULL
    `);

    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'sender_email'
    `);

    if (columns.length === 0) {
      await sequelize.query(`
        ALTER TABLE chat_messages
        ADD COLUMN sender_email VARCHAR(255) NULL AFTER sender_role
      `);
      await sequelize.query(`
        UPDATE chat_messages AS message
        LEFT JOIN users AS sender ON sender.id = message.sender_id
        SET message.sender_email = COALESCE(sender.email, 'Unknown')
      `);
      await sequelize.query(`
        ALTER TABLE chat_messages
        MODIFY COLUMN sender_email VARCHAR(255) NOT NULL
      `);
    }
  },

  down: async (sequelize) => {
    await sequelize.query('ALTER TABLE chat_messages DROP COLUMN sender_email');
    await sequelize.query(`
      ALTER TABLE chat_messages
      MODIFY COLUMN sender_role ENUM('admin', 'manufacturer', 'reseller', 'customer') NOT NULL
    `);
    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin', 'manufacturer', 'reseller', 'customer')
      NOT NULL DEFAULT 'manufacturer'
    `);
  },
};