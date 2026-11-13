/**
 * Formats a number to Philippine Peso currency string (₱XX.XX)
 * Guarantees a single clean ₱ symbol and prevents doubled ₱₱ or PP displays.
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const parsed = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0).replace(/[^0-9.-]/g, ''));
  const safeAmount = !isNaN(parsed) ? parsed : 0;
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  // Guarantee single ₱ prefix, stripping any duplicate PHP, PP, P, or ₱ prefixes
  return formatted.replace(/^(PHP|PP|P|₱|\s)+/i, '₱');
}

/**
 * Formats a number only (e.g. 1,234.56) without currency symbol
 */
export const formatAmount = (amount: number | string | null | undefined): string => {
  const parsed = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0).replace(/[^0-9.-]/g, ''));
  const safeAmount = !isNaN(parsed) ? parsed : 0;
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Calculates discount percentage saved amount
 */
export const calculateSavings = (price: number, originalPrice?: number): number => {
  if (!originalPrice || originalPrice <= price) return 0
  return originalPrice - price
}

/**
 * Formats age group label nicely
 */
export const formatAgeGroup = (ageGroup: string): string => {
  switch (ageGroup) {
    case '0-2':
      return '0 - 2 Years'
    case '3-5':
      return '3 - 5 Years'
    case '6-8':
      return '6 - 8 Years'
    case '9-12':
      return '9 - 12 Years'
    case '12+':
      return '12+ Years'
    default:
      return 'All Ages'
  }
}
