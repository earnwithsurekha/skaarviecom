'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, WifiOff, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { createChatSocket } from '@/lib/chatSocket';

const isAgentRole = (role) => role === 'admin' || role === 'customer_support';

const LiveSupportChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && conversation?.id) {
      socketRef.current?.emit('chat:mark-read', { conversationId: conversation.id });
      setUnreadCount(0);
    }
  }, [conversation?.id, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated || !user || isAgentRole(user.role)) return undefined;

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError('');
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (connectionError) => {
      setIsConnected(false);
      setError(connectionError.message || 'Unable to connect to support');
    });
    socket.on('chat:error', ({ message }) => setError(message));
    socket.on('chat:history', ({ conversation: activeConversation, messages: history }) => {
      setConversation(activeConversation);
      setMessages(history);
      if (isOpenRef.current && activeConversation?.id) {
        socket.emit('chat:mark-read', { conversationId: activeConversation.id });
      } else {
        setUnreadCount(history.filter((message) => isAgentRole(message.senderRole) && !message.readAt).length);
      }
    });
    socket.on('chat:message', (message) => {
      setMessages((current) => (
        current.some((item) => item.id === message.id) ? current : [...current, message]
      ));
      if (isAgentRole(message.senderRole)) {
        if (isOpenRef.current) {
          socket.emit('chat:mark-read', { conversationId: message.conversationId });
        } else {
          setUnreadCount((count) => count + 1);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || isAgentRole(user.role)) return null;

  const sendMessage = (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !socketRef.current) return;

    setDraft('');
    socketRef.current.emit('chat:send', { body }, (result) => {
      if (!result?.ok) {
        setDraft(body);
        setError(result?.message || 'Unable to send message');
        return;
      }
      setConversation(result.conversation);
      setError('');
    });
  };

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 lg:bottom-6 lg:right-6">
      {isOpen && (
        <section
          className="mb-3 flex h-[min(32rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl"
          style={{ backgroundColor: 'rgb(var(--color-background))', borderColor: 'rgb(var(--color-border))' }}
          aria-label="Live support chat"
        >
          <header className="flex h-16 shrink-0 items-center justify-between bg-blue-600 px-4 text-white">
            <div>
              <h2 className="font-semibold">Skaarvi Support</h2>
              <p className="flex items-center gap-1 text-xs text-blue-100">
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-red-300'}`} />
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="flex h-10 w-10 items-center justify-center" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
            {messages.length === 0 && (
              <div className="mx-auto max-w-64 py-12 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                <p className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>How can we help?</p>
                <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Send a message and our support team will reply here.
                </p>
              </div>
            )}
            {messages.map((message) => {
              const isOwnMessage = !isAgentRole(message.senderRole);
              return (
                <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${isOwnMessage ? 'bg-blue-600 text-white' : ''}`}
                    style={isOwnMessage ? undefined : {
                      backgroundColor: 'rgb(var(--color-background))',
                      color: 'rgb(var(--color-text))',
                      border: '1px solid rgb(var(--color-border))',
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <time className={`mt-1 block text-[11px] ${isOwnMessage ? 'text-blue-100' : 'opacity-60'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="flex items-center gap-2 border-t px-4 py-2 text-xs text-red-600" style={{ borderColor: 'rgb(var(--color-border))' }}>
              <WifiOff className="h-4 w-4" /> {error}
            </p>
          )}

          <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t p-3" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={4000}
              placeholder="Type your message"
              className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
              style={{
                backgroundColor: 'rgb(var(--color-surface))',
                borderColor: 'rgb(var(--color-border))',
                color: 'rgb(var(--color-text))',
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || !isConnected}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        className="relative ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default LiveSupportChat;