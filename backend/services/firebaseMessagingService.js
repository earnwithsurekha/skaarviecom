const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { Op } = require('sequelize');
const DeviceToken = require('../models/deviceToken');

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-argument',
  'messaging/registration-token-not-registered',
]);

let messagingClient;
let initializationAttempted = false;

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    );
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
};

const getMessagingClient = () => {
  if (initializationAttempted) return messagingClient;
  initializationAttempted = true;

  try {
    const serviceAccount = parseServiceAccount();
    const useApplicationDefault = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!serviceAccount && !useApplicationDefault) {
      console.warn('[FCM] Firebase credentials are not configured; push delivery is disabled.');
      return undefined;
    }

    const app = getApps()[0] || initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId: serviceAccount?.projectId || process.env.FIREBASE_PROJECT_ID,
    });
    messagingClient = getMessaging(app);
    console.log('[FCM] Firebase Cloud Messaging initialized.');
  } catch (error) {
    console.error('[FCM] Initialization failed:', error.message);
  }

  return messagingClient;
};

const stringifyData = (data = {}) => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
);

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const sendToUser = async (userId, { title, body, data = {} }) => {
  const client = getMessagingClient();
  if (!client) return { sent: 0, failed: 0, skipped: true };

  const deviceTokens = await DeviceToken.findAll({
    where: { userId, isActive: true },
    attributes: ['id', 'token'],
  });
  if (deviceTokens.length === 0) return { sent: 0, failed: 0, skipped: true };

  let sent = 0;
  let failed = 0;
  const invalidTokenIds = [];

  for (const tokenBatch of chunk(deviceTokens, 500)) {
    const response = await client.sendEachForMulticast({
      tokens: tokenBatch.map((deviceToken) => deviceToken.token),
      notification: { title, body },
      data: stringifyData(data),
      android: {
        priority: 'high',
        notification: { channelId: 'orders', sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
      webpush: {
        fcmOptions: { link: data.url || '/' },
      },
    });

    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((result, index) => {
      if (!result.success && INVALID_TOKEN_CODES.has(result.error?.code)) {
        invalidTokenIds.push(tokenBatch[index].id);
      }
    });
  }

  if (invalidTokenIds.length > 0) {
    await DeviceToken.update(
      { isActive: false },
      { where: { id: { [Op.in]: invalidTokenIds } } }
    );
  }

  return { sent, failed, skipped: false };
};

module.exports = {
  getMessagingClient,
  sendToUser,
};