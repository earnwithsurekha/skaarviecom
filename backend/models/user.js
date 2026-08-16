const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(15),
    unique: true,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manufacturer', 'reseller', 'customer'),
    defaultValue: 'manufacturer',
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Manufacturer Model
const Manufacturer = sequelize.define('Manufacturer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'user_id',
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'company_name',
  },
  brandName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'brand_name',
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contact_person',
  },
  businessType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'business_type',
  },
  gstNumber: {
    type: DataTypes.STRING(15),
    unique: false, // Allow multiple null values
    allowNull: true, // GST is optional
    field: 'gst_number',
  },
  panNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'pan_number',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  bankAccountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'bank_account_number',
  },
  bankIfscCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'bank_ifsc_code',
  },
  bankAccountHolder: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'bank_account_holder',
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'bank_name',
  },
  upiId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'upi_id',
  },
  companyLogoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'company_logo_url',
  },
  gstCertificateUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'gst_certificate_url',
  },
  panCardUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'pan_card_url',
  },
  cancelledChequeUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancelled_cheque_url',
  },
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    field: 'approval_status',
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
  },
}, {
  tableName: 'manufacturers',
  timestamps: true,
  underscored: true,
});

// OTP Model
const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mobile', // Maps to existing 'mobile' column (stores email or mobile)
  },
  otpCode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: 'otp_code',
  },
  purpose: {
    type: DataTypes.ENUM('login', 'registration', 'password_reset'),
    defaultValue: 'login',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at',
  },
}, {
  tableName: 'otp_verifications',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

// Define relationships
User.hasOne(Manufacturer, { foreignKey: 'user_id', as: 'manufacturer' });
Manufacturer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Manufacturer,
  OTP,
};
