import { toTR } from '../categoryMap.js';

// ═══════════════════════════════════════════════════════════════
//  Deterministic category delta computation
// ═══════════════════════════════════════════════════════════════

function computeCategoryDeltas(currentMonthTx, previousMonthTx, categories) {
    const nonEssentialIds = new Set(categories.filter((c) => !c.is_essential).map((c) => c.id));
    const sumByCategory = (txs, catId) =>
        txs
            .filter((t) => t.type === 'EXPENSE' && String(t.category_id) === String(catId) && nonEssentialIds.has(Number(catId)))
            .reduce((s, t) => s + Number(t.amount), 0);

    const categoryIds = [...new Set([...currentMonthTx.map((t) => t.category_id), ...previousMonthTx.map((t) => t.category_id)])]
        .filter((id) => nonEssentialIds.has(Number(id)));

    const deltas = categoryIds
        .map((catId) => {
            const currentSpent = sumByCategory(currentMonthTx, catId);
            const previousSpent = sumByCategory(previousMonthTx, catId);
            const delta = currentSpent - previousSpent;
            const catName =
                currentMonthTx.find((t) => String(t.category_id) === String(catId))?.category_name ??
                previousMonthTx.find((t) => String(t.category_id) === String(catId))?.category_name ??
                'Diğer';
            return { catId: Number(catId), name: catName, currentSpent, previousSpent, delta };
        })
        .filter((d) => d.delta > 50)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3);

    const detectedSavings = Math.round(deltas.reduce((s, d) => s + d.delta, 0));
    return { deltas, detectedSavings };
}

function fallbackSavings(currentMonthTx, categories) {
    const nonEssentialIds = new Set(categories.filter((c) => !c.is_essential).map((c) => c.id));
    const nonEssentialTotal = currentMonthTx
        .filter((t) => t.type === 'EXPENSE' && nonEssentialIds.has(Number(t.category_id)))
        .reduce((s, t) => s + Number(t.amount), 0);

    const savings = Math.round(nonEssentialTotal * 0.2);
    const byCategory = {};
    for (const t of currentMonthTx) {
        if (t.type !== 'EXPENSE' || !nonEssentialIds.has(Number(t.category_id))) continue;
        const key = t.category_id;
        if (!byCategory[key]) byCategory[key] = { name: t.category_name ?? 'Diğer', total: 0 };
        byCategory[key].total += Number(t.amount);
    }

    const deltas = Object.entries(byCategory)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 3)
        .map(([catId, { name, total }]) => ({
            catId: Number(catId),
            name,
            currentSpent: total,
            previousSpent: 0,
            delta: Math.round(total * 0.2),
        }));

    return { deltas, detectedSavings: savings, isFallback: true };
}

// ═══════════════════════════════════════════════════════════════
//  Analysis Node — LangGraph Node Function (No Gemini call)
// ═══════════════════════════════════════════════════════════════

export const analysisNode = async (state) => {
    const { context, input } = state;
    const { currentMonthTx = [], previousMonthTx = [], categories = [], activeGoals = [] } = context;

    const currentExpenses = currentMonthTx.filter((t) => t.type === 'EXPENSE');
    if (currentExpenses.length === 0) {
        return {
            analysisResult: {
                deltas: [],
                detectedSavings: 0,
                isFallback: false,
                hasData: false,
                message: 'Analiz için yeterli harcama verisi bulunamadı.',
            },
        };
    }

    const hasPreviousData = previousMonthTx.filter((t) => t.type === 'EXPENSE').length > 0;
    let deltas, detectedSavings, isFallback;

    if (hasPreviousData) {
        ({ deltas, detectedSavings } = computeCategoryDeltas(currentMonthTx, previousMonthTx, categories));
        isFallback = false;
    } else {
        ({ deltas, detectedSavings, isFallback } = fallbackSavings(currentMonthTx, categories));
    }

    let message;
    if (isFallback) {
        const totalCurrentMonth = currentExpenses.reduce((s, t) => s + Number(t.amount), 0);
        message = `Önceki ay verisi yok; bu ay zorunlu olmayan kategorilerde toplam ${totalCurrentMonth.toLocaleString('tr-TR')} TL harcandı. Önerilen tasarruf: ${detectedSavings.toLocaleString('tr-TR')} TL (%20).`;
    } else {
        message = deltas.length > 0
            ? `Bu ay zorunlu olmayan bazı harcamalarında artış var. Toplamda ${detectedSavings.toLocaleString('tr-TR')} TL tasarruf edebilirsin.`
            : `Bu ay harcamaların geçen ayla benzer, tespit edilen anlamlı artış yok. Harika gidiyorsun!`;
    }

    return {
        analysisResult: {
            deltas,
            detectedSavings,
            isFallback,
            hasData: true,
            message,
            activeGoals,
            input,
        },
    };
};

// Export for use in responder
export { computeCategoryDeltas, fallbackSavings };
