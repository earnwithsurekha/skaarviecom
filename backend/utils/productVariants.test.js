const {
  categoryRequiresSizes,
  createVariantKey,
  getTotalVariantStock,
  parseExistingImageAssignments,
  parseNewImageAssignments,
  parseProductVariants,
  resolveVariantSelection,
} = require('./productVariants');

describe('product variants', () => {
  test('normalizes size and color combinations', () => {
    const variants = parseProductVariants([
      { sizeLabel: ' M ', colorName: 'Blue', colorHex: '#2563eb', stockQuantity: 4 },
      { sizeLabel: 'L', colorName: 'Blue', colorHex: '#2563EB', stockQuantity: 2 },
    ]);

    expect(variants).toEqual([
      {
        variantKey: 'm|blue',
        sizeLabel: 'M',
        colorName: 'Blue',
        colorHex: '#2563eb',
        stockQuantity: 4,
        sortOrder: 0,
      },
      {
        variantKey: 'l|blue',
        sizeLabel: 'L',
        colorName: 'Blue',
        colorHex: '#2563EB',
        stockQuantity: 2,
        sortOrder: 1,
      },
    ]);
    expect(getTotalVariantStock(variants)).toBe(6);
  });

  test('supports color-only variants', () => {
    expect(parseProductVariants([
      { colorName: 'Black', colorHex: '#111827', stockQuantity: 3 },
    ])[0]).toMatchObject({
      variantKey: '|black',
      sizeLabel: null,
      colorName: 'Black',
      stockQuantity: 3,
    });
  });

  test('rejects duplicate combinations case-insensitively', () => {
    expect(() => parseProductVariants([
      { sizeLabel: 'M', colorName: 'Blue', stockQuantity: 1 },
      { sizeLabel: 'm', colorName: 'blue', stockQuantity: 2 },
    ])).toThrow('Duplicate variant');
  });

  test('rejects invalid stock and colors', () => {
    expect(() => parseProductVariants([
      { sizeLabel: 'M', stockQuantity: -1 },
    ])).toThrow('non-negative whole number');
    expect(() => parseProductVariants([
      { colorName: 'Blue', colorHex: 'blue', stockQuantity: 1 },
    ])).toThrow('Invalid color value');
  });

  test('rejects partially configured variant dimensions', () => {
    expect(() => parseProductVariants([
      { sizeLabel: 'M', colorName: 'Blue', stockQuantity: 1 },
      { sizeLabel: 'L', stockQuantity: 2 },
    ])).toThrow('Every variant must include a color');
    expect(() => parseProductVariants([
      { sizeLabel: 'M', colorName: 'Blue', stockQuantity: 1 },
      { colorName: 'Black', stockQuantity: 2 },
    ])).toThrow('Every variant must include a size');
  });

  test('requires sizes only for inherently sized categories', () => {
    expect(categoryRequiresSizes({ slug: 'mens-clothing' })).toBe(true);
    expect(categoryRequiresSizes({ slug: 'womens-clothing' })).toBe(true);
    expect(categoryRequiresSizes({ slug: 'kids-clothing' })).toBe(true);
    expect(categoryRequiresSizes({ slug: 'footwear' })).toBe(true);
    expect(categoryRequiresSizes({ slug: 'electronics' })).toBe(false);
    expect(createVariantKey('UK/India 8', 'Black')).toBe('uk/india 8|black');
  });

  test('matches the exact size and color combination case-insensitively', () => {
    const variants = [
      { id: 'blue-m', size_label: 'M', color_name: 'Blue', stock_quantity: 4 },
      { id: 'black-m', size_label: 'M', color_name: 'Black', stock_quantity: 8 },
      { id: 'blue-l', size_label: 'L', color_name: 'Blue', stock_quantity: 3 },
    ];

    const result = resolveVariantSelection(variants, 'm', 'blue');
    expect(result.usesSizes).toBe(true);
    expect(result.usesColors).toBe(true);
    expect(result.selectedVariant.id).toBe('blue-m');
    expect(resolveVariantSelection(variants, 'XL', 'Blue').selectedVariant).toBeUndefined();
  });

  test('validates universal, grouped, and exact image assignments', () => {
    const variants = parseProductVariants([
      { sizeLabel: 'M', colorName: 'Blue', colorHex: '#2563eb', stockQuantity: 4 },
      { sizeLabel: 'L', colorName: 'Blue', colorHex: '#2563eb', stockQuantity: 2 },
    ]);

    expect(parseNewImageAssignments(undefined, 2, variants)).toEqual([
      { variantKeys: [], variantKey: null, sizeLabel: null, colorName: null },
      { variantKeys: [], variantKey: null, sizeLabel: null, colorName: null },
    ]);
    expect(parseNewImageAssignments(JSON.stringify([
      { variantKey: 'color:blue' },
      { variantKey: 'size:m' },
      { variantKey: 'm|blue' },
    ]), 3, variants)).toEqual([
      { variantKeys: ['color:blue'], variantKey: 'color:blue', sizeLabel: null, colorName: 'Blue' },
      { variantKeys: ['size:m'], variantKey: 'size:m', sizeLabel: 'M', colorName: null },
      { variantKeys: ['m|blue'], variantKey: 'm|blue', sizeLabel: 'M', colorName: 'Blue' },
    ]);
  });

  test('assigns one image to multiple sizes of the same color', () => {
    const variants = parseProductVariants(['M', 'L', 'XL', 'XXL'].map((sizeLabel) => ({
      sizeLabel,
      colorName: 'Red',
      colorHex: '#dc2626',
      stockQuantity: 2,
    })));

    expect(parseNewImageAssignments(JSON.stringify([{
      variantKeys: ['m|red', 'l|red', 'xl|red', 'xxl|red'],
    }]), 1, variants)).toEqual([{
      variantKeys: ['m|red', 'l|red', 'xl|red', 'xxl|red'],
      variantKey: null,
      sizeLabel: null,
      colorName: null,
    }]);
  });

  test('rejects invalid image assignment metadata', () => {
    const variants = parseProductVariants([
      { sizeLabel: 'M', colorName: 'Blue', stockQuantity: 1 },
    ]);

    expect(() => parseNewImageAssignments('[{"variantKey":"m|blue"}]', 2, variants))
      .toThrow('one image assignment');
    expect(() => parseNewImageAssignments('[{"variantKey":"color:red"}]', 1, variants))
      .toThrow('unknown color');
    expect(() => parseExistingImageAssignments(JSON.stringify([
      { id: 'image-1', variantKey: '' },
      { id: 'image-1', variantKey: '' },
    ]), variants)).toThrow('duplicate image ID');
  });
});
