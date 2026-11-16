const { sessionTimeoutMiddleware } = require('./sessionTimeout');

describe('session inactivity timeout', () => {
  const now = 1700000000000;
  let response;
  let next;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
    response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows requests before 15 minutes of inactivity', () => {
    sessionTimeoutMiddleware({
      path: '/api/orders',
      headers: { 'x-last-activity': String(now - (15 * 60 * 1000 - 1000)) },
    }, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('x-session-remaining', '1000');
    expect(response.status).not.toHaveBeenCalled();
  });

  test('rejects requests after 15 minutes of inactivity', () => {
    sessionTimeoutMiddleware({
      path: '/api/orders',
      headers: { 'x-last-activity': String(now - (15 * 60 * 1000 + 1)) },
    }, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'SESSION_TIMEOUT',
      timeoutDuration: 900,
    }));
  });
});
