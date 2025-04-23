export function parsePrice(priceText) {
  const clean = priceText.replace(/[^\d,.-]/g, '').trim();
  return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
}
