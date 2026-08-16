# MSG91 SMS & OTP Configuration Guide

Complete guide to set up MSG91 for sending OTPs and SMS messages in your SKAARVI application.

---

## 📱 What is MSG91?

MSG91 is India's leading SMS gateway provider offering:
- ✅ OTP SMS (transactional)
- ✅ Promotional SMS
- ✅ Transactional alerts
- ✅ Voice OTP
- ✅ WhatsApp Business API
- ✅ Email services

**Pricing**: Pay-as-you-go, starting from ~₹0.15/SMS

---

## 🚀 Step 1: Create MSG91 Account

### Sign Up

1. Visit [https://msg91.com/](https://msg91.com/)
2. Click **"Sign Up Free"**
3. Fill in details:
   - Name
   - Email
   - Mobile number
   - Company name
4. Verify your email and mobile
5. Complete KYC (business documents required for production)

### Get Free Credits

- New accounts get **₹20-50 free credits**
- Use for testing before going live

---

## 🔑 Step 2: Get Your API Credentials

### 1. Get Auth Key

1. Login to [MSG91 Dashboard](https://control.msg91.com/)
2. Go to **"Settings"** → **"API Keys"**
3. Copy your **Auth Key**
   ```
   Example: 123456AaBbCcDdEeFfGg
   ```

### 2. Get Sender ID

1. Go to **"Sender ID"** in dashboard
2. Create a new Sender ID:
   - **Name**: `SKAARV` (6 characters max for transactional)
   - **Type**: Transactional
   - **Purpose**: OTP & Order notifications
3. Wait for approval (1-2 business days)
4. For testing, use: `SKAARV` or `MSGIND` (pre-approved)

### 3. Get DLT Entity ID (Required for India)

**What is DLT?**
DLT (Distributed Ledger Technology) registration is mandatory for sending commercial SMS in India as per TRAI regulations.

**How to Get Your DLT Entity ID (PE ID)**:

1. Go to MSG91 Dashboard → **"DLT"** section
2. You'll see your **DLT Entity ID** (also called PE ID or Principal Entity ID)
   ```
   Example: 1101234567890123456
   ```
3. This is a **19-digit number** provided when you registered your entity

**If You Don't Have DLT Entity ID**:
1. You need to register on [https://www.vilpower.in/](https://www.vilpower.in/) (Vodafone Idea's DLT platform)
   - OR use your telecom operator's DLT platform (Airtel, BSNL, etc.)
2. Register your business entity
3. Get your PE ID (Principal Entity ID)
4. Add it to MSG91 dashboard under DLT section

**Help Resources**:
- [How to Find DLT Entity ID](https://msg91.com/help/MSG91/find-your-dlt-entity-pe-id)
- MSG91 Support: support@msg91.com

⚠️ **Important**: 
- Without DLT Entity ID, SMS delivery may fail or be blocked
- This is different from Template ID
- Required for all commercial SMS in India

### 4. Create OTP Template

1. Go to **"Templates"** → **"Create Template"**
2. Select **"OTP"** category
3. Create template:

**Template Name**: `OTP Verification`

**Template Content**:
```
Your OTP for login to skaarvi reseller is ##OTP##
```

**Variables**: `##OTP##`

4. Submit for approval
5. Copy **Template ID** once approved
   ```
   Example: 60a1234567890abcdef12345
   ```

### 4. Whitelist Your IP Address (Important!)

MSG91 requires you to whitelist the server IP from which API calls will be made:

1. Go to **"Settings"** → **"IP Whitelisting"** in dashboard
2. Click **"Add IP"**
3. Add your server IPs:

**For Development (localhost testing)**:
```
127.0.0.1
::1
```

**For Production Server**:
- Get your server's public IP:
  ```bash
  curl ifconfig.me
  # or
  curl icanhazip.com
  ```
- Add this IP to whitelist
- Example: `203.0.113.45`

**For Multiple Servers**:
- Add each server IP separately
- Or use IP range: `203.0.113.0/24`

**For Cloud Hosting**:
- **AWS**: Use Elastic IP or NAT Gateway IP
- **Azure**: Use outbound public IP
- **DigitalOcean**: Use Droplet's public IP
- **Heroku**: Heroku provides a list of IPs, add all
- **Vercel**: Add `0.0.0.0/0` (all IPs) or contact support

4. Click **"Save"**

⚠️ **Important Notes**:
- Without IP whitelisting, API calls will fail with authentication error
- For dynamic IPs, you may need to update regularly
- For testing, you can temporarily add `0.0.0.0/0` (all IPs) but **remove this in production** for security

**Alternative - Disable IP Whitelist (Not Recommended)**:
- Some MSG91 accounts allow disabling IP whitelist
- Go to Settings → IP Whitelisting → Toggle "Disable IP Whitelist"
- ⚠️ Only use this for testing, enable for production

---

## ⚙️ Step 5: Configure Environment Variables

### Backend Configuration

Update `backend/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=SKAARV
MSG91_DLT_ENTITY_ID=your_dlt_entity_id_here
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_OTP_LENGTH=6
MSG91_OTP_EXPIRY=10

# SMS Features
SMS_ENABLED=true
SMS_PROVIDER=msg91
```

### Frontend Configuration

Update `.env.local`:

```env
# SMS Configuration
MSG91_DLT_ENTITY_ID=your_dlt_entity_id_here
NEXT_PUBLIC_SMS_ENABLED=true
NEXT_PUBLIC_OTP_LENGTH=6
```

---

## 📝 Step 6: Update Backend Files

The SMS utility has already been created at `backend/utils/sms.js`

### Usage Examples

#### 1. Send OTP

```javascript
const smsService = require('../utils/sms');

// Generate OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

// Send OTP
const result = await smsService.sendOTP('9876543210', otp);

if (result.success) {
  console.log('OTP sent successfully');
  // Save OTP to database
} else {
  console.error('Failed to send OTP:', result.message);
}
```

#### 2. Verify OTP

```javascript
const result = await smsService.verifyOTP('9876543210', '123456');

if (result.success) {
  console.log('OTP verified');
  // Proceed with login
} else {
  console.error('Invalid OTP');
}
```

#### 3. Send Order Confirmation

```javascript
await smsService.sendOrderConfirmation(
  '9876543210',
  'ORD123456',
  2499
);
```

#### 4. Send Custom SMS

```javascript
await smsService.sendSMS(
  '9876543210',
  'Your order has been shipped!',
  'transactional'
);
```

---

## 🔗 Step 7: Integrate with Authentication

### Update Auth Routes

Update `backend/routes/auth.js` to include SMS OTP:

```javascript
const smsService = require('../utils/sms');

// Send OTP via SMS
router.post('/send-otp-sms', async (req, res) => {
  try {
    const { mobile } = req.body;
    
    // Validate mobile number
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid mobile number'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send OTP via SMS
    const result = await smsService.sendOTP(mobile, otp);
    
    if (result.success) {
      // Save OTP to database with expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await OTP.create({
        mobile,
        otp,
        expiresAt,
        verified: false
      });
      
      return res.json({
        status: 'success',
        message: 'OTP sent to your mobile number',
        expiresIn: 600 // seconds
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Verify OTP from SMS
router.post('/verify-otp-sms', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    // Find OTP in database
    const otpRecord = await OTP.findOne({
      where: {
        mobile,
        otp,
        verified: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }
    
    // Mark as verified
    await otpRecord.update({ verified: true });
    
    // Find or create user
    let user = await User.findOne({ where: { mobile } });
    
    if (!user) {
      user = await User.create({
        mobile,
        role: 'customer',
        status: 'approved',
        isActive: true
      });
    }
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});
```

---

## 🎨 Step 8: Update Frontend Components

### Mobile Login Component

Create/update mobile login component:

```javascript
// components/MobileLogin.jsx
'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileLogin() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!/^[0-9]{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('OTP sent to your mobile number');
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{6}$/.test(otp)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Login successful!');
        // Store tokens and redirect
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        window.location.href = '/customer/dashboard';
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Login with Mobile</h2>

      {!otpSent ? (
        <form onSubmit={handleSendOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              OTP sent to {mobile}
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-blue-600 ml-2"
              >
                Change
              </button>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={handleSendOTP}
            className="w-full mt-3 py-2 text-blue-600 hover:underline"
          >
            Resend OTP
          </button>
        </form>
      )}
    </div>
  );
}
```

---

## 🧪 Step 9: Testing

### Test in Development

1. **Start servers**:
   ```bash
   cd backend
   npm run dev
   
   cd ..
   npm run dev
   ```

2. **Test OTP flow**:
   - Enter your mobile number
   - Check SMS for OTP
   - Verify OTP
   - Should login successfully

### Test API Directly

Use Postman or curl:

```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp-sms \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp-sms \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456"}'
```

---

## 📊 Step 10: Monitor Usage

### MSG91 Dashboard

1. Login to [MSG91 Dashboard](https://control.msg91.com/)
2. View **Reports** to see:
   - Messages sent
   - Delivery status
   - Failed messages
   - Credits remaining

### Check Delivery Status in Code

```javascript
const result = await smsService.sendSMS('9876543210', 'Test message');
if (result.success) {
  const requestId = result.data.request_id;
  
  // Check status after some time
  setTimeout(async () => {
    const status = await smsService.checkDeliveryStatus(requestId);
    console.log('Delivery status:', status);
  }, 5000);
}
```

---

## 💰 Step 11: Pricing & Credits

### Pricing (Approximate)

| Service Type | Cost per SMS |
|-------------|--------------|
| Transactional (OTP) | ₹0.15 - ₹0.25 |
| Promotional | ₹0.10 - ₹0.15 |
| Voice OTP | ₹0.30 - ₹0.50 |

### Recharge Credits

1. Go to **"Recharge"** in dashboard
2. Choose amount:
   - ₹500 → ~2000-3000 SMS
   - ₹1000 → ~4000-6000 SMS
   - ₹5000 → ~20,000-30,000 SMS
3. Pay via UPI/Card/Net Banking

---

## 🔒 Step 12: Best Practices

### Security

1. **Never expose Auth Key**:
   ```javascript
   // ❌ Bad
   const authKey = '123456AaBbCc';
   
   // ✅ Good
   const authKey = process.env.MSG91_AUTH_KEY;
   ```

2. **Rate limiting**:
   ```javascript
   // Limit OTP requests per mobile
   const otpRequests = await OTP.count({
     where: {
       mobile,
       createdAt: {
         [Op.gt]: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
       }
     }
   });
   
   if (otpRequests >= 5) {
     return res.status(429).json({
       status: 'error',
       message: 'Too many OTP requests. Please try after 1 hour.'
     });
   }
   ```

3. **OTP expiry**: Always set expiry (10 minutes recommended)

4. **Single use OTPs**: Mark as verified after use

### Cost Optimization

1. **Use email for non-critical notifications**
2. **Batch SMS for multiple recipients**
3. **Monitor delivery reports** to identify issues
4. **Use templates** to reduce costs

---

## 🆘 Troubleshooting

### OTP not received?

1. **Check credits**: Dashboard → Balance
2. **Check template**: Must be approved
3. **Check sender ID**: Must be approved
4. **Check mobile format**: Must be 10 digits
5. **Check DND**: User might have DND enabled

### "Authentication failed" error?

- Verify `MSG91_AUTH_KEY` in `.env`
- Check if key is active in dashboard
- **Check IP whitelisting**: Go to Settings → IP Whitelisting
  - Add your server IP: `curl ifconfig.me`
  - For development: Add `127.0.0.1`
  - Or temporarily disable IP whitelist for testing

### Template not found?

- Use approved template ID only
- Wait for template approval (1-2 days)

### Delivery failed?

- Check Reports in dashboard
- Common reasons:
  - Invalid mobile number
  - DND (Do Not Disturb) enabled
  - Network issues
  - Number ported to different operator

---

## 📞 Support

### MSG91 Support

- **Email**: support@msg91.com
- **Phone**: +91-9650140680
- **Chat**: Available on dashboard
- **Docs**: https://docs.msg91.com/

### SKAARVI Implementation Support

Check the SMS utility file: `backend/utils/sms.js`

---

## ✅ Checklist

Before going live:
**IP address whitelisted in MSG91**
- [ ] 
- [ ] MSG91 account created and verified
- [ ] KYC documents submitted and approved
- [ ] Auth Key obtained and configured
- [ ] Sender ID created and approved
- [ ] OTP template created and approved
- [ ] Environment variables configured
- [ ] SMS utility integrated
- [ ] Tested OTP flow end-to-end
- [ ] Credits recharged
- [ ] Rate limiting implemented
- [ ] Error handling added
- [ ] Monitoring set up

---

## 🎉 You're All Set!

Your MSG91 integration is complete. Users can now:
- ✅ Login with mobile OTP
- ✅ Receive order notifications
- ✅ Get payment reminders
- ✅ Receive shipping updates

**Total Setup Time**: ~30-60 minutes  
**Monthly Cost**: ₹500-2000 (depending on usage)  

Happy messaging! 📱
