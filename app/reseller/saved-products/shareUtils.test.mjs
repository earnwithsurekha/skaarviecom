import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductShareMessage, getStorefrontReferralLink } from './shareUtils.mjs';

test('referral links use the current storefront origin and preserve the product and referral code', () => {
  const link = 'http://localhost:3000/p/camera-123?ref=RSL123#details';
  assert.equal(getStorefrontReferralLink(link, 'https://skaarvi.shop'), 'https://skaarvi.shop/p/camera-123?ref=RSL123#details');
  assert.equal(getStorefrontReferralLink('/p/camera-123?ref=RSL123', 'http://localhost:3000'), 'http://localhost:3000/p/camera-123?ref=RSL123');
  assert.throws(() => getStorefrontReferralLink('', 'https://skaarvi.shop'), /Invalid referral link/);
});

test('copied and shared details exclude profit; only social sharing includes the image', () => {
  const product = {
    name: 'Camera',
    description: 'Good camera',
    selling_price: '1020.00',
    reseller_profit: 10,
    primary_image: 'https://images.example.com/camera.jpg',
  };
  const link = 'https://skaarvi.shop/p/camera-123?ref=RSL123';
  const copied = getProductShareMessage(product, link, false);

  assert.equal(copied, `🛍️ *Camera*\n\nGood camera\n\n💰 *Price:* ₹1020.00\n\n🔗 *Shop Now:*\n${link}`);
  assert.equal(getProductShareMessage(product, link), `${copied}\n\n📸 Product Image:\n${product.primary_image}`);
});
