export const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', display: 'INR - Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', display: 'USD - US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', display: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound Sterling', display: 'GBP - British Pound Sterling', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', display: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', display: 'AUD - Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', display: 'CAD - Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', display: 'CHF - Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', display: 'CNY - Chinese Yuan', symbol: '¥' },
  { code: 'AED', name: 'United Arab Emirates Dirham', display: 'AED - United Arab Emirates Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', display: 'SAR - Saudi Riyal', symbol: '﷼' },
  { code: 'SGD', name: 'Singapore Dollar', display: 'SGD - Singapore Dollar', symbol: 'S$' },
  { code: 'KWD', name: 'Kuwaiti Dinar', display: 'KWD - Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'OMR', name: 'Omani Rial', display: 'OMR - Omani Rial', symbol: 'ر.ع.' },
  { code: 'BHD', name: 'Bahraini Dinar', display: 'BHD - Bahraini Dinar', symbol: '.د.ب' },
  { code: 'QAR', name: 'Qatari Rial', display: 'QAR - Qatari Rial', symbol: 'ر.ق' },
];

export const getCurrencyDisplay = (currency) => {
  if (!currency) return '₹';
  // Check if it's already a symbol (safety check)
  if (currency === '₹') return '₹';
  
  // Standardize Indian Rupee
  if (currency.startsWith('INR')) return '₹';
  
  // Extract code from formats like "AED - United Arab Emirates Dirham" or "AED-Dirham"
  // Using a regex to split by space, dash, or other common separators
  const code = currency.split(/[ -]/)[0].trim();
  
  // If the result is 'INR', return symbol
  if (code === 'INR') return '₹';
  
  // Find symbol in CURRENCIES list
  const found = CURRENCIES.find(c => c.code === code);
  if (found && found.symbol) return found.symbol;
  
  return code;
};
