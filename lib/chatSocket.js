import { io } from 'socket.io-client';

const getChatServerOrigin = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    || process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl) return new URL(configuredUrl).origin;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:5000';
  return window.location.origin;
};

export const createChatSocket = (token) => io(getChatServerOrigin(), {
  path: '/api/socket.io',
  auth: { token },
  transports: ['websocket', 'polling'],
});