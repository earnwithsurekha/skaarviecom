const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatConversation = sequelize.define('ChatConversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_email',
  },
  userRole: {
    type: DataTypes.ENUM('manufacturer', 'reseller', 'customer'),
    allowNull: false,
    field: 'user_role',
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_message_at',
  },
}, {
  tableName: 'chat_conversations',
  timestamps: true,
  underscored: true,
});

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
  },
  senderRole: {
    type: DataTypes.ENUM('admin', 'customer_support', 'manufacturer', 'reseller', 'customer'),
    allowNull: false,
    field: 'sender_role',
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sender_email',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

ChatConversation.hasMany(ChatMessage, {
  foreignKey: 'conversation_id',
  as: 'messages',
  onDelete: 'CASCADE',
});
ChatMessage.belongsTo(ChatConversation, {
  foreignKey: 'conversation_id',
  as: 'conversation',
});

module.exports = { ChatConversation, ChatMessage };