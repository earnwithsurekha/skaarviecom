require('dotenv').config();

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User } = require('../models/user');

const createCustomerSupportUser = async () => {
  const email = process.env.SUPPORT_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPPORT_PASSWORD;
  const mobile = process.env.SUPPORT_MOBILE?.trim();

  if (!email || !password || !mobile) {
    throw new Error('Set SUPPORT_EMAIL, SUPPORT_PASSWORD, and SUPPORT_MOBILE before running this command');
  }
  if (password.length < 8) {
    throw new Error('SUPPORT_PASSWORD must contain at least 8 characters');
  }
  if (!/^\d{10,15}$/.test(mobile)) {
    throw new Error('SUPPORT_MOBILE must contain 10 to 15 digits');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser && existingUser.role !== 'customer_support') {
    throw new Error('That email already belongs to a different account role');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  if (existingUser) {
    await existingUser.update({ password: hashedPassword, mobile, isActive: true, isVerified: true });
    console.log(`Customer support credentials updated for ${email}`);
    return;
  }

  await User.create({
    email,
    password: hashedPassword,
    mobile,
    role: 'customer_support',
    isActive: true,
    isVerified: true,
  });
  console.log(`Customer support user created for ${email}`);
};

createCustomerSupportUser()
  .catch((error) => {
    console.error(`Customer support user setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());