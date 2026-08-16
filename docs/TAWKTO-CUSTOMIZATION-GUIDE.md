# Tawk.to Widget Customization Guide

## 🎨 Change Widget Color to Blue

### Method 1: Dashboard Settings (Recommended)

1. **Login to Tawk.to Dashboard**: https://dashboard.tawk.to/

2. **Navigate to Widget Appearance**:
   - Click **"Administration"** (⚙️ gear icon)
   - Go to **"Channels"** → **"Chat Widget"**
   - Click **"Widget Appearance"** tab

3. **Set Blue Color**:
   - Find **"Primary Color"** setting
   - Click the color picker
   - Enter: `#0066cc` (or choose your preferred blue shade)
   - Alternatively use: `#007bff`, `#0056b3`, `#1e90ff`

4. **Apply Settings**:
   - Click **"Save"** or **"Update"**
   - Refresh your website to see changes

### Method 2: Using Custom CSS (Already Added)

The component has been updated with custom blue styling. Just refresh your browser to see it!

---

## 🏷️ Remove "Powered by Tawk.to" Branding

The "Powered by Tawk.to" text appears in the free plan. Here are your options:

### Option 1: Hide with CSS (Free)

Add this to your `globals.css`:

```css
/* Hide Tawk.to branding */
iframe#tawk_chat_widget {
  /* Note: The branding is inside an iframe, so CSS can't fully hide it */
}

/* Alternative: Position widget to minimize branding visibility */
#tawk-bubble {
  bottom: 20px !important;
  right: 20px !important;
}
```

**⚠️ Note**: The branding is inside an iframe with cross-origin restrictions, so CSS cannot fully hide it.

### Option 2: Upgrade to Remove Branding (Paid)

1. **Go to Tawk.to Dashboard** → **"Billing"**
2. **Select "Remove Branding" Add-on**:
   - Cost: ~$19/month (check current pricing)
   - Completely removes "Powered by Tawk.to" text
   - Adds white-label capabilities

### Option 3: Accept the Branding (Free)

The "Powered by Tawk.to" is small and unobtrusive. Most users don't mind it for a free service.

**Benefits of keeping it**:
- ✅ Completely free forever
- ✅ Unlimited chats and agents
- ✅ All features included
- ✅ Shows transparency (users trust known chat providers)

---

## 🎨 Additional Customization Options

### Widget Position

```javascript
// In Tawk.to Dashboard → Widget → Settings
Position: Bottom Right (recommended)
Offset: 20px from edges
```

### Welcome Message

```
Dashboard → Widget → Settings → Welcome Message
Text: "Hi! 👋 How can we help you today?"
```

### Bubble Text

```
Dashboard → Widget → Appearance → Bubble Text
Text: "Need Help?" or "Chat with us"
```

### Chat Header

```
Dashboard → Widget → Appearance → Widget Header
Text: "SKAARVI Support"
Show agent photo: Yes
```

### Colors You Can Customize

| Element | Setting Location | Recommended Blue |
|---------|-----------------|------------------|
| Primary Color | Widget Appearance | `#0066cc` |
| Chat Button | Widget Appearance | `#0066cc` |
| Header Background | Widget Appearance | `#0066cc` |
| Link Color | Widget Appearance | `#0056b3` |

---

## 🚀 Apply Changes Immediately

After making changes in Tawk.to dashboard:

1. **Save settings** in dashboard
2. **Wait 10-30 seconds** for changes to propagate
3. **Hard refresh** your website: `Ctrl + Shift + R`
4. Changes should be visible immediately

---

## 💡 Pro Tips

### Best Blue Colors for Professional Look

```css
Light Blue:   #4da6ff
Medium Blue:  #0066cc (recommended)
Dark Blue:    #003d7a
Royal Blue:   #0056b3
Sky Blue:     #1e90ff
```

### Match Your Brand

Use your exact brand color:
1. Get your brand's hex color code
2. Enter it in Tawk.to dashboard
3. Widget will match your website perfectly

### Mobile Optimization

```
Dashboard → Widget → Settings → Mobile
- Enable mobile optimization: ✅
- Full-screen on mobile: ✅
- Position: Bottom
```

---

## 🔧 Troubleshooting

### Color not changing?
1. Clear browser cache
2. Check dashboard settings were saved
3. Wait 1-2 minutes for CDN propagation
4. Hard refresh (Ctrl+Shift+R)

### Still showing old color?
1. Check if multiple properties exist
2. Verify you're editing the correct widget
3. Ensure no CSS conflicts in your app

### Branding still visible?
- This is normal for free plan
- Consider upgrading for white-label ($19/mo)
- Or accept it as part of free service

---

## 📱 Preview Your Changes

Test on different devices:
- ✅ Desktop browsers (Chrome, Firefox, Safari)
- ✅ Mobile phones (iOS, Android)
- ✅ Tablets
- ✅ Different screen sizes

---

## ✨ Final Result

After customization, your chat widget will have:
- ✅ Blue color matching your brand
- ✅ Custom welcome message
- ✅ Professional appearance
- ✅ Mobile-optimized
- ⚠️ Small "Powered by Tawk.to" text (free plan)

**To completely remove branding**: Consider the $19/mo upgrade if budget allows.

---

**Questions?** Check the main setup guide: `docs/TAWKTO-CHATBOT-SETUP.md`
