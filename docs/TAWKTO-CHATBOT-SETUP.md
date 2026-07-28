# Tawk.to Chatbot Integration Guide

This guide will help you set up the free Tawk.to chatbot with AI + live chat capabilities for your SKAARVI application.

## ✅ What's Included

- **Free Forever**: Tawk.to is completely free with unlimited chats
- **Hybrid AI + Live Chat**: AI handles common queries, escalate to human agents when needed
- **Customer-Only Access**: Chatbot only appears for logged-in customers
- **User Context**: Automatically passes customer information to agents
- **Theme Compatible**: Works seamlessly with your app's theme
- **Mobile Responsive**: Works on all devices

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Tawk.to Account

1. Go to [https://www.tawk.to/](https://www.tawk.to/)
2. Click **"Sign Up Free"**
3. Fill in your details:
   - Your name
   - Email address
   - Password
4. **Add Property Details** (you'll be prompted after signup):
   - **Property Name**: Enter `SKAARVI` (or your business name)
   - **Site URL**: Enter a valid domain (localhost not accepted here)
     - If you have a domain: `https://yourdomain.com`
     - If testing only: `https://example.com` (temporary placeholder)
     
   **⚠️ Important Note**: Tawk.to rejects localhost during initial setup. Don't worry - after creating your account, you'll configure it to work on localhost for testing. The widget will work regardless of this URL!
   
5. Click **"Add Property"**
6. Verify your email address (if prompted)

### Step 2: Get Your Widget IDs

1. After login, you'll be in the **Dashboard**
2. Click **"Administration"** (gear icon) in the top menu
3. Go to **"Channels"** → **"Chat Widget"**
4. You'll see your widget code that looks like:
   ```html
   <script type="text/javascript">
   var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
   (function(){
   var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
   s1.async=true;
   s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
   ...
   ```
5. Copy the **PROPERTY_ID** and **WIDGET_ID** from the URL

### Step 2.5: Enable Localhost for Testing (Important!)

Since Tawk.to rejected localhost during signup, you need to allow it now:

1. In **Administration**, go to **"Properties"**
2. Click on your property (SKAARVI)
3. Find **"Allowed Domains"** or **"Widget Settings"** section
4. Look for **"Always allow widget to be displayed"** and **enable it** ✅
   
   OR add these to allowed domains:
   - `localhost`
   - `127.0.0.1`
   
5. **Alternatively**, go to **"Widget"** → **"Settings"** → **"Advanced"**
6. Enable **"Allow widget to load on all domains"** ✅
7. Save changes

**This allows the widget to work on localhost for testing!**

### Step 3: Configure the Component

1. Open `components/TawkToChat.js`
2. Find lines 29-30:
   ```javascript
   const PROPERTY_ID = 'YOUR_PROPERTY_ID'; // Get from tawk.to dashboard
   const WIDGET_ID = 'YOUR_WIDGET_ID';     // Get from tawk.to dashboard
   ```
3. Replace with your actual IDs:
   ```javascript
   const PROPERTY_ID = '6abc123def456789'; // Your actual Property ID
   const WIDGET_ID = 'xyz789abc123';       // Your actual Widget ID
   ```
4. Save the file

### Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Log in as a customer
3. You should see the Tawk.to chat widget in the bottom-right corner
4. Click it and send a test message
5. Check your Tawk.to dashboard to see the message

---

## 🤖 Enable AI Automation

Tawk.to offers free AI automation to handle common queries before escalating to human agents.

### Setting Up AI Responses

1. In Tawk.to dashboard, go to **"Automation"** → **"Triggers"**
2. Click **"Add Trigger"**
3. Configure automated responses for common questions:

#### Example 1: Business Hours
```
Trigger: When chat starts outside business hours
Action: Send message
Message: "Hi! Thanks for contacting SKAARVI. Our support team is offline right now. We're available Monday-Friday, 9 AM - 6 PM IST. Please leave your message and we'll respond as soon as possible."
```

#### Example 2: Order Status
```
Trigger: When visitor types "order status" or "track order"
Action: Send message
Message: "To check your order status, please visit your Orders page in the dashboard or provide your order ID, and I'll help you track it."
```

#### Example 3: Return Policy
```
Trigger: When visitor types "return" or "refund"
Action: Send message
Message: "Our return policy allows returns within 7 days of delivery. Please ensure the product is unused and in original packaging. Would you like me to connect you with a support agent to process your return?"
```

### Setting Up Chat Routing

1. Go to **"Automation"** → **"Routing"**
2. Configure routing rules:
   - Priority customers (high-value resellers)
   - New customers
   - Technical support queries

### Setting Up Shortcuts (Quick Responses)

1. Go to **"Shortcuts"**
2. Add common responses for your agents:

**Example Shortcuts:**
```
#welcome - Welcome to SKAARVI! How can I help you today?
#hours - Our support hours are Monday-Friday, 9 AM - 6 PM IST
#shipping - Standard shipping takes 3-7 business days. Express shipping is available in select cities.
#payment - We accept all major credit/debit cards, UPI, net banking, and wallets.
#wholesale - For wholesale pricing, please contact your account manager or email wholesale@skaarvi.com
```

---

## 🎨 Customize Widget Appearance

### Widget Customization

1. Go to **"Administration"** → **"Channels"** → **"Chat Widget"**
2. Click on **"Widget Appearance"**
3. Customize:
   - **Widget Color**: Match your brand color (#0066cc or your theme color)
   - **Widget Position**: Bottom right (recommended)
   - **Welcome Message**: "Hi! How can we help you today?"
   - **Agent Display**: Show agent photo and name

### Pre-Chat Form (Optional)

1. Enable pre-chat form to collect information:
   - Customer Order ID
   - Issue Category (Orders, Products, Payments, Technical)
   - Priority Level

2. Go to **"Pre-Chat Form"** settings
3. Add custom fields:
   ```
   - Order ID (optional)
   - Issue Type (dropdown: Order Issue, Product Query, Payment Issue, Other)
   - Message (required)
   ```

---

## 👥 Add Team Members (If needed)

1. Go to **"Administration"** → **"Agents"**
2. Click **"Add Agent"**
3. Enter email addresses of team members
4. Assign roles:
   - **Administrator**: Full access
   - **Agent**: Can chat with customers
   - **Monitor**: Can only view chats

---

## 📊 Monitor Performance

### Dashboard Metrics

Access your dashboard to view:
- **Active Chats**: Currently ongoing conversations
- **Chat History**: Past conversations with search
- **Response Time**: Average time to first response
- **Customer Satisfaction**: Ratings from customers
- **Popular Topics**: Most common queries

### Reports

1. Go to **"Reports"**
2. Available reports:
   - **Chat Volume**: Daily/weekly chat statistics
   - **Agent Performance**: Response times per agent
   - **Customer Satisfaction**: Rating trends
   - **Tag Analysis**: Common issues/topics

---

## 🔧 Advanced Features

### 1. Knowledge Base Integration

1. Go to **"Knowledge Base"** → **"Add Article"**
2. Create help articles for:
   - How to place an order
   - Payment methods
   - Return process
   - Product categories
   - Wholesale pricing
3. These articles can be suggested automatically during chats

### 2. Mobile App Integration

Tawk.to provides mobile apps for agents:
- [iOS App](https://apps.apple.com/app/tawk-to/id1011724397)
- [Android App](https://play.google.com/store/apps/details?id=com.tawk.copilot)

### 3. Email Integration

Forward missed chats to email:
1. Go to **"Settings"** → **"Email Forwarding"**
2. Enable **"Send missed chats via email"**
3. Add support@skaarvi.com

### 4. Visitor Monitoring

See who's browsing your site in real-time:
1. Go to **"Dashboard"** → **"Visitors"**
2. View:
   - Current page they're on
   - Time on site
   - Location
   - Browser/device
3. Proactively chat with customers who need help

---

## 🎯 Best Practices

### For AI Automation

1. **Start Simple**: Begin with 3-5 basic automated responses
2. **Monitor & Improve**: Review chat logs weekly to identify common questions
3. **Update Triggers**: Add new triggers based on customer queries
4. **Test Thoroughly**: Test all automated responses before enabling

### For Live Chat

1. **Set Response Time Goals**: Aim for <2 minutes first response
2. **Use Shortcuts**: Save time with pre-written responses
3. **Transfer Chats**: Route complex issues to specialized agents
4. **Follow Up**: Send transcript via email after chat ends

### For Customer Experience

1. **Personalization**: Greet customers by name (auto-populated from user data)
2. **Proactive Chat**: Offer help on checkout/product pages
3. **Business Hours**: Set clear expectations for offline hours
4. **Mobile Friendly**: Test chat experience on mobile devices

---

## 🐛 Troubleshooting

### Widget Not Appearing

1. **Check IDs**: Ensure Property ID and Widget ID are correct
2. **Check Login**: Widget only shows for logged-in customers
3. **Browser Console**: Check for JavaScript errors (F12)
4. **Cache**: Clear browser cache and hard reload (Ctrl+Shift+R)

### User Data Not Showing

1. Ensure user is properly logged in
2. Check Redux store contains user data
3. Verify `updateTawkAttributes()` function is called
4. Check browser console for errors

### Widget in Wrong Position

1. Go to Tawk.to dashboard → Widget Appearance
2. Adjust position settings
3. Or modify CSS in your application:
   ```css
   #tawk-bubble { bottom: 80px !important; }
   ```

---

## 📱 Testing Checklist

- [ ] Widget appears for logged-in customers
- [ ] Widget hidden for non-logged-in users
- [ ] Customer name and email auto-populated
- [ ] User role tags added correctly
- [ ] Chat messages sent successfully
- [ ] Agent receives notifications
- [ ] Mobile responsive (test on phone)
- [ ] Works in dark/light theme
- [ ] Automated responses triggering correctly
- [ ] Offline message functionality working

---

## 🔒 Security & Privacy

### Data Handling

- User data is sent securely to Tawk.to via HTTPS
- Only customer ID, name, email, and role are shared
- No sensitive information (passwords, payment details) is transmitted
- Compliant with GDPR and data protection regulations

### User Privacy Settings

In Tawk.to dashboard:
1. Go to **"Settings"** → **"Privacy"**
2. Configure:
   - Data retention period
   - GDPR compliance settings
   - Cookie consent (if required)

---

## 📞 Support

### Tawk.to Support
- Help Center: [https://help.tawk.to/](https://help.tawk.to/)
- Email: support@tawk.to
- Live Chat: Available on their website

### Implementation Support
If you face issues with the integration:
1. Check the browser console for errors
2. Review the component code in `components/TawkToChat.js`
3. Verify Redux store structure matches expected format

---

## 🎉 Next Steps

1. ✅ Complete the 4-step setup above
2. 📝 Create 5-10 common automated responses
3. 👥 Add team members (if applicable)
4. 📊 Set up your knowledge base
5. 🎨 Customize widget appearance
6. 📱 Install mobile apps for on-the-go support
7. 📈 Monitor and optimize based on analytics

---

## 💡 Pro Tips

1. **Peak Hours**: Schedule more agents during peak shopping hours
2. **Holidays**: Update automated messages for holidays/special sales
3. **Feedback**: Ask for rating after each chat to improve service
4. **Integration**: Connect Tawk.to with CRM tools if needed
5. **Training**: Train agents on product knowledge and common issues

---

## ⚡ Alternative Solutions (If Needed)

If Tawk.to doesn't meet your needs, here are alternatives:

| Feature | Tawk.to | Crisp | Tidio |
|---------|---------|-------|-------|
| Price | Free forever | Free (2 operators) | Free (50 chats/month) |
| AI Chat | ✅ Yes | ✅ Yes | ✅ Yes |
| Live Chat | ✅ Unlimited | ✅ Unlimited | ⚠️ Limited |
| Mobile Apps | ✅ Yes | ✅ Yes | ✅ Yes |
| Team Members | ✅ Unlimited | ⚠️ Max 2 | ⚠️ Max 3 |
| Customization | ✅ Full | ✅ Full | ✅ Full |

**Recommendation**: Stick with Tawk.to - it's the best free option with no limitations!

---

## 📝 Summary

You now have a fully functional, free chatbot with:
- ✅ AI automation for common queries
- ✅ Live chat for complex issues
- ✅ Customer authentication integration
- ✅ Mobile support
- ✅ Team collaboration features
- ✅ Analytics and reporting

Happy chatting! 🎉
