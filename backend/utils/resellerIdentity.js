const { QueryTypes } = require('sequelize');

const resolveResellerId = async (request, sequelize, transaction = undefined) => {
  if (request.user?.resellerId) return request.user.resellerId;

  const userId = request.user?.id || request.user?.userId;
  if (!userId) return null;

  const [reseller] = await sequelize.query(
    'SELECT id FROM resellers WHERE user_id = ?',
    {
      replacements: [userId],
      type: QueryTypes.SELECT,
      transaction,
    }
  );
  return reseller?.id || null;
};

module.exports = { resolveResellerId };
