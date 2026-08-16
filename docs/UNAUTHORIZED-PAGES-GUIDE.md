# Unauthorized Access Pages - Implementation Guide

## Overview
Created unique unauthorized access pages for three user roles:
- **Admin** - `/unauthorized/admin`
- **Manufacturer** - `/unauthorized/manufacturer`
- **Customer** - `/unauthorized/customer`

## Features Implemented

### 1. Role-Specific Unauthorized Pages

#### Admin Unauthorized Page (`/unauthorized/admin`)
- **Icon**: Red shield with lock
- **Message**: "Admin Access Required"
- **Actions**:
  - Login as Admin (if not logged in)
  - Login with Different Account
  - Go Back (if already logged in)
  - Return to Homepage
- **Redirect Logic**: If user is already admin, redirects to `/admin/dashboard`

#### Manufacturer Unauthorized Page (`/unauthorized/manufacturer`)
- **Icon**: Yellow factory with lock
- **Message**: "Manufacturer Access Required"
- **Actions**:
  - Login as Manufacturer (if not logged in)
  - Register as Manufacturer
  - Login with Different Account
  - Go Back (if already logged in)
  - Return to Homepage
- **Redirect Logic**: If user is already manufacturer, redirects to `/manufacturer/dashboard`

#### Customer Unauthorized Page (`/unauthorized/customer`)
- **Icon**: Blue shopping bag with lock
- **Message**: "Customer Login Required"
- **Actions**:
  - Login as Customer (if not logged in)
  - Create Customer Account
  - Login with Different Account
  - Go Back (if already logged in)
  - Return to Homepage
- **Benefits Display**: Shows account benefits (track orders, wishlist, faster checkout, exclusive deals)
- **Redirect Logic**: If user is already customer, redirects to homepage

### 2. Updated Authentication Hooks

#### Admin Authentication (`lib/adminAuth.js`)
```javascript
// Now redirects to /unauthorized/admin instead of /login
if (!token || !user || user.role !== 'admin') {
  router.push('/unauthorized/admin');
}
```

#### Manufacturer Authentication (`app/manufacturer/layout.js`)
```javascript
// Now redirects to /unauthorized/manufacturer
if (user && user.role !== 'manufacturer') {
  router.push('/unauthorized/manufacturer');
}
```

#### New: Customer Authentication (`lib/customerAuth.js`)
```javascript
// New hook for customer-protected routes
export function useCustomerAuth() {
  // Redirects to /unauthorized/customer if not authenticated as customer
}
```

## Usage Examples

### Protecting an Admin Route
```javascript
'use client';
import { useAdminAuth } from '@/lib/adminAuth';

export default function AdminPage() {
  const { user } = useAdminAuth(); // Automatically redirects if not admin
  
  if (!user) return null;
  
  return <div>Admin Content</div>;
}
```

### Protecting a Manufacturer Route
```javascript
// Already implemented in /app/manufacturer/layout.js
// All routes under /manufacturer are automatically protected
```

### Protecting a Customer Route
```javascript
'use client';
import { useCustomerAuth } from '@/lib/customerAuth';

export default function CustomerProfilePage() {
  const { user } = useCustomerAuth(); // Automatically redirects if not customer
  
  if (!user) return null;
  
  return <div>Customer Profile</div>;
}
```

## Design Features

All unauthorized pages include:
- **Responsive Design**: Mobile-friendly layouts
- **Theme Support**: Uses CSS variables for light/dark mode
- **Smooth Animations**: Scale transitions on buttons, blur effects
- **Role-Specific Icons**: Different colors and icons for each role
  - Admin: Red (error color)
  - Manufacturer: Yellow/Orange (warning color)
  - Customer: Blue (info color)
- **User Context**: Shows current user info if logged in with wrong role
- **Multiple CTAs**: Clear action buttons for different scenarios
- **Helpful Information**: Contact details and additional resources

## Testing

To test the unauthorized pages:

1. **Admin Page**: 
   - Visit `/admin/dashboard` without logging in → see `/unauthorized/admin`
   - Login as manufacturer → visit `/admin/dashboard` → see `/unauthorized/admin`

2. **Manufacturer Page**:
   - Visit `/manufacturer/dashboard` without logging in → see `/unauthorized/manufacturer`
   - Login as admin → visit `/manufacturer/dashboard` → see `/unauthorized/manufacturer`

3. **Customer Page**:
   - Create a customer-protected route
   - Use `useCustomerAuth()` hook
   - Visit without logging in → see `/unauthorized/customer`

## Files Created/Modified

### New Files:
- `app/unauthorized/admin/page.js`
- `app/unauthorized/manufacturer/page.js`
- `app/unauthorized/customer/page.js`
- `lib/customerAuth.js`

### Modified Files:
- `lib/adminAuth.js` - Updated redirect path
- `app/manufacturer/layout.js` - Updated redirect path

## Next Steps (Optional)

1. **Add Middleware**: Create Next.js middleware for server-side route protection
2. **Customer Routes**: Implement customer dashboard/profile pages
3. **Email Notifications**: Notify admins when unauthorized access attempts occur
4. **Analytics**: Track unauthorized access attempts for security monitoring
5. **Custom Error Codes**: Add specific error codes for different scenarios
