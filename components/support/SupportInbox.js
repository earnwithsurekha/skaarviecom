'use client';

import { useEffect, useRef, useState } from 'react';
import { Inbox, MessageCircle, Send, WifiOff } from 'lucide-react';
import { useSelector } from 'react-redux';
import { createChatSocket } from '@/lib/chatSocket';

const isAgentRole = (role) => role === 'admin' || role === 'customer_support';

const getSenderLabel = (message, currentUser, customerEmail) => {
  if (message.senderEmail === currentUser?.email) return 'You';
  if (message.senderRole === 'admin') return 'Admin';
  if (message.senderRole === 'customer_support') return `Support: ${message.senderEmail}`;
  return customerEmail;
};

export default function SupportInbox({ title = 'Live Chat', description = 'Reply to customer support messages in real time' }) {
  const currentUser = useSelector((state) => state.auth.user);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const selectedIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    selectedIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isAgentRole(currentUser?.role)) return undefined;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError('');
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (connectionError) => {
      setIsConnected(false);
      setError(connectionError.message || 'Unable to connect to live chat');
    });
    socket.on('chat:error', ({ message }) => setError(message));
    socket.on('chat:conversations', setConversations);
    socket.on('chat:history', ({ conversation, messages: history }) => {
      setSelectedConversation(conversation);
      setMessages(history);
      socket.emit('chat:mark-read', { conversationId: conversation.id });
    });
    socket.on('chat:message', (message) => {
      if (message.conversationId !== selectedIdRef.current) return;
      setMessages((current) => (
        current.some((item) => item.id === message.id) ? current : [...current, message]
      ));
      if (!isAgentRole(message.senderRole)) {
        socket.emit('chat:mark-read', { conversationId: message.conversationId });
      }
    });

    return () => socket.disconnect();
  }, [currentUser?.role]);

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    socketRef.current?.emit('chat:select', { conversationId: conversation.id });
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedConversation || !socketRef.current) return;

    setDraft('');
    socketRef.current.emit('chat:send', {
      conversationId: selectedConversation.id,
      body,
    }, (result) => {
      if (!result?.ok) {
        setDraft(body);
        setError(result?.message || 'Unable to send message');
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>{title}</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>{description}</p>
        </div>
        <span className={`flex items-center gap-2 text-sm ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid h-[calc(100vh-13rem)] min-h-[32rem] overflow-hidden border lg:grid-cols-[20rem_1fr]" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <aside className="overflow-y-auto border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgb(var(--color-border))', backgroundColor: 'rgb(var(--color-background))' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <h2 className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="px-5 py-12 text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              <Inbox className="mx-auto mb-3 h-8 w-8" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => selectConversation(conversation)}
              className="flex w-full items-start gap-3 border-b px-4 py-4 text-left"
              style={{
                borderColor: 'rgb(var(--color-border))',
                backgroundColor: selectedConversation?.id === conversation.id ? 'rgba(var(--color-primary), 0.1)' : 'transparent',
              }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {conversation.userEmail?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>{conversation.userEmail}</p>
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{conversation.unreadCount}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  {conversation.lastMessage?.body || 'New conversation'}
                </p>
              </div>
            </button>
          ))}
        </aside>

        <section className="flex min-h-0 flex-col" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              <MessageCircle className="mb-4 h-12 w-12" />
              <p className="font-medium">Select a conversation</p>
            </div>
          ) : (
            <>
              <header className="border-b px-5 py-3" style={{ borderColor: 'rgb(var(--color-border))', backgroundColor: 'rgb(var(--color-background))' }}>
                <p className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>{selectedConversation.userEmail}</p>
                <p className="text-xs capitalize" style={{ color: 'rgb(var(--color-text-secondary))' }}>{selectedConversation.userRole}</p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.map((message) => {
                  const isAgentMessage = isAgentRole(message.senderRole);
                  const senderLabel = getSenderLabel(message, currentUser, selectedConversation.userEmail);
                  return (
                    <div key={message.id} className={`flex ${isAgentMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isAgentMessage ? 'bg-blue-600 text-white' : ''}`}
                        style={isAgentMessage ? undefined : {
                          backgroundColor: 'rgb(var(--color-background))',
                          color: 'rgb(var(--color-text))',
                          border: '1px solid rgb(var(--color-border))',
                        }}
                      >
                        <p className={`mb-1 text-[11px] font-semibold ${isAgentMessage ? 'text-blue-100' : 'opacity-60'}`}>{senderLabel}</p>
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <time className={`mt-1 block text-[11px] ${isAgentMessage ? 'text-blue-100' : 'opacity-60'}`}>
                          {new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t p-4" style={{ borderColor: 'rgb(var(--color-border))', backgroundColor: 'rgb(var(--color-background))' }}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={4000}
                  placeholder="Write a reply"
                  className="min-w-0 flex-1 rounded-md border px-3 py-2 outline-none focus:border-blue-600"
                  style={{ backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border))', color: 'rgb(var(--color-text))' }}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !isConnected}
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}