import { toTR } from '../../../utils/engine.util.js';

// ═══════════════════════════════════════════════════════════════
//  Deterministic category delta computation & forecasting
// ═══════════════════════════════════════════════════════════════

function findSubscriptions(currentMonthTx, previousMonthTx) {
    const currentExp = currentMonthTx.filter(t => t.type === 'EXPENSE');
    const prevExp = previousMonthTx.filter(t => t.type === 'EXPENSE');
    const subscriptions = [];

    for (const curr of currentExp) {
        const match = prevExp.find(p => 
            p.category_id === curr.category_id && 
            Math.abs(Number(p.amount) - Number(curr.amount)) < 10 &&
            (curr.category_name?.toLowerCase().match(/(abonelik|eğlence|spor|dijital|fatura)/i) || 
             curr.description?.toLowerCase().match(/(netflix|spotify|youtube|gym|amazon|premium|macfit|exxen|blutv)/i))
        );
        
        if (match && !subscriptions.find(s => s.category_id === curr.category_id && Math.abs(Number(s.amount) - Number(curr.amount)) < 10)) {
             subscriptions.push({
                 category_id: curr.category_id,
                 name: curr.description || curr.category_name || 'Abonelik',
                 amount: curr.amount
             });
        }
    }
    return subscriptions;
}

function computeCashFlowForecast(currentMonthTx, user) {
    if (!user || !user.monthly_income) return null;
    
    const currentExp = currentMonthTx.filter(t => t.type === 'EXPENSE');
    const totalSpent = currentExp.reduce((s, t) => s + Number(t.amount), 0);
    
    // With 30-day rolling data, totalSpent is already the 30-day projection.
    const projectedTotal = totalSpent;
    const dailyBurnRate = totalSpent / 30;
    
    const income = Number(user.monthly_income);
    if (projectedTotal > income * 0.9) {
        return {
            isWarning: projectedTotal > income,
            projectedTotal: Math.round(projectedTotal),
            burnRate: Math.round(dailyBurnRate),
            deficit: Math.round(projectedTotal - income)
        };
    }
    return null;
}

function computeCategoryDeltas(currentMonthTx, previousMonthTx, categories, pledges = []) {
    const nonEssentialIds = new Set(categories.filter((c) => !c.is_essential).map((c) => c.id));
    const sumByCategory = (txs, catId) =>
        txs
            .filter((t) => t.type === 'EXPENSE' && String(t.category_id) === String(catId) && nonEssentialIds.has(Number(catId)))
            .reduce((s, t) => s + Number(t.amount), 0);

    const categoryIds = [...new Set([...currentMonthTx.map((t) => t.category_id), ...previousMonthTx.map((t) => t.category_id)])]
        .filter((id) => nonEssentialIds.has(Number(id)));

    const getPledgedAmount = (catId) => {
        const pledge = pledges.find(p => String(p.category_id) === String(catId));
        return pledge ? Number(pledge.total_pledged) : 0;
    };

    const deltas = categoryIds
        .map((catId) => {
            const currentSpent = sumByCategory(currentMonthTx, catId);
            const previousSpent = sumByCategory(previousMonthTx, catId);
            let delta = currentSpent - previousSpent;
            
            const pledged = getPledgedAmount(catId);
            delta = Math.max(0, delta - pledged);

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

function fallbackSavings(currentMonthTx, categories, pledges = []) {
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

    const getPledgedAmount = (catId) => {
        const pledge = pledges.find(p => String(p.category_id) === String(catId));
        return pledge ? Number(pledge.total_pledged) : 0;
    };

    const deltas = Object.entries(byCategory)
        .map(([catId, { name, total }]) => {
            const potentialSavings = Math.round(total * 0.2);
            const pledged = getPledgedAmount(catId);
            const delta = Math.max(0, potentialSavings - pledged);
            return {
                catId: Number(catId),
                name,
                currentSpent: total,
                previousSpent: 0,
                delta,
            };
        })
        .filter((d) => d.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3);
    const totalSavings = Math.round(deltas.reduce((s, d) => s + d.delta, 0));

    return { deltas, detectedSavings: totalSavings, isFallback: true };
}

// ═══════════════════════════════════════════════════════════════
//  Analysis Node — LangGraph Node Function (No Gemini call)
// ═══════════════════════════════════════════════════════════════

export const analysisNode = async (state) => {
    const { context, input } = state;
    const { currentMonthTx = [], previousMonthTx = [], categories = [], activeGoals = [] } = context;

    const currentExpenses = currentMonthTx.filter((t) => t.type === 'EXPENSE');
    const previousExpenses = previousMonthTx.filter((t) => t.type === 'EXPENSE');

    if (currentExpenses.length === 0 && previousExpenses.length === 0) {
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

    const hasPreviousData = previousExpenses.length > 0;
    let deltas, detectedSavings, isFallback;
    let targetMonthTx = currentExpenses.length > 0 ? currentMonthTx : previousMonthTx;

    if (currentExpenses.length > 0 && hasPreviousData) {
        ({ deltas, detectedSavings } = computeCategoryDeltas(currentMonthTx, previousMonthTx, categories, context.pledges));
        isFallback = false;
    } else {
        ({ deltas, detectedSavings, isFallback } = fallbackSavings(targetMonthTx, categories, context.pledges));
    }

    let message;
    if (currentExpenses.length === 0) {
        const totalPreviousMonth = previousExpenses.reduce((s, t) => s + Number(t.amount), 0);
        message = `Son 30 günde henüz harcama verisi yok. Önceki 30 günde zorunlu olmayan kategorilerde toplam ${totalPreviousMonth.toLocaleString('tr-TR')} TL harcandı. Önerilen tasarruf: ${detectedSavings.toLocaleString('tr-TR')} TL (%20).`;
    } else if (isFallback) {
        const totalCurrentMonth = currentExpenses.reduce((s, t) => s + Number(t.amount), 0);
        message = `Önceki 30 güne ait veri yok; son 30 günde zorunlu olmayan kategorilerde toplam ${totalCurrentMonth.toLocaleString('tr-TR')} TL harcandı. Önerilen tasarruf: ${detectedSavings.toLocaleString('tr-TR')} TL (%20).`;
    } else {
        message = deltas.length > 0
            ? `Son 30 günde zorunlu olmayan bazı harcamalarında artış var. Toplamda ${detectedSavings.toLocaleString('tr-TR')} TL tasarruf edebilirsin.`
            : `Son 30 gündeki harcamaların önceki 30 günle benzer, tespit edilen anlamlı artış yok. Harika gidiyorsun!`;
    }

    const subscriptions = findSubscriptions(currentMonthTx, previousMonthTx);
    const cashFlow = computeCashFlowForecast(currentMonthTx, context.user);

    return {
        analysisResult: {
            deltas,
            detectedSavings,
            isFallback,
            hasData: true,
            message,
            activeGoals,
            input,
            subscriptions,
            cashFlow
        },
    };
};

// Export for use in responder
export { computeCategoryDeltas, fallbackSavings };
