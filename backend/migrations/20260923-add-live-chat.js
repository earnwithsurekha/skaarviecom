module.exports = {
  up: async (sequelize) => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_role ENUM('manufacturer', 'reseller', 'customer') NOT NULL,
        status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
        last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY chat_conversations_user_status_index (user_id, status),
        KEY chat_conversations_last_message_index (last_message_at),
        CONSTRAINT chat_conversations_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id CHAR(36) NOT NULL,
        conversation_id CHAR(36) NOT NULL,
        sender_id CHAR(36) NOT NULL,
        sender_role ENUM('admin', 'customer_support', 'manufacturer', 'reseller', 'customer') NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        read_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY chat_messages_conversation_created_index (conversation_id, created_at),
        CONSTRAINT chat_messages_conversation_id_fk
          FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        CONSTRAINT chat_messages_sender_id_fk
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  down: async (sequelize) => {
    await sequelize.query('DROP TABLE IF EXISTS chat_messages');
    await sequelize.query('DROP TABLE IF EXISTS chat_conversations');
  },
};