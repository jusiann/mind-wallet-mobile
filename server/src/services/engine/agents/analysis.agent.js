import { toTR } from '../categoryMap.js';

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

function buildCategoryButtons(categoryDeltas = []) {
    return categoryDeltas.map((d, i) => {
        const label = `${toTR(d.name)} (+${Number(d.delta).toLocaleString('tr-TR')} TL)`;
        return {
            id: `cat_${i}`,
            label,
            payload: { action: 'reduce_category', category: d.name, amount: d.currentSpent, delta: d.delta },
        };
    });
}

const END_BUTTONS = [
    { id: 'end_analyze', label: 'Aylık Özet', payload: { action: 'start_analysis' } },
    { id: 'end_transaction', label: 'İşlem Ekle', payload: { action: 'start_transaction' } },
    { id: 'end_goal', label: 'Hedef Oluştur', payload: { action: 'start_goal' } },
    { id: 'end_done', label: 'Hayır, teşekkürler', payload: { action: 'done' } },
];

export const analysisAgent = async (ctx, input, actionPayload, chatHistory) => {
    const { currentMonthTx = [], previousMonthTx = [], categories = [], activeGoals = [] } = ctx;

    const currentExpenses = currentMonthTx.filter((t) => t.type === 'EXPENSE');
    if (currentExpenses.length === 0) {
        return { message: 'Analiz için yeterli harcama verisi bulunamadı.', buttons: END_BUTTONS, classification: 'ANALYSIS' };
    }

    const hasPreviousData = previousMonthTx.filter((t) => t.type === 'EXPENSE').length > 0;

    let deltas, detectedSavings, isFallback;
    if (hasPreviousData) {
        ({ deltas, detectedSavings } = computeCategoryDeltas(currentMonthTx, previousMonthTx, categories));
        isFallback = false;
    } else {
        ({ deltas, detectedSavings, isFallback } = fallbackSavings(currentMonthTx, categories));
    }

    // Process actions first
    if (actionPayload?.action === 'route_savings') {
        const amount = actionPayload.amount ?? detectedSavings ?? 0;
        const cat = actionPayload.category ?? null;

        if (activeGoals?.length > 1) {
            return {
                classification: 'ANALYSIS',
                message: `${amount > 0 ? `${Number(amount).toLocaleString('tr-TR')} TL tasarruf taahhüdünü` : 'Tasarruf taahhüdünü'} hangi hedefe yönlendirmek istersin?`,
                buttons: [
                    ...activeGoals.slice(0, 3).map((g, i) => ({
                        id: `route_goal_${i}`,
                        label: g.title,
                        payload: { action: 'confirm_pledge', pledge: { goalId: g.id, goalTitle: g.title, amount, category: cat, categorySpent: actionPayload.categorySpent ?? 0 } },
                    })),
                    { id: 'route_cancel', label: 'Sonra', payload: { action: 'cancel' } },
                ],
            };
        }

        const targetGoal = activeGoals?.[0];
        if (targetGoal) {
            return {
                classification: 'ANALYSIS',
                message: `${amount > 0 ? `${Number(amount).toLocaleString('tr-TR')} TL` : 'Tasarruf taahhüdü'} "${targetGoal.title}" hedefine söz olarak eklensin mi?\n\nBu ay bu kategoride gerçekten daha az harcarsan, tutarı hedefe aktaracağım.`,
                buttons: [
                    { id: 'route_yes', label: 'Evet, söz ver', payload: { action: 'confirm_pledge', pledge: { goalId: targetGoal.id, goalTitle: targetGoal.title, amount, category: cat, categorySpent: actionPayload.categorySpent ?? 0 } } },
                    { id: 'route_no', label: 'Sonra', payload: { action: 'cancel' } },
                ],
            };
        }

        return {
            classification: 'ANALYSIS',
            message: 'Aktif hedefin yok. Önce bir hedef oluştur.',
            buttons: [{ id: 'gc_create', label: 'Hedef Oluştur', payload: { action: 'start_goal' } }],
        };
    }

    if (actionPayload?.action === 'reduce_category') {
        const cat = actionPayload.category;
        const hasGoals = activeGoals?.length > 0;
        const totalSpent = actionPayload.amount ?? 0;
        const delta = actionPayload.delta ?? 0;
        const half = Math.round(delta / 2);

        const spentStr = Number(totalSpent).toLocaleString('tr-TR');
        const deltaStr = Number(delta).toLocaleString('tr-TR');
        const halfStr = Number(half).toLocaleString('tr-TR');
        const catTR = toTR(cat);

        let msg = delta > 0
            ? `${catTR} harcaman bu ay geçen aya göre ${deltaStr} TL fazla (toplam ${spentStr} TL). Ne kadarını tasarruf etmek istersin?`
            : `${catTR} kategorisinde bu ay ${spentStr} TL harcadın. Ne yapmak istersin?`;

        const savingsButtons = delta > 0 && hasGoals
            ? [
                { id: 'tip_route_all', label: `Tamamını (${deltaStr} TL)`, payload: { action: 'route_savings', category: cat, amount: delta, categorySpent: totalSpent } },
                ...(half > 0 ? [{ id: 'tip_route_half', label: `Yarısını (${halfStr} TL)`, payload: { action: 'route_savings', category: cat, amount: half, categorySpent: totalSpent } }] : []),
            ]
            : [];

        return {
            classification: 'ANALYSIS',
            message: msg,
            buttons: [
                { id: 'tip_budget', label: 'İpuçları ver', payload: { action: 'get_tips', category: cat } },
                ...savingsButtons,
                { id: 'tip_back', label: 'İptal', payload: { action: 'cancel' } },
            ],
        };
    }

    // Default Analysis Response
    const catButtons = buildCategoryButtons(deltas);
    const hasGoals = activeGoals?.length > 0;
    const hasSavings = detectedSavings > 0;

    let message;
    if (isFallback) {
        const totalCurrentMonth = currentExpenses.reduce((s, t) => s + Number(t.amount), 0);
        message = `Önceki ay verisi yok; bu ay zorunlu olmayan kategorilerde toplam ${totalCurrentMonth.toLocaleString('tr-TR')} TL harcandı. Önerilen tasarruf: ${detectedSavings.toLocaleString('tr-TR')} TL (%20).`;
    } else {
        message = deltas.length > 0
            ? `Bu ay zorunlu olmayan bazı harcamalarında artış var. Toplamda ${detectedSavings.toLocaleString('tr-TR')} TL tasarruf edebilirsin.`
            : `Bu ay harcamaların geçen ayla benzer, tespit edilen anlamlı artış yok. Harika gidiyorsun!`;
    }

    if (/tasarruf/i.test(input ?? '')) {
        const buttons = [];
        if (hasGoals && hasSavings) {
            buttons.push({ id: 'route_savings_main', label: `${Number(detectedSavings).toLocaleString('tr-TR')} TL → Söz Ver`, payload: { action: 'route_savings', amount: detectedSavings } });
        }
        if (catButtons[0]) buttons.push(catButtons[0]);
        if (catButtons[1]) buttons.push(catButtons[1]);
        return { classification: 'ANALYSIS', message, buttons: buttons.length ? buttons : END_BUTTONS };
    }

    if (/nasıl gidiy|bu ay/i.test(input ?? '')) {
        const buttons = [...catButtons.slice(0, 2)];
        if (hasGoals && hasSavings) {
            buttons.push({ id: 'route_savings_status', label: `${Number(detectedSavings).toLocaleString('tr-TR')} TL Tasarruf Sözü`, payload: { action: 'route_savings', amount: detectedSavings } });
        } else {
            buttons.push({ id: 'status_end', label: 'Tamam', payload: { action: 'done' } });
        }
        return { classification: 'ANALYSIS', message, buttons: buttons.length ? buttons : END_BUTTONS };
    }

    return { classification: 'ANALYSIS', message, buttons: catButtons.length ? catButtons : END_BUTTONS, detectedSavings };
};
