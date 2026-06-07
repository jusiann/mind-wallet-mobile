export const CURRENCIES = {
    TRY: { code: 'TRY', symbol: '₺', locale: 'tr-TR', flag: '🇹🇷', label: 'Türk Lirası' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', flag: '🇺🇸', label: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', flag: '🇪🇺', label: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', flag: '🇬🇧', label: 'British Pound' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
    TRY: 1,
    USD: 32.5,
    EUR: 35.0,
    GBP: 41.0,
};

const _rateListeners = new Set<() => void>();

export function subscribeExchangeRates(listener: () => void) {
    _rateListeners.add(listener);
    return () => {
        _rateListeners.delete(listener);
    };
}

export function updateExchangeRates(newRates: Record<CurrencyCode, number>) {
    Object.assign(EXCHANGE_RATES, newRates);
    _rateListeners.forEach(fn => fn());
}

export async function fetchExchangeRates() {
    try {
        const response = await fetch('https://doviz.dev/v1/try.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch exchange rates: ${response.status}`);
        }
        const data = await response.json();
        
        const newRates: Record<CurrencyCode, number> = {
            TRY: 1,
            USD: Number(data.USDTRY) || EXCHANGE_RATES.USD,
            EUR: Number(data.EURTRY) || EXCHANGE_RATES.EUR,
            GBP: Number(data.GBPTRY) || EXCHANGE_RATES.GBP,
        };
        
        updateExchangeRates(newRates);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
    }
}


export function formatCurrency(amount: number, code: CurrencyCode = 'TRY'): string {
    const config = CURRENCIES[code] || CURRENCIES.TRY;
    const rate = EXCHANGE_RATES[code] || 1;
    const converted = amount / rate;
    return `${config.symbol}${parseFloat(String(converted)).toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyShort(amount: number, code: CurrencyCode = 'TRY'): string {
    const config = CURRENCIES[code] || CURRENCIES.TRY;
    const rate = EXCHANGE_RATES[code] || 1;
    const converted = parseFloat(String(amount)) / rate;
    
    let formattedAmount = '';
    
    if (converted >= 1_000_000) {
        formattedAmount = `${(converted / 1_000_000).toLocaleString(config.locale, { maximumFractionDigits: 2 })}M`;
    } else {
        // For amounts under 1,000,000, show the full number with up to 2 decimal places (no K abbreviations)
        formattedAmount = `${converted.toLocaleString(config.locale, { maximumFractionDigits: 2 })}`;
    }
    
    return `${config.symbol}${formattedAmount}`;
}
