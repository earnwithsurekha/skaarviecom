const {
  validateLocation,
  validateLoginIdentifier,
  validateRegistration,
} = require('./registrationValidation');

const customer = {
  name: 'Example User',
  email: 'user@example.com',
  phone: '9876543210',
  password: 'password',
  confirmPassword: 'password',
  state: 'Telangana',
  pincode: '500001',
};

const reseller = {
  ...customer,
  city: 'Hyderabad',
  bank_name: 'Example Bank',
  account_number: '123456789',
  ifsc_code: 'SBIN0001234',
  account_holder_name: 'Example User',
};

const manufacturer = {
  companyName: 'Example Company',
  brandName: 'Example Brand',
  contactPersonName: 'Example Person',
  mobile: '+919876543210',
  email: 'user@example.com',
  password: 'password',
  confirmPassword: 'password',
  address: 'Example address',
  city: 'Vijayawada',
  state: 'Andhra Pradesh',
  pincode: '520001',
  businessType: 'proprietorship',
  accountHolderName: 'Example Person',
  accountNumber: '123456789',
  ifscCode: 'SBIN0001234',
  bankName: 'Example Bank',
};

test('validates actual PINs against the selected state, including snapshot conflicts', () => {
  expect(validateLocation('Telangana', '500001')).toBe('');
  expect(validateLocation('Andhra Pradesh', '520001')).toBe('');
  expect(validateLocation('Andhra Pradesh', '500001')).toMatch(/Andhra Pradesh/);
  expect(validateLocation('Telangana', '520001')).toMatch(/Telangana/);
  expect(validateLocation('Telangana', '500999')).toMatch(/valid PIN/);
  expect(validateLocation('Telangana', '12345')).toMatch(/6-digit/);
  expect(validateLocation('Other', '500001')).toMatch(/Select/);
  expect(validateLocation('Andhra Pradesh', '506003')).toBe('');
  expect(validateLocation('Telangana', '506003')).toBe('');
});

test.each([
  ['customer', customer],
  ['reseller', reseller],
  ['manufacturer', manufacturer],
])('%s registration requires a matching state and PIN', (role, data) => {
  expect(validateRegistration(data, role)).toEqual({});
  expect(validateRegistration({ ...data, pincode: '' }, role).pincode).toBeTruthy();
  expect(validateRegistration({ ...data, state: 'Other' }, role).state).toBeTruthy();
});

test('validates registration details that previously could be skipped', () => {
  expect(validateRegistration({ ...customer, email: 'bad@@example.com', phone: '1234567890', confirmPassword: 'wrong' }, 'customer'))
    .toMatchObject({ email: expect.any(String), phone: expect.any(String), confirmPassword: expect.any(String) });
  expect(validateRegistration({ ...reseller, pan_number: 'BAD', aadhar_number: '123', account_number: 'abc', upi_id: 'bad' }, 'reseller'))
    .toMatchObject({ pan_number: expect.any(String), aadhar_number: expect.any(String), account_number: expect.any(String), upi_id: expect.any(String) });
  expect(validateRegistration({ ...manufacturer, password: 'abc', businessType: 'other', ifscCode: 'bad' }, 'manufacturer'))
    .toMatchObject({ password: expect.any(String), businessType: expect.any(String), ifscCode: expect.any(String) });
});

test('accepts existing email and mobile login formats without imposing registration password rules', () => {
  expect(validateLoginIdentifier(' user@example.com ')).toBe(true);
  expect(validateLoginIdentifier('+919876543210')).toBe(true);
  expect(validateLoginIdentifier('1234567890')).toBe(true);
  expect(validateLoginIdentifier('invalid')).toBe(false);
});
