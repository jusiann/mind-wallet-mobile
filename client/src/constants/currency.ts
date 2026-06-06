export const CURRENCIES = {
    TRY: { code: 'TRY', symbol: '₺', locale: 'tr-TR', flag: '🇹🇷', label: 'Türk Lirası' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', flag: '🇺🇸', label: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', flag: '🇪🇺', label: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', flag: '🇬🇧', label: 'British Pound' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatCurrency(amount: number, code: CurrencyCode = 'TRY'): string {
    const config = CURRENCIES[code] || CURRENCIES.TRY;
    return `${config.symbol}${parseFloat(String(amount)).toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyShort(amount: number, code: CurrencyCode = 'TRY'): string {
    const config = CURRENCIES[code] || CURRENCIES.TRY;
    const num = parseFloat(String(amount));
    let formattedAmount = '';
    
    if (num >= 1_000_000) {
        formattedAmount = `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
        formattedAmount = `${(num / 1_000).toFixed(1)}B`;
    } else {
        formattedAmount = `${num.toFixed(0)}`;
    }
    
    return `${config.symbol}${formattedAmount}`;
}
