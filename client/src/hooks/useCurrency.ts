import { useEffect, useState } from 'react';
import { CURRENCIES, CurrencyCode, formatCurrency, formatCurrencyShort } from '../constants/currency';
import { getUserCurrency, subscribeUserCurrency } from '../store/auth';

export function useCurrency() {
    const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(getUserCurrency());

    useEffect(() => {
        const unsubscribe = subscribeUserCurrency((newCurrency) => {
            setCurrencyCode(newCurrency);
        });
        return unsubscribe;
    }, []);

    const config = CURRENCIES[currencyCode] || CURRENCIES.TRY;

    return {
        currency: currencyCode,
        symbol: config.symbol,
        formatCurrency: (amount: number) => formatCurrency(amount, currencyCode),
        formatCurrencyShort: (amount: number) => formatCurrencyShort(amount, currencyCode)
    };
}
