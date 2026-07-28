# MSG91 IP Whitelisting - Quick Fix

## 🔴 Problem
Getting "Authentication failed" or "IP not whitelisted" error from MSG91.

## ✅ Solution

### Step 1: Get Your IP Address

**For Development (localhost)**:
```
Add these IPs:
127.0.0.1
::1
```

**For Production Server**:
```bash
# Run this command on your server to get public IP:
curl ifconfig.me

# Alternative commands:
curl icanhazip.com
curl ipinfo.io/ip
```

Example output: `203.0.113.45`

### Step 2: Add IP to MSG91

1. Login to [MSG91 Dashboard](https://control.msg91.com/)
2. Go to **Settings** → **IP Whitelisting**
3. Click **"Add IP"** or **"+"** button
4. Enter your IP address:
   - Development: `127.0.0.1`
   - Production: Your server's IP (e.g., `203.0.113.45`)
5. Click **"Save"** or **"Add"**

### Step 3: Test

Wait 1-2 minutes for changes to propagate, then test your SMS API call again.

---

## 🖥️ Different Hosting Platforms

### Local Development
```
IP to whitelist: 127.0.0.1
```

### AWS EC2
```bash
# Get Elastic IP or public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

### DigitalOcean Droplet
```
Use your droplet's public IPv4 address
Check in: Droplets → Your Droplet → Networking
```

### Azure VM
```
Get public IP from Azure Portal → Virtual Machines → Networking
```

### Heroku
```
Heroku uses dynamic IPs. Options:
1. Use QuotaGuard Shield add-on for static IP
2. Or whitelist all IPs: 0.0.0.0/0 (not recommended for production)
```

### Vercel/Netlify
```
They use dynamic IPs. Options:
1. Contact MSG91 support to whitelist their IP ranges
2. Or whitelist all: 0.0.0.0/0 (not recommended)
3. Use a proxy server with static IP
```

### Google Cloud Platform (GCP)
```
Get external IP from: VM instances → External IP column
```

---

## 🚨 Quick Workaround (Testing Only)

If you need to test immediately and don't have a static IP:

### Option 1: Disable IP Whitelist
1. MSG91 Dashboard → Settings → IP Whitelisting
2. Look for **"Disable IP Whitelist"** or similar toggle
3. Turn it OFF temporarily
4. ⚠️ **Re-enable before production!**

### Option 2: Whitelist All IPs (Not Recommended)
```
Add: 0.0.0.0/0
```
This allows all IPs but is a security risk. Use only for testing!

---

## 🔍 Verify It's Working

### Test 1: Check IP from Server
```bash
# SSH into your server
ssh user@your-server

# Get IP
curl ifconfig.me

# Output should match whitelisted IP
```

### Test 2: Test MSG91 API
```bash
# Test from your server
curl -X POST "https://control.msg91.com/api/v5/otp?authkey=YOUR_AUTH_KEY&mobile=919876543210&template_id=YOUR_TEMPLATE_ID&otp=123456"
```

If successful, you'll get:
```json
{"type":"success","message":"OTP sent successfully"}
```

---

## 📋 Multiple Servers?

If you have multiple servers (dev, staging, production):

1. Get IP of each server
2. Add all IPs to whitelist:
   ```
   Dev:     127.0.0.1
   Staging: 198.51.100.50
   Prod:    203.0.113.45
   ```
3. Save

You can add up to 10-20 IPs typically.

---

## 💡 Best Practices

### ✅ Do:
- Use static IPs for production
- Whitelist only necessary IPs
- Document which IP belongs to which server
- Update whitelist when changing servers

### ❌ Don't:
- Use `0.0.0.0/0` in production
- Forget to update after server migration
- Share Auth Key without IP protection
- Leave IP whitelist disabled in production

---

## 🆘 Still Not Working?

### Check These:

1. **Wait 1-2 minutes** after adding IP
2. **Clear cache**: Restart your application
3. **Check Auth Key**: Make sure it's correct in `.env`
4. **Check API endpoint**: Using correct MSG91 URL?
5. **Check MSG91 status**: https://status.msg91.com/

### Contact Support:

If still failing:
- **MSG91 Support**: support@msg91.com
- **Phone**: +91-9650140680
- **Chat**: Available on dashboard

Provide:
- Your Auth Key (last 4 digits only)
- IP you're trying to whitelist
- Error message you're getting

---

## ✅ Success!

Once IP is whitelisted correctly, you should see:
- No authentication errors
- OTPs sent successfully
- SMS delivery working

You're all set! 🎉

---

**File**: `docs/MSG91-IP-WHITELISTING.md`  
**Last Updated**: 2026-07-04
