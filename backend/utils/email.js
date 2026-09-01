const nodemailer = require('nodemailer');

const DEFAULT_FROM_ADDRESS = 'Skaarvi Reseller <noreply@skaarvi.com>';

const getFromAddress = () => process.env.EMAIL_FROM || DEFAULT_FROM_ADDRESS;

const getSenderEmail = () => {
  const fromAddress = getFromAddress();
  const angleBracketMatch = fromAddress.match(/<([^<>]+)>/);
  const email = (angleBracketMatch?.[1] || fromAddress).trim();

  return email.includes('@')
    ? email
    : (process.env.EMAIL_USER || 'noreply@skaarvi.com');
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: Number.parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS || '10000', 10),
    greetingTimeout: Number.parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS || '10000', 10),
    socketTimeout: Number.parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS || '20000', 10),
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  });

  console.log('[Email] Message sent:', info.messageId);
  return { success: true, messageId: info.messageId };
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: getFromAddress(),
    to: email,
    subject: 'Your OTP for Skaarvi Reseller Login',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .otp-box {
            background-color: white;
            border: 2px dashed #4F46E5;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .warning {
            color: #dc2626;
            font-size: 14px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Skaarvi Reseller Marketplace</h1>
          </div>
          <div class="content">
            <h2>Your One-Time Password (OTP)</h2>
            <p>Hello,</p>
            <p>You have requested to login to your Skaarvi Reseller account. Please use the OTP below to complete your authentication:</p>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <p>This OTP is valid for <strong>5 minutes</strong>.</p>
            
            <p class="warning">
              ⚠️ If you did not request this OTP, please ignore this email. Do not share this OTP with anyone.
            </p>
            
            <div class="footer">
              <p>© 2026 Skaarvi Reseller Marketplace. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your OTP for Skaarvi Reseller Login is: ${otp}. This OTP is valid for 5 minutes. If you did not request this, please ignore this email.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: getFromAddress(),
    to: email,
    subject: 'Welcome to Skaarvi Reseller Marketplace!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Skaarvi!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering as a manufacturer on the Skaarvi Reseller Marketplace!</p>
            <p>Your registration is currently under review by our admin team. You will receive a notification once your account is approved.</p>
            <p>In the meantime, feel free to explore the platform and prepare your product listings.</p>
            <div class="footer">
              <p>© 2026 Skaarvi Reseller Marketplace. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully');
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw - welcome email is not critical
  }
};

module.exports = {
  getFromAddress,
  getSenderEmail,
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
};
