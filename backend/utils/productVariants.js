const REQUIRED_SIZE_CATEGORY_SLUGS = new Set([
  'mens-clothing',
  'womens-clothing',
  'kids-clothing',
  'footwear',
]);

const normalizePart = (value) => String(value || '').trim();
const createVariantKey = (sizeLabel, colorName) => (
  `${normalizePart(sizeLabel).toLocaleLowerCase('en-IN')}|${normalizePart(colorName).toLocaleLowerCase('en-IN')}`
);

const parseProductVariants = (rawVariants) => {
  if (rawVariants === undefined) return undefined;

  let variants = rawVariants;
  if (typeof variants === 'string') {
    try {
      variants = JSON.parse(variants);
    } catch {
      throw new Error('Product variants must be valid JSON');
    }
  }

  if (!Array.isArray(variants)) {
    throw new Error('Product variants must be an array');
  }
  if (variants.length > 100) {
    throw new Error('A product cannot have more than 100 variants');
  }

  const seenKeys = new Set();
  const normalizedVariants = variants.map((variant, index) => {
    const sizeLabel = normalizePart(variant.sizeLabel) || null;
    const colorName = normalizePart(variant.colorName) || null;
    const colorHex = normalizePart(variant.colorHex) || null;
    const stockQuantity = Number(variant.stockQuantity ?? variant.quantity);
    const variantKey = createVariantKey(sizeLabel, colorName);

    if (!sizeLabel && !colorName) {
      throw new Error('Each variant must have a size, a color, or both');
    }
    if (sizeLabel?.length > 50 || colorName?.length > 50) {
      throw new Error('Size and color names must be 50 characters or fewer');
    }
    if (colorHex && !/^#[0-9a-f]{6}$/i.test(colorHex)) {
      throw new Error(`Invalid color value for ${colorName}`);
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error(`Stock for ${[colorName, sizeLabel].filter(Boolean).join(' / ')} must be a non-negative whole number`);
    }
    if (seenKeys.has(variantKey)) {
      throw new Error(`Duplicate variant: ${[colorName, sizeLabel].filter(Boolean).join(' / ')}`);
    }

    seenKeys.add(variantKey);
    return { variantKey, sizeLabel, colorName, colorHex, stockQuantity, sortOrder: index };
  });

  const usesSizes = normalizedVariants.some((variant) => variant.sizeLabel);
  const usesColors = normalizedVariants.some((variant) => variant.colorName);
  if (usesSizes && normalizedVariants.some((variant) => !variant.sizeLabel)) {
    throw new Error('Every variant must include a size when size inventory is enabled');
  }
  if (usesColors && normalizedVariants.some((variant) => !variant.colorName)) {
    throw new Error('Every variant must include a color when color inventory is enabled');
  }

  return normalizedVariants;
};

const getTotalVariantStock = (variants) => (
  variants.reduce((total, variant) => total + variant.stockQuantity, 0)
);

const categoryRequiresSizes = (category) => (
  REQUIRED_SIZE_CATEGORY_SLUGS.has(category?.slug)
);

const resolveVariantSelection = (variants, selectedSize, selectedColor) => {
  const normalizedSize = normalizePart(selectedSize).toLocaleLowerCase('en-IN');
  const normalizedColor = normalizePart(selectedColor).toLocaleLowerCase('en-IN');
  const usesSizes = variants.some((variant) => variant.size_label || variant.sizeLabel);
  const usesColors = variants.some((variant) => variant.color_name || variant.colorName);
  const selectedVariant = variants.find((variant) => {
    const variantSize = normalizePart(variant.size_label || variant.sizeLabel).toLocaleLowerCase('en-IN');
    const variantColor = normalizePart(variant.color_name || variant.colorName).toLocaleLowerCase('en-IN');
    return (!usesSizes || variantSize === normalizedSize)
      && (!usesColors || variantColor === normalizedColor);
  });

  return { selectedVariant, usesSizes, usesColors };
};

const parseJsonArray = (rawValue, fieldName) => {
  if (rawValue === undefined) return undefined;
  if (Array.isArray(rawValue)) return rawValue;

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) throw new Error();
    return parsedValue;
  } catch {
    throw new Error(`${fieldName} must be a valid JSON array`);
  }
};

