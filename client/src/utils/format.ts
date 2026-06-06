export function cleanAmountInput(raw: string): string {
    const cleaned = raw.replace(/[^0-9,]/g, '');
    const commaIdx = cleaned.indexOf(',');
    const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
    const decPart = commaIdx === -1 ? '' : cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
    return commaIdx === -1 ? intPart : `${intPart},${decPart}`;
}

export function formatAmountDisplay(raw: string): string {
    const cleaned = raw.replace(/[^0-9,]/g, '');
    if (!cleaned) return '';
    const commaIdx = cleaned.indexOf(',');
    const intPart = commaIdx === -1 ? cleaned : cleaned.slice(0, commaIdx);
    const decPart = commaIdx === -1 ? '' : cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return commaIdx === -1 ? formatted : `${formatted},${decPart}`;
}
