const END_BUTTONS = [
    { id: 'end_analyze', label: 'Analiz et', payload: { action: 'start_analysis' } },
    { id: 'end_transaction', label: 'Islem gir', payload: { action: 'start_transaction' } },
    { id: 'end_goal', label: 'Hedef olustur', payload: { action: 'start_goal' } },
    { id: 'end_done', label: 'Hayır, tamam', payload: { action: 'done' } },
];

export const responderNode = async (state) => {
    const { classification, pendingData, warning, wastefulCategories, detectedSavings,
            optimizedRoute, buttonPayload, message, activeGoals } = state;

    if (classification === 'TRANSACTION') {
        if (!pendingData || pendingData.type !== 'transaction')
            return {
                message: message || 'İşlem bilgilerini anlayamadım. Lütfen tekrar deneyin.',
                buttons: END_BUTTONS,
            };

        const { amount, transactionType, category, description } = pendingData;
        const typeLabel = transactionType === 'INCOME' ? 'gelir' : 'gider';

        let msg = warning
            ? `${warning}\n\n${amount} TL ${category} ${typeLabel}ini yine de kaydetmemi ister misin?`
            : `${amount} TL ${category} ${typeLabel}ini kaydedeyim mi?`;

        if (description && description !== state.currentInput)
            msg += ` (${description})`;

        return {
            message: msg,
            buttons: [
                { id: 'confirm_yes', label: 'Evet, kaydet', payload: { action: 'confirm_transaction', transaction: pendingData } },
                { id: 'confirm_no', label: 'Iptal', payload: { action: 'cancel' } },
            ],
        };
    }

    if (buttonPayload?.action === 'set_deadline') {
        const goalData = buttonPayload.pendingGoalData ?? (pendingData?.type === 'goal' ? pendingData : null);

        if (!goalData)
            return {
                message: 'Hedef bilgisi bulunamadı. Lütfen tekrar deneyin.',
                buttons: END_BUTTONS,
            };

        const months = buttonPayload.months;
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + months);
        const deadlineStr = deadline.toISOString().split('T')[0];
        const goalWithDeadline = { ...goalData, deadline: deadlineStr };

        return {
            message: `${goalData.target_amount.toLocaleString('tr-TR')} TL hedef, ${months} aylık süre (${deadlineStr}). Oluşturayım mı?`,
            buttons: [
                { id: 'goal_confirm', label: 'Evet, oluştur', payload: { action: 'confirm_goal', goal: goalWithDeadline } },
                { id: 'goal_cancel', label: 'Iptal', payload: { action: 'cancel' } },
            ],
        };
    }

    if (classification === 'GOAL_CREATION') {
        if (!pendingData || pendingData.type !== 'goal')
            return {
                message: message || 'Hedef bilgilerini anlayamadım. Lütfen tekrar deneyin.',
                buttons: END_BUTTONS,
            };

        return {
            message: `${pendingData.title} için ${pendingData.target_amount.toLocaleString('tr-TR')} TL hedef belirliyorum. Ne zamana kadar biriktirmek istersin?`,
            buttons: [
                { id: 'dl_3m', label: '3 ay', payload: { action: 'set_deadline', months: 3, pendingGoalData: pendingData } },
                { id: 'dl_6m', label: '6 ay', payload: { action: 'set_deadline', months: 6, pendingGoalData: pendingData } },
                { id: 'dl_1y', label: '1 yıl', payload: { action: 'set_deadline', months: 12, pendingGoalData: pendingData } },
                { id: 'dl_2y', label: '2 yıl', payload: { action: 'set_deadline', months: 24, pendingGoalData: pendingData } },
            ],
        };
    }

    if (buttonPayload?.action === 'reduce_category') {
        const cat = buttonPayload.category;
        const hasGoals = activeGoals?.length > 0;

        return {
            message: `${cat} harcamalarını azaltmak için ne yapmak istersin?`,
            buttons: [
                { id: 'tip_budget', label: 'Ipuçları ver', payload: { action: 'get_tips', category: cat } },
                ...(hasGoals ? [{ id: 'tip_route', label: 'Hedefe aktar', payload: { action: 'route_savings', category: cat, amount: buttonPayload.amount } }] : []),
                { id: 'tip_back', label: 'Geri don', payload: { action: 'back_to_analysis' } },
            ],
        };
    }

    if (buttonPayload?.action === 'get_tips') {
        return {
            message: message || `${buttonPayload.category} harcamalarını azaltmak için öneriler hazırlandı.`,
            buttons: END_BUTTONS,
        };
    }

    if (buttonPayload?.action === 'route_savings' || buttonPayload?.action === 'confirm_routing') {
        const targetGoal = activeGoals?.[0];
        const route = optimizedRoute ?? (targetGoal ? {
            goalId: targetGoal.id,
            goalTitle: targetGoal.title,
            amount: buttonPayload?.amount ?? detectedSavings ?? 0,
        } : null);

        const goalTitle = route?.goalTitle ?? 'hedefinize';
        const amount = route?.amount ?? 0;

        return {
            message: `${amount > 0 ? `${amount.toLocaleString('tr-TR')} TL` : 'Tasarruf'} ${goalTitle} hedefine aktarılsın mı?`,
            buttons: [
                { id: 'route_yes', label: 'Evet, aktar', payload: { action: 'confirm_routing', route } },
                { id: 'route_no', label: 'Sonra', payload: { action: 'cancel' } },
            ],
        };
    }

    if (buttonPayload?.action === 'back_to_analysis' || buttonPayload?.action === 'start_analysis') {
        const catButtons = (wastefulCategories ?? []).slice(0, 3).map((c, i) => ({
            id: `cat_${i}`,
            label: `${c.name} — ${Number(c.amount).toLocaleString('tr-TR')} TL`,
            payload: { action: 'reduce_category', category: c.name, amount: c.amount },
        }));
        return {
            message: message || 'Hangi kategoriyi azaltmak istersin?',
            buttons: catButtons.length ? catButtons : END_BUTTONS,
        };
    }

    const catButtons = (wastefulCategories ?? []).slice(0, 3).map((c, i) => ({
        id: `cat_${i}`,
        label: `${c.name} — ${Number(c.amount).toLocaleString('tr-TR')} TL`,
        payload: { action: 'reduce_category', category: c.name, amount: c.amount },
    }));

    if (catButtons.length > 0)
        return { message, buttons: catButtons };

    return {
        message: message || 'Analizin hazır!',
        buttons: END_BUTTONS,
    };
};
