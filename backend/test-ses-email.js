/**
 * Test script to verify AWS SES SMTP credentials
 * Run: node test-ses-email.js
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'email-smtp.ap-south-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: 'AKIAUB26EX2DMIRWND5J',
    pass: 'BPAm0q0PikK2jkNgllwbKnIblu6DRVH35pmpjkbJnmTJ',
  },
});

async function sendTestEmail() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const info = await transporter.sendMail({
      from: '"Skaarvi Reseller" <skaarvitelugudigitalacademy@gmail.com>',
      to: 'skaarvitelugudigitalacademy@gmail.com',
      subject: 'AWS SES Test Email',
      text: 'This is a test email sent via AWS SES SMTP.',
      html: '<h2>AWS SES Test</h2><p>This is a test email sent via <strong>AWS SES SMTP</strong> from Skaarvi Reseller.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

sendTestEmail();
