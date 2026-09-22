const { QueryTypes } = require('sequelize');
const {
  creditPendingCommission,
  releaseCommission,
  cancelCommission,
} = require('./commissionService');

const makeTransaction = () => ({
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
});

describe('commission service', () => {
  test('creates a pending wallet credit with required balance fields', async () => {
    const transaction = makeTransaction();
    const sequelize = { query: jest.fn() };
    sequelize.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([undefined, 1])
      .mockResolvedValueOnce([{ id: 'wallet-1', pending_balance: '5.00' }])
      .mockResolvedValueOnce([undefined, 1])
      .mockResolvedValueOnce([undefined, 1]);

    await creditPendingCommission(
      'order-1', 'ORD-1', 'reseller-1', 20, sequelize, transaction
    );

    expect(sequelize.query).toHaveBeenCalledTimes(5);
    const [insertSql, insertOptions] = sequelize.query.mock.calls[4];
    expect(insertSql).toContain('wallet_id, reseller_id, transaction_type, amount, balance_before, balance_after');
    expect(insertOptions).toMatchObject({
      type: QueryTypes.INSERT,
      transaction,
      replacements: [
        'wallet-1', 'reseller-1', 20, 5, 25,
        'order-1', 'ORD-1', 'Commission for order #ORD-1'
      ],
    });
  });

  test('does not credit the same order twice', async () => {
    const transaction = makeTransaction();
    const sequelize = {
      query: jest.fn().mockResolvedValue([{ id: 'existing-credit' }]),
    };

    await creditPendingCommission(
      'order-1', 'ORD-1', 'reseller-1', 20, sequelize, transaction
    );

    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });

  test('releases pending commission into the current balance', async () => {
    const transaction = makeTransaction();
    const sequelize = {
      transaction: jest.fn().mockResolvedValue(transaction),
      query: jest.fn()
        .mockResolvedValueOnce([{ id: 'order-1', reseller_id: 'reseller-1' }])
        .mockResolvedValueOnce([{ id: 'credit-1', amount: '20.00' }])
        .mockResolvedValueOnce([{ current_balance: '10.00', pending_balance: '20.00' }])
        .mockResolvedValueOnce([undefined, 1])
        .mockResolvedValueOnce([undefined, 1]),
    };

    await releaseCommission('order-1', sequelize);

    expect(sequelize.query.mock.calls[3][1].replacements).toEqual([20, 30, 'reseller-1']);
    expect(sequelize.query.mock.calls[4][1].replacements).toEqual([10, 30, 'credit-1']);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test('reverses pending commission and total earnings', async () => {
    const transaction = makeTransaction();
    const sequelize = {
      transaction: jest.fn().mockResolvedValue(transaction),
      query: jest.fn()
        .mockResolvedValueOnce([{ id: 'order-1', reseller_id: 'reseller-1' }])
        .mockResolvedValueOnce([{ id: 'credit-1', amount: '20.00' }])
        .mockResolvedValueOnce([{ pending_balance: '25.00' }])
        .mockResolvedValueOnce([undefined, 1])
        .mockResolvedValueOnce([undefined, 1]),
    };

    await cancelCommission('order-1', sequelize);

    expect(sequelize.query.mock.calls[3][1].replacements).toEqual([5, 20, 'reseller-1']);
    expect(sequelize.query.mock.calls[4][1].replacements).toEqual([25, 5, 'credit-1']);
    expect(sequelize.query.mock.calls[4][0]).toContain("status = 'reversed'");
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });
});
