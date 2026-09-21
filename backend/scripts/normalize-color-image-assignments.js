require('dotenv').config();

const mysql = require('mysql2/promise');

const getVariantKeys = (rawValue) => {
  if (Array.isArray(rawValue)) return rawValue;
  if (!rawValue) return [];
  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const getAssignedColor = (variantKey) => {
  const normalizedKey = String(variantKey || '').trim().toLocaleLowerCase('en-IN');
  if (normalizedKey.startsWith('color:')) return normalizedKey.slice('color:'.length);
  if (normalizedKey.startsWith('size:')) return null;
  return normalizedKey.split('|')[1] || null;
};

const normalizeColorImageAssignments = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [images] = await connection.execute(`
      SELECT id, product_id, variant_keys, variant_key, color_name
      FROM product_images
      WHERE variant_keys IS NOT NULL OR variant_key IS NOT NULL
    `);
    const [variants] = await connection.execute(`
      SELECT product_id, color_name
      FROM product_variants
      WHERE color_name IS NOT NULL
    `);
    const canonicalColors = new Map(
      variants.map((variant) => [
        `${variant.product_id}:${variant.color_name.toLocaleLowerCase('en-IN')}`,
        variant.color_name,
      ])
    );

    const updates = images.flatMap((image) => {
      const variantKeys = getVariantKeys(image.variant_keys);
      const assignedColors = variantKeys.map(getAssignedColor);
      const uniqueColors = new Set(assignedColors);
      if (variantKeys.length === 0 || assignedColors.includes(null) || uniqueColors.size !== 1) return [];

      const normalizedColor = assignedColors[0];
      const colorKey = `color:${normalizedColor}`;
      if (
        variantKeys.length === 1
        && variantKeys[0] === colorKey
        && image.variant_key === colorKey
        && image.color_name
      ) return [];

      return [{
        id: image.id,
        colorKey,
        colorName: canonicalColors.get(`${image.product_id}:${normalizedColor}`)
          || image.color_name
          || normalizedColor,
      }];
    });

    await connection.beginTransaction();
    for (const update of updates) {
      await connection.execute(`
        UPDATE product_images
        SET variant_keys = ?, variant_key = ?, size_label = NULL, color_name = ?
        WHERE id = ?
      `, [JSON.stringify([update.colorKey]), update.colorKey, update.colorName, update.id]);
    }
    await connection.commit();
    console.log(`Normalized ${updates.length} color image assignment(s).`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
};

normalizeColorImageAssignments().catch((error) => {
  console.error('Color image assignment normalization failed:', error.message);
  process.exitCode = 1;
});