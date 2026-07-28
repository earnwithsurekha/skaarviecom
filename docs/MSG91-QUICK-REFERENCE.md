# MSG91 Quick Reference

## 🔑 Get Started (5 minutes)

### 1. Sign Up
- Visit: https://msg91.com/
- Get ₹20-50 free credits

### 2. Get Credentials
```
Auth Key: Settings → API Keys
Sender ID: Create "SKAARV" (transactional)
DLT Entity ID: Dashboard → DLT section (19-digit PE ID)
Template ID: Templates → Create OTP template
Whitelist IP: Settings → IP Whitelisting → Add your server IP
```

### 3. Configure .env
```env
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=SKAARV
MSG91_DLT_ENTITY_ID=your_dlt_entity_id_here
MSG91_TEMPLATE_ID=your_template_id_here
SMS_ENABLED=true
```

---

## 📝 Quick Code Examples

### Send OTP
```javascript
const smsService = require('./utils/sms');
const otp = Math.floor(100000 + Math.random() * 900000).toString();
await smsService.sendOTP('9876543210', otp);
```

### Verify OTP
```javascript
const result = await smsService.verifyOTP('9876543210', '123456');
if (result.success) {
  // Login user
}
```

### Send Custom SMS
```javascript
await smsService.sendSMS('9876543210', 'Your order has shipped!');
```

### Send Order Notification
```javascript
await smsService.sendOrderConfirmation('9876543210', 'ORD123', 2499);
```

---

## 🎯 API Endpoints

### Send OTP
```
POST /api/auth/send-otp-sms
Body: { "mobile": "9876543210" }
```

### Verify OTP
```
POST /api/auth/verify-otp-sms
Body: { "mobile": "9876543210", "otp": "123456" }
```

---

## 📋 OTP Template Format

```
Your OTP for login to skaarvi reseller is ##OTP##
```

**Variables**: `##OTP##`  
**Type**: Transactional  
**Sender ID**: SKAARV

---

## 💰 Pricing

| Type | Cost/SMS |
|------|----------|
| OTP (Transactional) | ₹0.15-0.25 |
| Promotional | ₹0.10-0.15 |
| Voice OTP | ₹0.30-0.50 |

**Recommended**: Start with ₹500 (~2000-3000 SMS)

---

## 🔧 Available Methods

```javascript
const smsService = require('./backend/utils/sms');

// OTP functions
smsService.sendOTP(mobile, otp, templateId)
smsService.verifyOTP(mobile, otp)
smsService.resendOTP(mobile, retryType)

// SMS functions
smsService.sendSMS(mobile, message, route)
smsService.sendOrderConfirmation(mobile, orderNumber, amount)
smsService.sendOrderShipped(mobile, orderNumber, trackingUrl)
smsService.sendOrderDelivered(mobile, orderNumber)
smsService.sendPaymentReminder(mobile, amount)

// Status check
smsService.checkDeliveryStatus(requestId)
```

---

## 🆘 Common Issues

### OTP not received?
1. Check credits in dashboard
2. Verify template is approved
3. Check sender ID is approved
4. Mobile number must be 10 digits

### Authentication failed?
- Verify `MSG91_AUTH_KEY` in `.env`
- Check if key is active
- **Whitelist your IP**: Settings → IP Whitelisting
  ```bash
  # Get your IP
  curl ifconfig.me
  # Add to MSG91 dashboard
  ```

### Template not found?
- Use approved template ID only
- Wait 1-2 days for approval

---

## 📊 Monitor Usage

**Dashboard**: https://control.msg91.com/

View:
- Messages sent
- Delivery status
- Credits remaining
- Failed messages

---

## 🔗 Resources

- **Setup Guide**: `docs/MSG91-SETUP-GUIDE.md`
- **SMS Utility**: `backend/utils/sms.js`
- **MSG91 Docs**: https://docs.msg91.com/
- **Support**: support@msg91.com

---

## ✅ Pre-Launch Checklist

- [ ] Account created & KYC done
- [ ] Auth Key configured
- [ ] **IP address whitelisted**
- [ ] Sender ID approved
- [ ] Template approved
- [ ] Tested OTP flow
- [ ] Credits added
- [ ] Rate limiting added
- [ ] Error handling added

---

**File**: `docs/MSG91-QUICK-REFERENCE.md`  
**Last Updated**: 2026-07-04
