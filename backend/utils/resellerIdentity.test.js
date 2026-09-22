const { QueryTypes } = require('sequelize');
const { resolveResellerId } = require('./resellerIdentity');

describe('resolveResellerId', () => {
  test('uses resellerId embedded in the session', async () => {
    const sequelize = { query: jest.fn() };
    const resellerId = await resolveResellerId(
      { user: { id: 'user-1', resellerId: 'reseller-1' } },
      sequelize
    );

    expect(resellerId).toBe('reseller-1');
    expect(sequelize.query).not.toHaveBeenCalled();
  });

  test('resolves reseller profile from the logged-in user ID', async () => {
    const sequelize = {
      query: jest.fn().mockResolvedValue([{ id: 'reseller-1' }]),
    };

    const resellerId = await resolveResellerId({ user: { id: 'user-1' } }, sequelize);

    expect(resellerId).toBe('reseller-1');
    expect(sequelize.query).toHaveBeenCalledWith(
      'SELECT id FROM resellers WHERE user_id = ?',
      expect.objectContaining({
        replacements: ['user-1'],
        type: QueryTypes.SELECT,
      })
    );
  });
});
