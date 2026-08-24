# Gmail SMTP Configuration Guide

## Overview
This guide explains how to set up Gmail SMTP for sending emails from your application using `skaarviresell@gmail.com`.

## Prerequisites
- Gmail account: `skaarviresell@gmail.com`
- Access to Gmail account settings

---

## Step 1: Enable 2-Factor Authentication

**Gmail App Passwords require 2FA to be enabled.**

1. Go to your Google Account: https://myaccount.google.com/
2. Click **"Security"** in the left sidebar
3. Scroll to **"How you sign in to Google"**
4. Click **"2-Step Verification"**
5. Follow the setup wizard:
   - Enter your password
   - Add your phone number
   - Verify with SMS code
   - Enable 2-Step Verification

---

## Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: **Google Account** → **Security** → **2-Step Verification** → **App passwords** (at bottom)

2. **Sign in** if prompted

3. **Create App Password:**
   - Click **"Select app"** → Choose **"Other (Custom name)"**
   - Enter name: `Skaarvi Reseller Application`
   - Click **"Generate"**

4. **Copy the 16-character password**
   - Example: `abcd efgh ijkl mnop`
   - **Important**: Remove spaces when using: `abcdefghijklmnop`

5. Click **"Done"**

---

## Step 3: Configure Environment Variables

### For Local Development (backend/.env)

Create a `.env` file in the `backend` directory:

```env
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=skaarviresell@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Skaarvi Reseller <skaarviresell@gmail.com>
```

Replace `abcdefghijklmnop` with your actual 16-character app password (no spaces).

### For AWS ECS Production

Update your ECS Task Definition environment variables:

| Variable | Value |
|----------|-------|
| EMAIL_HOST | smtp.gmail.com |
| EMAIL_PORT | 587 |
| EMAIL_SECURE | false |
| EMAIL_USER | skaarviresell@gmail.com |
| EMAIL_PASSWORD | (your-16-char-app-password) |
| EMAIL_FROM | Skaarvi Reseller <skaarviresell@gmail.com> |

**To update ECS:**
1. Go to **ECS Console** → **Task Definitions**
2. Select your backend task definition
3. Click **"Create new revision"**
4. Scroll to **"Environment variables"**
5. Update the EMAIL_* variables
6. Click **"Create"**
7. Update your ECS Service to use the new revision

---

## Step 4: Test Email Configuration

### Test Script

Create a test file `backend/test-email.js`:

```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'your-test-email@example.com', // Change this
      subject: 'Test Email from Skaarvi',
      html: '<h1>Test Email</h1><p>If you receive this, Gmail SMTP is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

testEmail();
```

### Run Test:

```bash
cd backend
node test-email.js
```

**Expected output:**
```
✅ Email sent successfully!
Message ID: <unique-id@gmail.com>
```

---

## Gmail SMTP Settings Reference

| Setting | Value | Description |
|---------|-------|-------------|
| **Host** | smtp.gmail.com | Gmail SMTP server |
| **Port** | 587 | TLS (recommended) |
| **Port** | 465 | SSL (alternative) |
| **Security** | STARTTLS | For port 587 |
| **Security** | SSL/TLS | For port 465 |
| **Username** | skaarviresell@gmail.com | Full email address |
| **Password** | App Password | 16-character code |

---

## Troubleshooting

### Error: "Invalid login"
**Solution:** 
- Verify 2FA is enabled
- Regenerate app password
- Remove spaces from app password
- Check username is the full email address

### Error: "Connection refused"
**Solution:**
- Check port number (587 for TLS)
- Verify EMAIL_SECURE is set to `false` for port 587
- Check firewall/network allows outbound SMTP

### Error: "Daily sending quota exceeded"
**Solution:**
- Gmail free accounts: 500 emails/day
- Gmail Workspace: 2,000 emails/day
- Consider using AWS SES for higher volumes

### Email goes to spam
**Solutions:**
- Add SPF record to your domain
- Use consistent "From" address
- Avoid spam trigger words
- Keep email volume reasonable

---

## Security Best Practices

1. **Never commit app passwords to Git**
   - Use `.env` files (already in .gitignore)
   - Use environment variables in production

2. **Rotate app passwords periodically**
   - Recommended: Every 90 days
   - Revoke old passwords after rotation

3. **Use least privilege**
   - App passwords can only send email
   - They cannot access full Gmail account

4. **Monitor usage**
   - Check Gmail sent folder
   - Monitor for suspicious activity

5. **Backup configuration**
   - Document app password location
   - Store securely (password manager)

---

## Alternative: Port 465 (SSL)

If port 587 doesn't work, try SSL on port 465:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true  # Changed to true for SSL
EMAIL_USER=skaarviresell@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Skaarvi Reseller <skaarviresell@gmail.com>
```

---

## Switching from AWS SES to Gmail

### What Changed:

| Variable (Old) | Variable (New) | Change |
|----------------|----------------|--------|
| SMTP_HOST | EMAIL_HOST | Renamed |
| SMTP_PORT | EMAIL_PORT | Renamed |
| SMTP_USER | EMAIL_USER | Renamed |
| SMTP_PASS | EMAIL_PASSWORD | Renamed |
| SMTP_FROM | EMAIL_FROM | Renamed |
| N/A | EMAIL_SECURE | Added |

### Migration Steps:

1. **Update ECS Task Definition** with new environment variables
2. **Deploy new backend revision**
3. **Test email functionality**
4. **Remove AWS SES credentials** (if not used elsewhere)

---

## Support

### Gmail Help:
- App Passwords: https://support.google.com/accounts/answer/185833
- SMTP Settings: https://support.google.com/mail/answer/7126229

### Nodemailer Documentation:
- https://nodemailer.com/smtp/

### Common Issues:
- Check Google Account security: https://myaccount.google.com/security
- Review Gmail activity: https://myaccount.google.com/notifications