const parseOptionalSortOrder = (assignment) => {
  if (assignment?.sortOrder === undefined) return {};
  const sortOrder = Number(assignment.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error('Image sort order must be a non-negative whole number');
  }
  return { sortOrder };
};

const resolveMediaAssignment = (assignment, variants) => {
  const requestedKey = normalizePart(assignment?.variantKey);
  if (!requestedKey) {
    return { variantKey: null, sizeLabel: null, colorName: null };
  }

  if (requestedKey.startsWith('color:')) {
    const normalizedColor = requestedKey.slice('color:'.length);
    const variant = variants.find(
      (candidate) => normalizePart(candidate.colorName).toLocaleLowerCase('en-IN') === normalizedColor
    );
    if (!variant) throw new Error(`Image assignment references an unknown color: ${normalizedColor}`);
    return { variantKey: requestedKey, sizeLabel: null, colorName: variant.colorName };
  }

  if (requestedKey.startsWith('size:')) {
    const normalizedSize = requestedKey.slice('size:'.length);
    const variant = variants.find(
      (candidate) => normalizePart(candidate.sizeLabel).toLocaleLowerCase('en-IN') === normalizedSize
    );
    if (!variant) throw new Error(`Image assignment references an unknown size: ${normalizedSize}`);
    return { variantKey: requestedKey, sizeLabel: variant.sizeLabel, colorName: null };
  }

  const variant = variants.find((candidate) => candidate.variantKey === requestedKey);
  if (!variant) {
    throw new Error(`Image assignment references an unknown variant: ${requestedKey}`);
  }

  return {
    variantKey: variant.variantKey,
    sizeLabel: variant.sizeLabel,
    colorName: variant.colorName,
  };
};

const resolveMediaAssignments = (assignment, variants) => {
  const requestedKeys = Array.isArray(assignment?.variantKeys)
    ? assignment.variantKeys
    : assignment?.variantKey
      ? [assignment.variantKey]
      : [];
  const normalizedKeys = [...new Set(requestedKeys.map(normalizePart).filter(Boolean))];
  const resolvedAssignments = normalizedKeys.map((variantKey) => (
    resolveMediaAssignment({ variantKey }, variants)
  ));
  const singleAssignment = resolvedAssignments.length === 1 ? resolvedAssignments[0] : null;

  return {
    variantKeys: resolvedAssignments.map((resolved) => resolved.variantKey),
    variantKey: singleAssignment?.variantKey || null,
    sizeLabel: singleAssignment?.sizeLabel || null,
    colorName: singleAssignment?.colorName || null,
  };
};

const parseNewImageAssignments = (rawAssignments, imageCount, variants) => {
  const assignments = parseJsonArray(rawAssignments, 'Image assignments');
  if (assignments === undefined) {
    return Array.from({ length: imageCount }, () => resolveMediaAssignments(null, variants));
  }
  if (assignments.length !== imageCount) {
    throw new Error('Each uploaded image must have one image assignment');
  }

  return assignments.map((assignment) => ({
    ...resolveMediaAssignments(assignment, variants),
    ...parseOptionalSortOrder(assignment),
  }));
};

const parseExistingImageAssignments = (rawAssignments, variants) => {
  const assignments = parseJsonArray(rawAssignments, 'Existing image assignments');
  if (assignments === undefined) return undefined;

  const seenIds = new Set();
  return assignments.map((assignment, defaultSortOrder) => {
    const id = normalizePart(assignment?.id);
    if (!id || seenIds.has(id)) {
      throw new Error('Existing image assignments contain an invalid or duplicate image ID');
    }
    seenIds.add(id);
    return {
      id,
      sortOrder: assignment.sortOrder === undefined
        ? defaultSortOrder
        : parseOptionalSortOrder(assignment).sortOrder,
      ...resolveMediaAssignments(assignment, variants),
    };
  });
};

const replaceProductVariants = async ({ ProductVariant, productId, variants, transaction }) => {
  await ProductVariant.destroy({ where: { productId }, transaction });

  if (variants.length > 0) {
    await ProductVariant.bulkCreate(
      variants.map((variant) => ({ productId, ...variant })),
      { transaction }
    );
  }
};

module.exports = {
  categoryRequiresSizes,
  createVariantKey,
  getTotalVariantStock,
  parseProductVariants,
  parseExistingImageAssignments,
  parseNewImageAssignments,
  replaceProductVariants,
  resolveVariantSelection,
};