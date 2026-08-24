/**
 * Test Gmail SMTP Configuration
 * 
 * This script tests your Gmail SMTP settings before deploying to production.
 * Run: node test-gmail-smtp.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration from environment variables
const config = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'skaarviresell@gmail.com',
    pass: process.env.EMAIL_PASSWORD,
  },
};

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║          Gmail SMTP Configuration Test                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📧 Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Secure: ${config.secure}`);
console.log(`   User: ${config.auth.user}`);
console.log(`   Password: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : '❌ NOT SET'}`);
console.log('');

// Validate configuration
if (!config.auth.pass) {
  console.error('❌ ERROR: EMAIL_PASSWORD not set in .env file\n');
  console.error('Please follow these steps:');
  console.error('1. Go to: https://myaccount.google.com/apppasswords');
  console.error('2. Generate app password for "Skaarvi Application"');
  console.error('3. Add to backend/.env: EMAIL_PASSWORD=your_app_password');
  console.error('4. Run this script again\n');
  process.exit(1);
}

// Test email sending
async function testEmail() {
  console.log('🔄 Creating transporter...');
  const transporter = nodemailer.createTransporter(config);

  console.log('✅ Transporter created\n');

  // Test connection
  console.log('🔄 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nCommon issues:');
    console.error('- Invalid app password');
    console.error('- 2FA not enabled on Gmail');
    console.error('- Network/firewall blocking port 587');
    console.error('\nSee docs/GMAIL-SMTP-SETUP.md for help\n');
    process.exit(1);
  }

  // Send test email
  const testRecipient = process.argv[2] || config.auth.user;
  
  console.log(`🔄 Sending test email to: ${testRecipient}...`);

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Skaarvi Reseller <${config.auth.user}>`,
    to: testRecipient,
    subject: '✅ Gmail SMTP Test - Skaarvi Reseller',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
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
            border: 1px solid #e5e7eb;
          }
          .success-box {
            background-color: #d1fae5;
            border: 2px solid #10b981;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .info-table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-table td:first-child {
            font-weight: bold;
            width: 150px;
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
        <div class="header">
          <h1>🎉 Gmail SMTP Test Successful!</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="color: #059669; margin: 0;">✅ Configuration Working</h2>
            <p style="margin: 10px 0 0 0;">Your Gmail SMTP is configured correctly!</p>
          </div>
          
          <p>This test email confirms that your Skaarvi Reseller application can successfully send emails using Gmail SMTP.</p>
          
          <table class="info-table">
            <tr>
              <td>SMTP Host</td>
              <td>${config.host}</td>
            </tr>
            <tr>
              <td>SMTP Port</td>
              <td>${config.port}</td>
            </tr>
            <tr>
              <td>Secure</td>
              <td>${config.secure ? 'Yes (SSL)' : 'No (TLS)'}</td>
            </tr>
            <tr>
              <td>From Address</td>
              <td>${config.auth.user}</td>
            </tr>
            <tr>
              <td>Test Date</td>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Deploy to AWS ECS with same EMAIL_* environment variables</li>
            <li>Test OTP emails in production</li>
            <li>Monitor Gmail sent folder</li>
          </ol>
          
          <div class="footer">
            <p>© 2026 Skaarvi Reseller Marketplace</p>
            <p>This is a test email from your application.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!\n');
    console.log('📨 Details:');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${testRecipient}`);
    console.log(`   From: ${mailOptions.from}`);
    console.log('');
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ TEST PASSED                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('🎉 Gmail SMTP is working correctly!\n');
    console.log('📝 Next steps:');
    console.log('   1. Check your inbox at', testRecipient);
    console.log('   2. Update ECS Task Definition with these EMAIL_* variables');
    console.log('   3. See backend/ECS-EMAIL-UPDATE.md for deployment guide\n');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('\nError details:', error);
    console.error('\nSee docs/GMAIL-SMTP-SETUP.md for troubleshooting\n');
    process.exit(1);
  }
}

// Run test
testEmail().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
