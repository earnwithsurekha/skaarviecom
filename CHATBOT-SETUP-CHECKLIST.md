# ✅ Tawk.to Chatbot - Setup Checklist

Print this page or keep it open while setting up your chatbot!

---

## 📋 Pre-Setup Information

**Integration Status**: ✅ **COMPLETE** - Code is ready!  
**What's left**: Only configuration (5 minutes)

**Files Added/Modified**:
- ✅ `components/TawkToChat.js` - Chat widget component
- ✅ `app/providers.js` - Integrated into app
- ✅ `docs/TAWKTO-CHATBOT-SETUP.md` - Full guide
- ✅ `docs/TAWKTO-QUICK-REFERENCE.md` - Quick reference
- ✅ `CHATBOT-INTEGRATION-README.md` - Overview

---

## 🚀 5-Minute Setup Process

### □ Step 1: Create Account (2 minutes)
1. Go to: https://www.tawk.to/
2. Click "Sign Up Free"
3. Enter:
   - [ ] Your name
   - [ ] Email address (business email recommended)
   - [ ] Password (min 8 characters)
4. After signup, you'll be asked to add a property:
   
   **Property Name**: `SKAARVI` (or your business name)
   
   **Site URL**: Enter a valid domain (Tawk.to doesn't accept localhost here)
   - Use: `https://skaarvi.com` (or your actual domain)
   - OR use: `https://example.com` (temporary - you'll configure localhost later)
   
   ⚠️ **Important**: Tawk.to rejects localhost URLs during initial setup, but you can add localhost in settings after account creation!
   
5. Click "Add Property"
6. Check email and verify account (if prompted)
7. You'll be taken to the dashboard

**✅ Done? Continue to Step 2**

---

### □ Step 2: Get Your IDs (1 minute)
1. In Tawk.to dashboard, click **"Administration"** (⚙️ icon)
2. Navigate: **Channels** → **Chat Widget**
3. Find the widget embed code (looks like JavaScript)
4. Locate this line:
   ```
   s1.src='https://embed.tawk.to/PROPERTY_ID/WIDGET_ID';
   ```
5. Copy both IDs:
   
   **Property ID**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
   
   **Widget ID**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**✅ IDs Copied? Continue to Step 2.5**

---

### □ Step 2.5: Enable Localhost (1 minute - Important!)

Since Tawk.to rejected localhost during signup, allow it now:

1. In **Administration**, click **"Properties"**
2. Click on your property (SKAARVI)
3. Enable one of these options:
   - ✅ **"Always allow widget to be displayed"**
   - OR enable **"Allow widget on all domains"**
   - OR add `localhost` and `127.0.0.1` to allowed domains
4. Save settings

**This lets the widget work on localhost for testing!**

**✅ Localhost Enabled? Continue to Step 3**

---

### □ Step 3: Update Component (1 minute)
1. Open file: `components/TawkToChat.js`
2. Find lines 29-30:
   ```javascript
   const PROPERTY_ID = 'YOUR_PROPERTY_ID';
   const WIDGET_ID = 'YOUR_WIDGET_ID';
   ```
3. Replace with your IDs:
   ```javascript
   const PROPERTY_ID = 'paste_property_id_here';
   const WIDGET_ID = 'paste_widget_id_here';
   ```
4. Save the file (Ctrl+S)

**✅ Component Updated? Continue to Step 4**

---

### □ Step 4: Test (1 minute)
1. Start dev server:
   ```bash
   npm run dev
   ```
2. Open browser: http://localhost:3000
3. Login with a customer account
4. Look for chat widget (bottom-right corner)
5. Click widget and send test message: "Hello, testing!"
6. Check Tawk.to dashboard for the message

**✅ Widget Working? Setup Complete! 🎉**

---

## 🤖 Optional: AI Automation (5 minutes)

### □ Add After-Hours Message
1. Tawk.to Dashboard → **Automation** → **Triggers**
2. Click **"Add Trigger"**
3. Configure:
   - **Name**: After Hours Response
   - **Condition**: Outside business hours
   - **Action**: Send message
   - **Message**: 
     ```
     Hi! Our team is offline right now. We're available Mon-Fri, 9AM-6PM IST. 
     Please leave your message and we'll respond soon!
     ```
4. Save trigger

---

### □ Add Order Tracking Response
1. Click **"Add Trigger"**
2. Configure:
   - **Name**: Order Tracking Help
   - **Condition**: Message contains "order" OR "track" OR "delivery"
   - **Action**: Send message
   - **Message**:
     ```
     I can help you track your order! 
     Please provide your Order ID or visit the Orders page in your dashboard.
     ```
3. Save trigger

---

### □ Set Business Hours
1. Tawk.to Dashboard → **Settings** → **Business Hours**
2. Configure:
   - **Monday-Friday**: 9:00 AM - 6:00 PM
   - **Timezone**: Asia/Kolkata (IST)
   - **Saturday-Sunday**: Closed
3. Save settings

---

## 🎨 Optional: Customize Widget (3 minutes)

### □ Brand Colors
1. Dashboard → **Channels** → **Chat Widget** → **Widget Appearance**
2. Set **Primary Color**: `#0066cc` (or your brand color)
3. Set **Bubble Text**: "Need Help?"
4. Save changes

---

### □ Welcome Message
1. In Widget Appearance section
2. Set **Welcome Message**: 
   ```
   Hi there! 👋 Welcome to SKAARVI. 
   How can we help you today?
   ```
3. Save changes

---

## 👥 Optional: Add Team Members (2 minutes)

### □ Invite Agents
1. Dashboard → **Administration** → **Agents**
2. Click **"Add Agent"**
3. Enter team member emails:
   - Agent 1: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
   - Agent 2: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
4. Assign role: **Agent** (can chat) or **Admin** (full access)
5. Send invitations

---

## 📱 Optional: Mobile Apps (1 minute)

### □ Install for iOS
- Search App Store: "Tawk.to"
- Install and login with same credentials

### □ Install for Android
- Search Play Store: "Tawk.to"  
- Install and login with same credentials

**Benefit**: Respond to chats on the go!

---

## ✅ Final Verification

Check all that apply:

- [ ] Tawk.to account created and verified
- [ ] Property ID and Widget ID obtained
- [ ] Component configured with correct IDs
- [ ] Dev server running without errors
- [ ] Chat widget visible when logged in as customer
- [ ] Test message sent and received in Tawk.to dashboard
- [ ] Widget hidden when not logged in (expected behavior)
- [ ] Mobile responsive (tested on phone)

---

## 🎯 Post-Setup (This Week)

- [ ] Add 5+ automated responses for common questions
- [ ] Create agent shortcuts (#welcome, #hours, etc.)
- [ ] Set up chat routing rules
- [ ] Add team members (if applicable)
- [ ] Install mobile apps
- [ ] Create knowledge base articles (optional)
- [ ] Configure email forwarding for missed chats

---

## 📊 Success Metrics (Monitor Weekly)

Track these in Tawk.to Dashboard → Reports:

- **Chat Volume**: How many chats per day?
- **Response Time**: Average time to first response?
- **Satisfaction**: Customer rating after chats?
- **AI Effectiveness**: % of queries handled by automation?
- **Peak Hours**: When do most chats occur?

**Goal**: <2 min response time, >85% satisfaction

---

## 🆘 Troubleshooting Quick Fixes

### Widget not showing?
```javascript
// 1. Check browser console (F12) for errors
// 2. Verify IDs in TawkToChat.js are correct
// 3. Hard reload page (Ctrl+Shift+R)
// 4. Check user is logged in: localStorage.getItem('token')
```

### Widget but no user data?
```javascript
// Check Redux store in browser console:
store.getState().auth.user
// Should show: { id, name, email, role, ... }
```

### Need help?
- 📖 Read: `docs/TAWKTO-CHATBOT-SETUP.md`
- 💬 Contact: support@tawk.to
- 🌐 Help: https://help.tawk.to/

---

## 📞 Quick Reference

**Tawk.to Dashboard**: https://dashboard.tawk.to/  
**Component File**: `components/TawkToChat.js`  
**Full Setup Guide**: `docs/TAWKTO-CHATBOT-SETUP.md`  
**Quick Reference**: `docs/TAWKTO-QUICK-REFERENCE.md`

---

## 🎉 Congratulations!

Once all checkboxes above are complete, your chatbot is **fully operational**!

Your customers can now:
- ✅ Get instant AI-powered responses
- ✅ Chat with your support team
- ✅ Track orders and get help
- ✅ Enjoy 24/7 assistance

**Total Time Invested**: ~10-15 minutes  
**Annual Cost**: $0 (completely free!)  
**Value Added**: Priceless customer satisfaction 🚀

---

**Questions?** Check the comprehensive guide: `docs/TAWKTO-CHATBOT-SETUP.md`

**Last Updated**: 2026-07-04  
**Status**: Ready to Configure ⚡
