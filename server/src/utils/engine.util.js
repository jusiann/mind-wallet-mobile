export const CATEGORY_TR = {
    'Food & Groceries': 'Market',
    'Eating Out': 'Yemek',
    'Transportation': 'Ulaşım',
    'Rent & Bills': 'Kira & Faturalar',
    'Entertainment': 'Eğlence',
    'Health': 'Sağlık',
    'Clothing': 'Giyim',
    'Education': 'Eğitim',
    'Subscriptions': 'Abonelikler',
    'Other': 'Diğer',
    'Salary': 'Maaş',
    'Freelance': 'Serbest Çalışma',
    'Investment': 'Yatırım',
    'Gift': 'Hediye',
    'Rental Income': 'Kira Geliri',
    'Cash': 'Nakit',
};

export const toTR = (name) => CATEGORY_TR[name] ?? name;

let _lastPicks = {};

export function pickRandom(key, variants) {
    if (variants.length <= 1) return variants[0];
    const lastIdx = _lastPicks[key] ?? -1;
    let idx;
    do {
        idx = Math.floor(Math.random() * variants.length);
    } while (idx === lastIdx && variants.length > 1);
    _lastPicks[key] = idx;
    return variants[idx];
}

export function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

export function findGoalByTitle(input, goals) {
    const lower = input.toLowerCase();
    const subMatch = goals.find((g) => lower.includes(g.title.toLowerCase()));
    if (subMatch) return subMatch;
    return goals.find((g) => levenshtein(lower, g.title.toLowerCase()) <= 2) ?? null;
}

export function buildCategoryButtons(categoryDeltas = []) {
    return categoryDeltas.map((d, i) => {
        const label = `${toTR(d.name)} (+${Number(d.delta).toLocaleString('tr-TR')} TL)`;
        return {
            id: `cat_${i}`,
            label,
            payload: { action: 'reduce_category', category: d.name, amount: d.currentSpent, delta: d.delta },
        };
    });
}
