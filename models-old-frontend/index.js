// Database models using Sequelize for MySQL
import { DataTypes } from 'sequelize';
import sequelize from '@/lib/database';

// Helper function to generate UUID for MySQL
const generateUUID = () => {
  return crypto.randomUUID();
};

// User Model
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: () => crypto.randomUUID(),
    primaryKey: true,
  },
  mobile: {
    type: DataTypes.STRING(15),
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
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
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Manufacturer Model
export const Manufacturer = sequelize.define('Manufacturer', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: () => crypto.randomUUID(),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  brandName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gstNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  panNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bankAccountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bankIfscCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bankAccountHolder: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  upiId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending',
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'manufacturers',
  timestamps: true,
  underscored: true,
});

// OTP Model for temporary storage
export const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: () => crypto.randomUUID(),
    primaryKey: true,
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'otp_verifications',
  timestamps: true,
  underscored: true,
});

// Define relationships
User.hasOne(Manufacturer, { foreignKey: 'userId', as: 'manufacturer' });
Manufacturer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default { User, Manufacturer, OTP };
