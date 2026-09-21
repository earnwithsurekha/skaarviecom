module.exports = {
  up: async (sequelize) => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        token VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        platform ENUM('android', 'ios', 'web') NOT NULL,
        device_id VARCHAR(255) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY device_tokens_token_unique (token),
        KEY device_tokens_user_active_index (user_id, is_active),
        CONSTRAINT device_tokens_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  down: async (sequelize) => {
    await sequelize.query('DROP TABLE IF EXISTS device_tokens');
  },
};