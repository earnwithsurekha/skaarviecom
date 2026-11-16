export function getStorefrontReferralLink(referralLink, origin) {
  if (typeof referralLink !== 'string' || !referralLink.trim()) {
    throw new Error('Invalid referral link');
  }
  const url = new URL(referralLink, origin);
  return `${origin}${url.pathname}${url.search}${url.hash}`;
}

export function getProductShareMessage(product, referralLink, includeImage = true) {
  const description = product.description || '';
  const truncatedDescription = description.length > 150 ? description.substring(0, 150) + '...' : description;
  const image = includeImage && product.primary_image ? '\n\n📸 Product Image:\n' + product.primary_image : '';

  return `🛍️ *${product.name}*\n\n${truncatedDescription}\n\n💰 *Price:* ₹${product.selling_price}\n\n🔗 *Shop Now:*\n${referralLink}${image}`;
}
