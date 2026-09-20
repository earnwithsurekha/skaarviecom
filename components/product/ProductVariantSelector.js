'use client';

import { useEffect } from 'react';

const uniqueBy = (items, getKey) => (
  items.filter((item, index) => items.findIndex((candidate) => getKey(candidate) === getKey(item)) === index)
);

export default function ProductVariantSelector({
  variants = [],
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
}) {
  const sizeOptions = uniqueBy(
    variants.filter((variant) => variant.sizeLabel),
    (variant) => variant.sizeLabel
  );
  const colorOptions = uniqueBy(
    variants.filter((variant) => variant.colorName),
    (variant) => variant.colorName
  );

  const hasAvailableVariant = (sizeLabel, colorName) => variants.some((variant) => (
    (!sizeLabel || variant.sizeLabel === sizeLabel)
    && (!colorName || variant.colorName === colorName)
    && (Number.parseInt(variant.stockQuantity, 10) || 0) > 0
  ));
  const firstAvailableColor = colorOptions.find((variant) => (
    hasAvailableVariant(null, variant.colorName)
  ))?.colorName;
  const selectedColorIsAvailable = !selectedColor || hasAvailableVariant(null, selectedColor);

  useEffect(() => {
    if (firstAvailableColor && (!selectedColor || !selectedColorIsAvailable)) {
      onSelectColor(firstAvailableColor);
    }
  }, [firstAvailableColor, onSelectColor, selectedColor, selectedColorIsAvailable]);

  if (variants.length === 0) return null;

  const selectedVariant = variants.find((variant) => (
    (!sizeOptions.length || variant.sizeLabel === selectedSize)
    && (!colorOptions.length || variant.colorName === selectedColor)
  ));

  return (
    <div className="space-y-5">
      {colorOptions.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-medium" style={{ color: 'rgb(var(--color-text))' }}>
            Select color
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {colorOptions.map((variant) => {
              const isSelected = variant.colorName === selectedColor;
              const isAvailable = hasAvailableVariant(null, variant.colorName);

              return (
                <button
                  key={variant.colorName}
                  type="button"
                  onClick={() => {
                    onSelectColor(variant.colorName);
                    if (selectedSize && !hasAvailableVariant(selectedSize, variant.colorName)) {
                      onSelectSize('');
                    }
                  }}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-label={`${variant.colorName}${isSelected ? ', selected' : ''}`}
                  title={variant.colorName}
                  className="h-8 w-8 rounded-full transition-[opacity,border-color] disabled:cursor-not-allowed disabled:opacity-35"
                  style={{
                    backgroundColor: variant.colorHex || '#d1d5db',
                    border: isSelected ? '3px solid #2563eb' : '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span className="sr-only">{variant.colorName}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sizeOptions.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-medium" style={{ color: 'rgb(var(--color-text))' }}>
            Select size
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((variant) => {
              const isSelected = variant.sizeLabel === selectedSize;
              const isAvailable = hasAvailableVariant(variant.sizeLabel, selectedColor);

              return (
                <button
                  key={variant.sizeLabel}
                  type="button"
                  onClick={() => onSelectSize(variant.sizeLabel)}
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  className="min-h-11 min-w-12 border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: isSelected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-background))',
                    borderColor: isSelected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-border))',
                    color: isSelected ? '#ffffff' : 'rgb(var(--color-text))',
                  }}
                >
                  {variant.sizeLabel}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {((colorOptions.length > 0 && !selectedColor) || (sizeOptions.length > 0 && !selectedSize)) && (
        <p className="text-sm" style={{ color: 'rgb(var(--color-danger))' }}>
          Select the available options before adding this product to your cart.
        </p>
      )}
      {selectedVariant && (
        <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-success))' }}>
          {Number.parseInt(selectedVariant.stockQuantity, 10) || 0} available in this option
        </p>
      )}
    </div>
  );
}