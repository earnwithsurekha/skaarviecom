# Updated Email Environment Variables for ECS

## Gmail SMTP Configuration

Replace these environment variables in your **Backend ECS Task Definition**:

### Old Variables (AWS SES) - REMOVE:
- ❌ SMTP_HOST
- ❌ SMTP_PORT
- ❌ SMTP_USER
- ❌ SMTP_PASS
- ❌ SMTP_FROM

### New Variables (Gmail) - ADD:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=skaarviresell@gmail.com
EMAIL_PASSWORD=[YOUR_GMAIL_APP_PASSWORD_HERE]
EMAIL_FROM=Skaarvi Reseller <skaarviresell@gmail.com>
```

---

## How to Update ECS Task Definition

### Option 1: AWS Console (Recommended)

1. **Go to ECS Console**
   - Navigate to: https://console.aws.amazon.com/ecs/
   - Region: `ap-south-1`

2. **Select Task Definition**
   - Click **"Task Definitions"**
   - Select your backend task definition (e.g., `Backend-Taskdefination`)
   - Click the latest revision

3. **Create New Revision**
   - Click **"Create new revision"** button
   - Scroll to **"Container Definitions"**
   - Click on your container name

4. **Update Environment Variables**
   - Scroll to **"Environment variables"** section
   - **Remove old variables:**
     - Delete SMTP_HOST
     - Delete SMTP_PORT
     - Delete SMTP_USER
     - Delete SMTP_PASS
     - Delete SMTP_FROM
   
   - **Add new variables:**
     - Add: EMAIL_HOST = smtp.gmail.com
     - Add: EMAIL_PORT = 587
     - Add: EMAIL_SECURE = false
     - Add: EMAIL_USER = skaarviresell@gmail.com
     - Add: EMAIL_PASSWORD = (your app password)
     - Add: EMAIL_FROM = Skaarvi Reseller <skaarviresell@gmail.com>

5. **Save and Create**
   - Click **"Update"** button
   - Click **"Create"** button at the bottom

6. **Update ECS Service**
   - Go to **Clusters** → Select your cluster
   - Select your backend service
   - Click **"Update service"**
   - Under **"Task Definition"**, select the new revision
   - Click **"Update"**

---

## Getting Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to `skaarviresell@gmail.com`
3. Create new app password:
   - Name: `Skaarvi ECS Backend`
   - Click **"Generate"**
4. Copy the 16-character password (remove spaces)
5. Use this password for `EMAIL_PASSWORD` variable

**Full guide:** See [docs/GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md)

---

## Complete Backend Environment Variables

After update, your backend should have these EMAIL variables:

| Variable | Value | Required |
|----------|-------|----------|
| EMAIL_HOST | smtp.gmail.com | ✅ Yes |
| EMAIL_PORT | 587 | ✅ Yes |
| EMAIL_SECURE | false | ✅ Yes |
| EMAIL_USER | skaarviresell@gmail.com | ✅ Yes |
| EMAIL_PASSWORD | (16-char app password) | ✅ Yes |
| EMAIL_FROM | Skaarvi Reseller <skaarviresell@gmail.com> | ✅ Yes |

---

## After Deployment

### Verify Email is Working:

1. **Check Backend Logs:**
   ```
   ECS → Clusters → Your cluster → Services → Backend service → Logs
   ```

2. **Test OTP Email:**
   - Go to your application login
   - Enter email address
   - Request OTP
   - Check if email arrives from `skaarviresell@gmail.com`

3. **Monitor Gmail Sent Folder:**
   - Login to Gmail
   - Check Sent folder for OTP emails

---

## Rollback Plan

If Gmail SMTP doesn't work, you can revert to AWS SES:

1. Create new task definition revision
2. Restore old SMTP_* variables
3. Update service to use old revision

Keep the old task definition revision until Gmail is confirmed working.

---

## Security Notes

⚠️ **Important:**
- Never commit Gmail app password to Git
- Store app password securely
- Rotate app password every 90 days
- Monitor Gmail account for suspicious activity

✅ **Best Practice:**
- Use AWS Secrets Manager for production (optional upgrade)
- Enable Gmail 2FA
- Review Gmail security regularly
