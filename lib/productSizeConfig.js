const STANDARD_APPAREL_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'];

const OPTIONAL_SIZE_CONFIG = {
  requirement: 'optional',
  title: 'Size inventory',
  description: 'Enable this when the product is sold in distinct sizes.',
  groups: [],
};

export const PRODUCT_SIZE_CONFIG = {
  'mens-clothing': {
    requirement: 'required',
    title: "Men's clothing sizes",
    description: 'Choose every size you sell and enter its available quantity.',
    groups: [
      { label: 'Standard apparel', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'] },
      { label: 'Waist (inches)', sizes: ['28 in', '30 in', '32 in', '34 in', '36 in', '38 in', '40 in', '42 in', '44 in', '46 in', '48 in', '50 in'] },
    ],
  },
  'womens-clothing': {
    requirement: 'required',
    title: "Women's clothing sizes",
    description: 'Choose standard, waist, or custom sizes and enter stock for each one.',
    groups: [
      { label: 'Standard apparel', sizes: STANDARD_APPAREL_SIZES },
      { label: 'Waist (inches)', sizes: ['24 in', '26 in', '28 in', '30 in', '32 in', '34 in', '36 in', '38 in', '40 in', '42 in', '44 in', '46 in'] },
    ],
  },
  'kids-clothing': {
    requirement: 'required',
    title: "Kids' clothing sizes",
    description: 'Use age ranges or custom labels appropriate for the garment.',
    groups: [
      { label: 'Age', sizes: ['0-3M', '3-6M', '6-12M', '12-18M', '18-24M', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y', '13-14Y'] },
      { label: 'Standard apparel', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    ],
  },
  footwear: {
    requirement: 'required',
    title: 'Footwear sizes',
    description: 'Use UK/India sizing or add the exact sizing system shown on the product.',
    groups: [
      { label: 'UK / India', sizes: Array.from({ length: 13 }, (_, index) => `UK/India ${index + 1}`) },
    ],
  },
  fashion: {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [{ label: 'Standard apparel', sizes: STANDARD_APPAREL_SIZES }],
  },
  'sports-fitness': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [
      { label: 'Apparel', sizes: STANDARD_APPAREL_SIZES },
      { label: 'Equipment', sizes: ['Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7', 'Universal'] },
    ],
  },
  'jewelry-watches': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [
      { label: 'General', sizes: ['Adjustable', 'Free Size'] },
      { label: 'Ring (India)', sizes: Array.from({ length: 19 }, (_, index) => `Ring ${index + 6}`) },
    ],
  },
  'baby-products': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [
      { label: 'Age', sizes: ['Newborn', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'] },
      { label: 'Diaper / wearable', sizes: ['Newborn', 'S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
  'pet-supplies': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [{ label: 'Pet apparel and accessories', sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] }],
  },
  'home-kitchen': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [{ label: 'Bedding and linen', sizes: ['Single', 'Double', 'Queen', 'King', 'Super King'] }],
  },
  'bags-luggage': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [{ label: 'Luggage', sizes: ['Cabin / Small', 'Medium', 'Large', 'Extra Large'] }],
  },
  'health-wellness': {
    ...OPTIONAL_SIZE_CONFIG,
    groups: [{ label: 'Wearables and supports', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Universal'] }],
  },
};

export const getProductSizeConfig = (categorySlug) => (
  categorySlug ? (PRODUCT_SIZE_CONFIG[categorySlug] || OPTIONAL_SIZE_CONFIG) : null
);

export const PRODUCT_COLOR_PRESETS = [
  { colorName: 'Black', colorHex: '#111827' },
  { colorName: 'White', colorHex: '#ffffff' },
  { colorName: 'Grey', colorHex: '#6b7280' },
  { colorName: 'Navy', colorHex: '#1e3a8a' },
  { colorName: 'Blue', colorHex: '#2563eb' },
  { colorName: 'Red', colorHex: '#dc2626' },
  { colorName: 'Green', colorHex: '#16a34a' },
  { colorName: 'Yellow', colorHex: '#eab308' },
  { colorName: 'Pink', colorHex: '#ec4899' },
  { colorName: 'Purple', colorHex: '#9333ea' },
  { colorName: 'Brown', colorHex: '#92400e' },
  { colorName: 'Beige', colorHex: '#d6c7a1' },
  { colorName: 'Orange', colorHex: '#ea580c' },
  { colorName: 'Multi-colour', colorHex: '#64748b' },
];

export const getVariantInventoryKey = (sizeLabel, colorName) => (
  `${sizeLabel || ''}|${colorName || ''}`
);