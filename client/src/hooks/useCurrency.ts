import { useEffect, useState } from 'react';
import { CURRENCIES, CurrencyCode, EXCHANGE_RATES, formatCurrency, formatCurrencyShort, subscribeExchangeRates } from '../constants/currency';
import { getUserCurrency, subscribeUserCurrency } from '../store/auth';

export function useCurrency() {
    const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(getUserCurrency());
    const [rates, setRates] = useState(EXCHANGE_RATES);

    useEffect(() => {
        const unsubscribeCurrency = subscribeUserCurrency((newCurrency) => {
            setCurrencyCode(newCurrency);
        });
        const unsubscribeRates = subscribeExchangeRates(() => {
            setRates({ ...EXCHANGE_RATES });
        });
        return () => {
            unsubscribeCurrency();
            unsubscribeRates();
        };
    }, []);

    const config = CURRENCIES[currencyCode] || CURRENCIES.TRY;
    const rate = rates[currencyCode] || 1;

    return {
        currency: currencyCode,
        symbol: config.symbol,
        formatCurrency: (amount: number) => formatCurrency(amount, currencyCode),
        formatCurrencyShort: (amount: number) => formatCurrencyShort(amount, currencyCode),
        toBaseCurrency: (amount: number) => amount * rate
    };
}

