const { Op } = require('sequelize');
const { verifyToken } = require('../utils/jwt');
const { ChatConversation, ChatMessage } = require('../models/chat');

const serializeMessage = (message) => message.toJSON();

const getConversationSummaries = async () => {
  const conversations = await ChatConversation.findAll({
    order: [['lastMessageAt', 'DESC']],
  });

  return Promise.all(conversations.map(async (conversation) => {
    const [lastMessage, unreadCount] = await Promise.all([
      ChatMessage.findOne({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
      }),
      ChatMessage.count({
        where: {
          conversationId: conversation.id,
          senderRole: { [Op.notIn]: ['admin', 'customer_support'] },
          readAt: null,
        },
      }),
    ]);

    return {
      ...conversation.toJSON(),
      lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
      unreadCount,
    };
  }));
};

const getMessages = async (conversationId) => ChatMessage.findAll({
  where: { conversationId },
  order: [['createdAt', 'ASC']],
  limit: 200,
});

const initializeChatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      socket.user = verifyToken(token);
      return next();
    } catch (error) {
      return next(new Error('Invalid or expired token', { cause: error }));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id || socket.user.userId;
    const isAdmin = socket.user.role === 'admin';
    const isSupportAgent = socket.user.role === 'customer_support';
    const isChatAgent = isAdmin || isSupportAgent;

    try {
      if (isChatAgent) {
        socket.join('chat:agents');
        socket.emit('chat:conversations', await getConversationSummaries());
      } else {
        socket.join(`chat:user:${userId}`);
        const conversation = await ChatConversation.findOne({
          where: { userId, status: 'open' },
          order: [['createdAt', 'DESC']],
        });
        socket.emit('chat:history', {
          conversation: conversation?.toJSON() || null,
          messages: conversation ? (await getMessages(conversation.id)).map(serializeMessage) : [],
        });
      }
    } catch (error) {
      console.error('Chat history load error:', error);
      socket.emit('chat:error', { message: 'Unable to load chat history' });
    }

    socket.on('chat:select', async ({ conversationId } = {}) => {
      if (!isChatAgent || !conversationId) return;

      try {
        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return socket.emit('chat:error', { message: 'Conversation not found' });

        if (socket.data.selectedConversationId) {
          socket.leave(`chat:conversation:${socket.data.selectedConversationId}`);
        }
        socket.data.selectedConversationId = conversationId;
        socket.join(`chat:conversation:${conversationId}`);
        socket.emit('chat:history', {
          conversation: conversation.toJSON(),
          messages: (await getMessages(conversationId)).map(serializeMessage),
        });
      } catch (error) {
        console.error('Chat conversation load error:', error);
        socket.emit('chat:error', { message: 'Unable to load conversation' });
      }
    });

    socket.on('chat:send', async ({ conversationId, body } = {}, acknowledge = () => {}) => {
      const messageBody = typeof body === 'string' ? body.trim() : '';
      if (!messageBody || messageBody.length > 4000) {
        return acknowledge({ ok: false, message: 'Message must be between 1 and 4000 characters' });
      }

      try {
        let conversation;
        if (isChatAgent) {
          conversation = conversationId
            ? await ChatConversation.findByPk(conversationId)
            : null;
          if (!conversation) return acknowledge({ ok: false, message: 'Conversation not found' });
        } else {
          conversation = await ChatConversation.findOne({
            where: { userId, status: 'open' },
            order: [['createdAt', 'DESC']],
          });
          if (!conversation) {
            conversation = await ChatConversation.create({
              userId,
              userEmail: socket.user.email,
              userRole: socket.user.role,
            });
          }
        }

        const message = await ChatMessage.create({
          conversationId: conversation.id,
          senderId: userId,
          senderRole: socket.user.role,
          senderEmail: socket.user.email,
          body: messageBody,
        });
        await conversation.update({ lastMessageAt: new Date(), status: 'open' });

        const payload = serializeMessage(message);
        io.to(`chat:user:${conversation.userId}`).emit('chat:message', payload);
        io.to(`chat:conversation:${conversation.id}`).emit('chat:message', payload);
        io.to('chat:agents').emit('chat:conversations', await getConversationSummaries());
        return acknowledge({ ok: true, conversation: conversation.toJSON(), message: payload });
      } catch (error) {
        console.error('Chat send error:', error);
        return acknowledge({ ok: false, message: 'Unable to send message' });
      }
    });

    socket.on('chat:mark-read', async ({ conversationId } = {}) => {
      if (!conversationId) return;

      const conversation = await ChatConversation.findByPk(conversationId);
      if (!conversation || (!isChatAgent && conversation.userId !== userId)) return;

      const senderCondition = isChatAgent
        ? { [Op.notIn]: ['admin', 'customer_support'] }
        : { [Op.in]: ['admin', 'customer_support'] };
      await ChatMessage.update(
        { readAt: new Date() },
        { where: { conversationId, senderRole: senderCondition, readAt: null } }
      );
      if (isChatAgent) io.to('chat:agents').emit('chat:conversations', await getConversationSummaries());
    });
  });
};

module.exports = { initializeChatSocket };