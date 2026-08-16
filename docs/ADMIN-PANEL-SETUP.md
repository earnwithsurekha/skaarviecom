# Admin Panel Setup Instructions

## 1. Create Admin User

Run this SQL command in MySQL to create an admin user:

```sql
INSERT INTO users (id, email, role, is_verified, is_active, created_at, updated_at) 
VALUES (
  UUID(), 
  'admin@skaarvi.com', 
  'admin', 
  true, 
  true, 
  NOW(), 
  NOW()
);
```

## 2. Login

1. Go to http://localhost:3000/login
2. Enter email: `admin@skaarvi.com`
3. Click "Login" (OTP is bypassed)
4. You will be redirected to `/admin/dashboard`

## 3. Admin Panel Features

### Dashboard (`/admin/dashboard`)
- View statistics: Total manufacturers, Pending, Approved, Rejected
- See recent registrations
- Quick action button to view pending approvals

### Manufacturers List (`/admin/manufacturers`)
- View all manufacturers
- Filter by status: All, Pending, Approved, Rejected
- Search by company name, brand name, or contact person
- Click "View Details" to review individual manufacturer

### Manufacturer Detail (`/admin/manufacturers/[id]`)
- View complete company information
- View banking details
- Preview uploaded documents (click thumbnails to view full size):
  - Company Logo
  - PAN Card
  - Cancelled Cheque
  - GST Certificate (if provided)
- **Approve**: Click green "Approve" button → Confirm → Manufacturer approved
- **Reject**: Click red "Reject" button → Enter reason (min 10 chars) → Manufacturer rejected

## 4. Document Access

Documents are accessed via: `http://localhost:5000/uploads/{userId}/{email}/{subfolder}/{filename}`

Example: `http://localhost:5000/uploads/abc123-uuid/arunsai535@gmail.com/logo/logo.png`

## 5. Testing Approval Flow

1. Register a new manufacturer at `/register`
2. Login as admin
3. Go to `/admin/manufacturers` - see new manufacturer with "Pending" status
4. Click "View Details"
5. Review all information and documents
6. Click "Approve"
7. Confirm approval
8. Manufacturer status changes to "Approved"
9. Login as that manufacturer - they can now access manufacturer dashboard

## 6. After Rejection

When a manufacturer is rejected:
- Their status changes to "Rejected"
- The rejection reason is stored in the database
- They see the rejection message on next login
- Consider implementing: Allow re-registration or edit-and-resubmit functionality

## 7. Security Notes

- Admin routes protected by `useAdminAuth()` hook
- Backend endpoints protected by `adminOnly` middleware
- All actions require valid JWT token
- `approved_by` field automatically set to admin's user ID
- `approved_at` timestamp automatically set on approval/rejection
