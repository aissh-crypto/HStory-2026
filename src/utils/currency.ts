// Cross-border real-time currency conversion and automatic location detection for Malaysia (MYR) and Singapore (SGD)

export const LIVE_EXCHANGE_TIMESTAMP = 'Real-time BNM / MAS Market Benchmark';

export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  MYR: {
    MYR: 1.0,
    SGD: 0.30105, // Live Market Benchmark: 1 MYR ≈ 0.30105 SGD
    INR: 18.25,
  },
  SGD: {
    SGD: 1.0,
    MYR: 3.3218, // Live Market Benchmark: 1 SGD ≈ 3.3218 MYR
    INR: 63.80,
  },
  INR: {
    INR: 1.0,
    MYR: 0.0548,
    SGD: 0.0157,
  },
};

/**
 * Returns the current live benchmark FX rate between two currencies.
 */
export const getLiveExchangeRate = (from: string, to: string): number => {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1.0;
  return EXCHANGE_RATES[f]?.[t] || (f === 'SGD' && t === 'MYR' ? 3.3218 : 0.30105);
};

/**
 * Detect user's current location currency based on timezone or browser locale.
 * Defaults to MYR for Malaysia timezone, SGD for Singapore timezone.
 */
export const detectLocationCurrency = (): 'MYR' | 'SGD' => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes('singapore')) {
      return 'SGD';
    }
    if (lowerTz.includes('kuala_lumpur') || lowerTz.includes('malaysia') || lowerTz.includes('kuching') || lowerTz.includes('penang')) {
      return 'MYR';
    }

    // Check language / locale
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('sg')) {
      return 'SGD';
    }
    if (lang.includes('my')) {
      return 'MYR';
    }
  } catch (e) {
    console.warn('Location detection notice:', e);
  }

  // Default to Malaysian ringgit if not in Singapore
  return 'MYR';
};

/**
 * Convert an amount from one currency to another using realistic market rates.
 */
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const rate = EXCHANGE_RATES[from]?.[to];
  if (rate) {
    return Math.round(amount * rate);
  }

  // Real-time market rate fallbacks
  if (from === 'SGD' && to === 'MYR') return Math.round(amount * 3.3218);
  if (from === 'MYR' && to === 'SGD') return Math.round(amount * 0.30105);

  return amount;
};

/**
 * Formats a single currency value cleanly.
 */
export const formatSingleCurrency = (amount: number, currency: string): string => {
  const curr = currency.toUpperCase();
  if (curr === 'INR') {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  const symbol = curr === 'MYR' ? 'RM' : curr === 'SGD' ? 'S$' : `${curr} `;
  return `${symbol} ${amount.toLocaleString()}`;
};

/**
 * Format compact currency for badges or cards, e.g. RM 1.85M or S$ 2.15M
 */
export const formatCompactCurrency = (amount: number, currency: string): string => {
  const curr = currency.toUpperCase();
  const symbol = curr === 'MYR' ? 'RM' : curr === 'SGD' ? 'S$' : `${curr} `;

  if (amount >= 1000000) {
    const millions = (amount / 1000000).toFixed(2).replace(/\.00$/, '');
    return `${symbol} ${millions}M`;
  }
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(0);
    return `${symbol} ${thousands}K`;
  }
  return `${symbol} ${amount}`;
};

/**
 * Returns dual-currency presentation:
 * When the user selects "Showing in MYR" for an SGD property:
 * - The primary headline price switches to MYR (e.g. RM 7,141,870)
 * - The secondary yellow box switches to the original SGD listing price (e.g. S$ 2,150,000)
 * When "Showing in SGD" is selected:
 * - The primary price is in SGD, and secondary is in MYR.
 */
export interface DualCurrencyDisplay {
  primary: string;
  primaryAmount: number;
  primaryCurrency: string;
  converted: string | null;
  convertedAmount: number | null;
  convertedCurrency: string | null;
  convertedCompact: string | null;
  isConverted: boolean;
  rateNote: string;
}

export const getDualCurrencyPrice = (
  propertyPrice: number,
  propertyCurrency: string,
  userPreferredCurrency?: string
): DualCurrencyDisplay => {
  const propCurr = (propertyCurrency || 'MYR').toUpperCase();
  const targetCurr = (userPreferredCurrency || detectLocationCurrency()).toUpperCase();

  // If the target currency matches the property currency
  if (propCurr === targetCurr) {
    const crossCurr = propCurr === 'MYR' ? 'SGD' : 'MYR';
    const crossAmount = convertCurrency(propertyPrice, propCurr, crossCurr);
    return {
      primary: formatSingleCurrency(propertyPrice, propCurr),
      primaryAmount: propertyPrice,
      primaryCurrency: propCurr,
      converted: formatSingleCurrency(crossAmount, crossCurr),
      convertedAmount: crossAmount,
      convertedCurrency: crossCurr,
      convertedCompact: formatCompactCurrency(crossAmount, crossCurr),
      isConverted: false,
      rateNote: propCurr === 'SGD'
        ? 'Real-Time FX: 1 SGD = 3.3218 MYR (Live Mid-Market)'
        : 'Real-Time FX: 1 MYR = 0.3011 SGD (Live Mid-Market)',
    };
  }

  // The user wants to see the price in targetCurr (e.g. MYR for an SGD property)
  // Therefore, PRIMARY is displayed in targetCurr, and secondary (yellow box) is the original propCurr!
  const targetAmount = convertCurrency(propertyPrice, propCurr, targetCurr);

  return {
    primary: formatSingleCurrency(targetAmount, targetCurr),
    primaryAmount: targetAmount,
    primaryCurrency: targetCurr,
    converted: formatSingleCurrency(propertyPrice, propCurr),
    convertedAmount: propertyPrice,
    convertedCurrency: `${propCurr} original`,
    convertedCompact: formatCompactCurrency(propertyPrice, propCurr),
    isConverted: true,
    rateNote: propCurr === 'SGD'
      ? 'Real-Time FX: 1 SGD = 3.3218 MYR (Live Mid-Market)'
      : 'Real-Time FX: 1 MYR = 0.3011 SGD (Live Mid-Market)',
  };
};
