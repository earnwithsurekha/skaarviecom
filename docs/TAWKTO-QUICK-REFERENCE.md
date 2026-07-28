# Tawk.to Quick Reference Card

## 🔑 Essential IDs
```javascript
// In: components/TawkToChat.js (lines 29-30)
const PROPERTY_ID = 'YOUR_PROPERTY_ID';  // From tawk.to dashboard
const WIDGET_ID = 'YOUR_WIDGET_ID';      // From tawk.to dashboard
```

## 📍 Where to Find IDs
1. Login to [tawk.to](https://www.tawk.to/)
2. **Administration** → **Channels** → **Chat Widget**
3. View the embed code
4. Extract IDs from: `https://embed.tawk.to/PROPERTY_ID/WIDGET_ID`

---

## 🤖 Quick AI Automation Examples

### 1. After Hours Response
```
Trigger: Outside business hours (Mon-Fri 9AM-6PM)
Message: "Hi! Our team is offline. We're available Mon-Fri, 9AM-6PM IST. Leave a message!"
```

### 2. Order Tracking
```
Trigger: Message contains "order" OR "track" OR "delivery"
Message: "I can help you track your order! Please provide your Order ID or visit the Orders page in your dashboard."
```

### 3. Payment Issues
```
Trigger: Message contains "payment" OR "refund" OR "charge"
Message: "I'll connect you with our payments team. Meanwhile, please have your Order ID ready."
→ Tag: payment-issue
→ Assign to: Payment Support Team
```

### 4. New Customer Welcome
```
Trigger: First chat from visitor
Message: "Welcome to SKAARVI! 👋 I'm here to help with orders, products, or any questions. How can I assist you today?"
```

### 5. High-Value Customer
```
Trigger: User tag contains "reseller" or "wholesale"
Message: "Hello! Thanks for contacting us. Let me connect you with your dedicated account manager."
→ Priority: High
→ Assign to: Account Manager Team
```

---

## 🎨 Recommended Widget Settings

### Appearance
- **Color**: #0066cc (or your brand color)
- **Position**: Bottom right, 20px from edges
- **Bubble Text**: "Need Help?"
- **Welcome Message**: "Hi there! 👋 How can we help?"

### Behavior
- ✅ Show widget on all pages (for logged-in customers)
- ✅ Enable sound notifications
- ✅ Show agent photos
- ✅ Enable typing indicator
- ⬜ Require pre-chat form (optional)
- ✅ Show offline form when no agents available

---

## ⚡ Essential Shortcuts (for Agents)

Create these in: **Dashboard** → **Shortcuts**

```
#hi       → Hi! Thanks for contacting SKAARVI. How can I help you today?
#order    → To check your order, please provide your Order ID.
#ship     → Standard shipping: 3-7 days. Express: 1-3 days (select cities).
#return   → Returns accepted within 7 days. Product must be unused, original packaging.
#payment  → We accept all cards, UPI, net banking, and wallets.
#hours    → Support available Monday-Friday, 9 AM - 6 PM IST.
#escalate → Let me connect you with a specialist who can help better.
#thanks   → Thank you for contacting SKAARVI! Is there anything else I can help with?
```

---

## 📊 Key Metrics to Monitor

Access: **Reports** in Tawk.to Dashboard

### Daily Check (2 minutes)
- Active chats right now
- Missed chats in last 24 hours
- Average response time
- Customer satisfaction score

### Weekly Review (10 minutes)
- Total chats this week
- Most common topics/tags
- Agent performance comparison
- Peak traffic hours

### Monthly Analysis (30 minutes)
- Trend analysis (increasing/decreasing volume)
- Automation effectiveness (% handled by AI)
- Customer satisfaction trends
- Knowledge base article views

---

## 🚨 Troubleshooting (1-minute fixes)

### Widget Not Showing
```bash
# Check browser console (F12)
# Look for: "Tawk.to Chat loaded successfully"
# If missing, verify IDs in TawkToChat.js
```

### Wrong User Data
```javascript
// Check Redux store in browser console:
console.log(store.getState().auth.user)
// Should show: { id, name, email, role, ... }
```

### Widget Conflicts with Other Elements
```css
/* Add to globals.css if needed */
#tawk-bubble {
  bottom: 80px !important; /* Adjust to avoid footer */
  z-index: 9999 !important;
}
```

---

## 🔄 Customer Journey Triggers

### On Product Page (>30 seconds)
```
"Looking at [Product Name]? Any questions about features or pricing?"
```

### On Checkout Page (>20 seconds)
```
"Need help completing your order? I'm here if you have questions!"
```

### On Cart Abandonment
```
"I noticed you have items in your cart. Any questions before checkout?"
```

### After Order Placed
```
"Thanks for your order! Your Order ID is #12345. Track it in your dashboard."
```

---

## 📱 Mobile App Setup (for Agents)

### iOS
1. Download: [Tawk.to iOS App](https://apps.apple.com/app/tawk-to/id1011724397)
2. Login with your credentials
3. Enable push notifications

### Android
1. Download: [Tawk.to Android App](https://play.google.com/store/apps/details?id=com.tawk.copilot)
2. Login with your credentials
3. Enable push notifications

---

## 🎯 Quick Customization Guide

### Change Widget Color
```
Dashboard → Widget → Appearance → Primary Color → #0066cc
```

### Add Custom Fields
```
Dashboard → Widget → Pre-Chat Form → Add Field
- Order ID (text, optional)
- Issue Type (dropdown, required)
- Message (textarea, required)
```

### Set Business Hours
```
Dashboard → Settings → Business Hours
- Monday-Friday: 9:00 AM - 6:00 PM (IST)
- Saturday-Sunday: Closed
```

### Enable Email Notifications
```
Dashboard → Settings → Notifications
- ✅ New chat notification
- ✅ Missed chat notification
- ✅ Email: support@skaarvi.com
```

---

## 🔐 Privacy Compliance

### GDPR Settings
```
Dashboard → Settings → Privacy → GDPR
- ✅ Enable GDPR compliance
- Data retention: 12 months
- ✅ Show privacy policy link
```

### Data Collected (Customer-Safe)
- ✅ Name, Email, User ID
- ✅ Role (customer/reseller/manufacturer)
- ✅ Business name, Phone
- ❌ Passwords (never sent)
- ❌ Payment details (never sent)

---

## ⏱️ Setup Timeline

### Day 1 (15 minutes)
- ✅ Create Tawk.to account
- ✅ Get Property ID & Widget ID
- ✅ Update TawkToChat.js
- ✅ Test basic chat

### Day 2 (30 minutes)
- ✅ Customize widget appearance
- ✅ Create 5 automated responses
- ✅ Set business hours
- ✅ Add 1-2 team members

### Day 3 (20 minutes)
- ✅ Create shortcuts for agents
- ✅ Set up chat routing
- ✅ Test mobile experience

### Week 1 (ongoing)
- ✅ Monitor chat volume
- ✅ Refine automated responses
- ✅ Train team on shortcuts
- ✅ Review customer feedback

---

## 💬 Pro Tips

1. **Respond Fast**: First response <2 minutes increases satisfaction by 60%
2. **Use Emojis**: Makes chat feel more friendly (👋 😊 ✅ 🎉)
3. **Personalize**: Always use customer's name
4. **Be Proactive**: Offer help before they ask
5. **Follow Up**: Send chat transcript via email
6. **Track Tags**: Tag chats for better analytics (order-issue, product-query, etc.)
7. **Update Weekly**: Review and add new automated responses weekly
8. **Mobile First**: Most customers use mobile - test thoroughly

---

## 🆘 Emergency Fixes

### Chat Widget Disappeared
```javascript
// Temporary fix in browser console:
window.Tawk_API.showWidget();
```

### Reset Widget
```javascript
// In browser console:
window.Tawk_API.endChat();
window.location.reload();
```

### Force User Update
```javascript
// In browser console:
window.Tawk_API.setAttributes({
  name: 'Customer Name',
  email: 'customer@email.com'
});
```

---

## 📞 Support Contacts

- **Tawk.to Help**: https://help.tawk.to/
- **Live Chat**: Available on tawk.to website
- **Email**: support@tawk.to
- **Response Time**: Usually <24 hours

---

**Last Updated**: 2026-07-04
**Integration Version**: 1.0
**Component**: `components/TawkToChat.js`
