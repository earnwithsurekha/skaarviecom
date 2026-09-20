const getImageValue = (image, fieldNames) => {
  for (const fieldName of fieldNames) {
    if (image?.[fieldName]) return image[fieldName];
  }
  return null;
};

const getVariantKeys = (image) => {
  const rawKeys = getImageValue(image, ['variantKeys', 'variant_keys']);
  if (Array.isArray(rawKeys)) return rawKeys;
  if (typeof rawKeys === 'string') {
    try {
      const parsedKeys = JSON.parse(rawKeys);
      if (Array.isArray(parsedKeys)) return parsedKeys;
    } catch {
      return [rawKeys];
    }
  }
  const legacyKey = getImageValue(image, ['variantKey', 'variant_key']);
  return legacyKey ? [legacyKey] : [];
};

export const normalizeProductImages = (images, getImageUrl) => (
  (Array.isArray(images) ? images : [])
    .map((image) => {
      const rawUrl = typeof image === 'string'
        ? image
        : getImageValue(image, ['image_url', 'imageUrl']);
      const url = getImageUrl(rawUrl);

      if (!url) return null;
      return {
        url,
        variantKeys: getVariantKeys(image),
        variantKey: getImageValue(image, ['variantKey', 'variant_key']),
        sizeLabel: getImageValue(image, ['sizeLabel', 'size_label']),
        colorName: getImageValue(image, ['colorName', 'color_name']),
      };
    })
    .filter(Boolean)
);

const imageMatchesSelection = (image, selectedSize, selectedColor) => {
  if (image.variantKeys?.length > 0) {
    const normalizedSize = String(selectedSize || '').toLocaleLowerCase('en-IN');
    const normalizedColor = String(selectedColor || '').toLocaleLowerCase('en-IN');
    return image.variantKeys.some((variantKey) => {
      if (variantKey.startsWith('color:')) return variantKey.slice(6) === normalizedColor;
      if (variantKey.startsWith('size:')) return variantKey.slice(5) === normalizedSize;
      const [sizeLabel, colorName] = variantKey.split('|');
      return (!sizeLabel || sizeLabel === normalizedSize) && (!colorName || colorName === normalizedColor);
    });
  }
  if (image.sizeLabel && image.sizeLabel !== selectedSize) return false;
  if (image.colorName && image.colorName !== selectedColor) return false;
  return Boolean(image.sizeLabel || image.colorName);
};

const specificity = (image, selectedSize, selectedColor) => {
  if (image.variantKeys?.length > 0) {
    const normalizedSize = String(selectedSize || '').toLocaleLowerCase('en-IN');
    const normalizedColor = String(selectedColor || '').toLocaleLowerCase('en-IN');
    return Math.max(...image.variantKeys.map((variantKey) => {
      if (variantKey.startsWith('color:')) return variantKey.slice(6) === normalizedColor ? 1 : 0;
      if (variantKey.startsWith('size:')) return variantKey.slice(5) === normalizedSize ? 1 : 0;
      const [sizeLabel, colorName] = variantKey.split('|');
      return Number(!sizeLabel || sizeLabel === normalizedSize) + Number(!colorName || colorName === normalizedColor);
    }));
  }
  return Number(Boolean(image.sizeLabel)) + Number(Boolean(image.colorName));
};

export const getVariantGalleryImages = (images, selectedSize, selectedColor) => {
  const universalImages = images.filter((image) => (
    !image.variantKeys?.length && !image.sizeLabel && !image.colorName
  ));
  const matchingImages = images
    .filter((image) => imageMatchesSelection(image, selectedSize, selectedColor))
    .sort((first, second) => (
      specificity(second, selectedSize, selectedColor) - specificity(first, selectedSize, selectedColor)
    ));

  if (matchingImages.length > 0) {
    return [...matchingImages, ...universalImages];
  }
  if (universalImages.length > 0) return universalImages;
  return images;
};
