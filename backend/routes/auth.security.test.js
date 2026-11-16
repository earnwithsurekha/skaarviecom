const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../models/user', () => ({
    User: { findOne: jest.fn(), create: jest.fn() },
    Manufacturer: { findOne: jest.fn() },
    OTP: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../config/database', () => ({ query: jest.fn() }));
jest.mock('../middleware/upload', () => ({
    uploadToS3: jest.fn(),
    uploadLocally: jest.fn(),
    validateImageQuality: jest.fn(),
}));
jest.mock('../utils/email', () => ({
    sendOTPEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
}));

const { User, Manufacturer, OTP } = require('../models/user');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sessionTimeoutMiddleware } = require('../middleware/sessionTimeout');
const authRouter = require('./auth');
const originalEnvironment = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE,
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
};

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('security characterization: passing tests reproduce vulnerabilities, not protection', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        process.env.JWT_SECRET = 'isolated-security-test-secret-not-for-production';
        process.env.JWT_EXPIRE = '15m';
        process.env.JWT_REFRESH_EXPIRE = '7d';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        for (const [name, value] of Object.entries(originalEnvironment)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    });

    test.each(['admin', 'customer', 'manufacturer'])(
        'reproduces email-only token issuance for %s without password or OTP',
        async (role) => {
            User.findOne.mockResolvedValue({
                id: 'fixture-user',
                email: 'fixture@example.invalid',
                role,
                update: jest.fn().mockResolvedValue(undefined),
            });

            const response = await request(app).post('/api/auth/login-bypass').send({
                email: 'fixture@example.invalid',
                userType: role,
            });

            expect(response.status).toBe(200);
            expect(verifyToken(response.body.data.token)).toMatchObject({ role });
        }
    );

    test('reproduces password mutation even when registration is rejected', async () => {
        const update = jest.fn().mockResolvedValue(undefined);
        User.findOne.mockResolvedValue({ id: 'existing-user', update });
        Manufacturer.findOne.mockResolvedValue({ id: 'existing-manufacturer' });

        const response = await request(app).post('/api/auth/register').send({
            email: 'fixture@example.invalid',
            password: 'test-only-replacement-password',
            companyName: 'Fixture Company',
            contactPersonName: 'Fixture Contact',
        });

        expect(response.status).toBe(400);
        expect(update).toHaveBeenCalledTimes(1);
        const passwordHash = update.mock.calls[0][0].password;
        expect(await bcrypt.compare('test-only-replacement-password', passwordHash)).toBe(true);
    });

    test('reproduces acceptance of a refresh token by the access-token verifier', () => {
        const refreshToken = generateRefreshToken({ id: 'fixture-user', role: 'customer' });
        expect(verifyToken(refreshToken)).toMatchObject({ id: 'fixture-user' });
    });

    test('reproduces acceptance of an access token at the refresh endpoint', async () => {
        const accessToken = generateToken({ id: 'fixture-user', role: 'customer' });
        const response = await request(app).post('/api/auth/refresh').send({
            refreshToken: accessToken,
        });

        expect(response.status).toBe(200);
        expect(verifyToken(response.body.data.token)).toMatchObject({ id: 'fixture-user' });
    });

    test('reproduces wrong OTP guesses being rejected without updating attempt counts', async () => {
        OTP.findOne.mockResolvedValue(null);

        for (const otp of ['100001', '100002', '100003', '100004']) {
            const response = await request(app).post('/api/auth/verify-otp').send({
                email: 'fixture@example.invalid',
                otp,
            });
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('INVALID_OTP');
        }

        expect(OTP.findOne).toHaveBeenCalledTimes(4);
        expect(OTP.findOne.mock.calls[0][0].where).toMatchObject({ otpCode: '100001' });
        expect(require('../config/database').query).not.toHaveBeenCalled();
    });

    test('reproduces inactivity enforcement being skipped without a client header', () => {
        const next = jest.fn();
        const response = { status: jest.fn(), setHeader: jest.fn() };
        sessionTimeoutMiddleware({ path: '/api/orders', headers: {} }, response, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(response.status).not.toHaveBeenCalled();
    });
});