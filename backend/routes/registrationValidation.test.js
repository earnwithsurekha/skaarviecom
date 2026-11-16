const express = require('express');
const request = require('supertest');

jest.mock('../models/user', () => ({ User: {}, Manufacturer: {}, OTP: {} }));
jest.mock('../config/database', () => ({ transaction: jest.fn(), query: jest.fn() }));
jest.mock('../middleware/upload', () => ({
  uploadToS3: jest.fn(),
  uploadLocally: jest.fn(),
  validateImageQuality: (req, res, next) => next(),
}));
jest.mock('../utils/email', () => ({ sendOTPEmail: jest.fn(), sendWelcomeEmail: jest.fn() }));

const database = require('../config/database');
const app = express();
app.use(express.json());
app.use('/api/auth', require('./auth'));

const customer = {
  name: 'Example User', email: 'user@example.com', phone: '9876543210', password: 'password',
  state: 'Telangana', pincode: '520001',
};
const reseller = {
  ...customer, city: 'Hyderabad', bank_name: 'Example Bank', account_number: '123456789',
  ifsc_code: 'SBIN0001234', account_holder_name: 'Example User',
};
const manufacturer = {
  companyName: 'Example Company', brandName: 'Example Brand', contactPersonName: 'Example Person',
  mobile: '+919876543210', email: 'user@example.com', password: 'password',
  address: 'Example address', city: 'Hyderabad', state: 'Telangana', pincode: '520001',
  businessType: 'proprietorship', accountHolderName: 'Example Person', accountNumber: '123456789',
  ifscCode: 'SBIN0001234', bankName: 'Example Bank',
};

test.each([
  ['/api/auth/register/customer', customer],
  ['/api/auth/register/reseller', reseller],
  ['/api/auth/register', manufacturer],
])('%s rejects a state and PIN mismatch before database access', async (path, fields) => {
  const response = await request(app).post(path).send(fields);
  expect(response.status).toBe(400);
  expect(response.body.errors.pincode).toMatch(/Telangana/);
  expect(database.transaction).not.toHaveBeenCalled();
});

test('manufacturer registration rejects missing required documents before database access', async () => {
  const response = await request(app).post('/api/auth/register').send({ ...manufacturer, pincode: '500001' });
  expect(response.status).toBe(400);
  expect(response.body.message).toMatch(/panCard/);
  expect(database.transaction).not.toHaveBeenCalled();
});

test('rejects invalid login identifiers before database access', async () => {
  const response = await request(app).post('/api/auth/login/password').send({ identifier: 'invalid', password: 'password' });
  expect(response.status).toBe(400);
  expect(database.query).not.toHaveBeenCalled();
});
