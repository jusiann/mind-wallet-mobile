const END_BUTTONS = [
    { id: 'end_analyze', label: 'Analyze', payload: { action: 'start_analysis' } },
    { id: 'end_transaction', label: 'Add transaction', payload: { action: 'start_transaction' } },
    { id: 'end_goal', label: 'Create goal', payload: { action: 'start_goal' } },
    { id: 'end_done', label: 'No, thanks', payload: { action: 'done' } },
];

export const responderNode = async (state) => {
    const { classification, pendingData, warning, wastefulCategories, detectedSavings,
            optimizedRoute, buttonPayload, message, activeGoals } = state;

    if (classification === 'TRANSACTION') {
        if (!pendingData || pendingData.type !== 'transaction')
            return {
                message: message || 'Could not understand the transaction details. Please try again.',
                buttons: END_BUTTONS,
            };

        const { amount, transactionType, category, description } = pendingData;
        const typeLabel = transactionType === 'INCOME' ? 'income' : 'expense';

        let msg = warning
            ? `${warning}\n\nDo you still want me to save the ${amount} TRY ${category} ${typeLabel}?`
            : `Shall I save the ${amount} TRY ${category} ${typeLabel}?`;

        if (description && description !== state.currentInput)
            msg += ` (${description})`;

        return {
            message: msg,
            buttons: [
                { id: 'confirm_yes', label: 'Yes, save', payload: { action: 'confirm_transaction', transaction: pendingData } },
                { id: 'confirm_no', label: 'Cancel', payload: { action: 'cancel' } },
            ],
        };
    }

    if (buttonPayload?.action === 'set_deadline') {
        const goalData = buttonPayload.pendingGoalData ?? (pendingData?.type === 'goal' ? pendingData : null);

        if (!goalData)
            return {
                message: 'Goal data not found. Please try again.',
                buttons: END_BUTTONS,
            };

        const months = buttonPayload.months;
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + months);
        const deadlineStr = deadline.toISOString().split('T')[0];
        const goalWithDeadline = { ...goalData, deadline: deadlineStr };

        return {
            message: `${goalData.target_amount.toLocaleString('tr-TR')} TRY goal, ${months}-month deadline (${deadlineStr}). Shall I create it?`,
            buttons: [
                { id: 'goal_confirm', label: 'Yes, create', payload: { action: 'confirm_goal', goal: goalWithDeadline } },
                { id: 'goal_cancel', label: 'Cancel', payload: { action: 'cancel' } },
            ],
        };
    }

    if (classification === 'GOAL_CREATION') {
        if (!pendingData || pendingData.type !== 'goal')
            return {
                message: message || 'Could not understand the goal details. Please try again.',
                buttons: END_BUTTONS,
            };

        return {
            message: `Setting a ${pendingData.target_amount.toLocaleString('tr-TR')} TRY goal for ${pendingData.title}. By when do you want to save it?`,
            buttons: [
                { id: 'dl_3m', label: '3 months', payload: { action: 'set_deadline', months: 3, pendingGoalData: pendingData } },
                { id: 'dl_6m', label: '6 months', payload: { action: 'set_deadline', months: 6, pendingGoalData: pendingData } },
                { id: 'dl_1y', label: '1 year', payload: { action: 'set_deadline', months: 12, pendingGoalData: pendingData } },
                { id: 'dl_2y', label: '2 years', payload: { action: 'set_deadline', months: 24, pendingGoalData: pendingData } },
            ],
        };
    }

    if (buttonPayload?.action === 'reduce_category') {
        const cat = buttonPayload.category;
        const hasGoals = activeGoals?.length > 0;

        return {
            message: `What would you like to do to reduce your ${cat} spending?`,
            buttons: [
                { id: 'tip_budget', label: 'Give tips', payload: { action: 'get_tips', category: cat } },
                ...(hasGoals ? [{ id: 'tip_route', label: 'Route to goal', payload: { action: 'route_savings', category: cat, amount: buttonPayload.amount } }] : []),
                { id: 'tip_back', label: 'Go back', payload: { action: 'back_to_analysis' } },
            ],
        };
    }

    if (buttonPayload?.action === 'get_tips') {
        return {
            message: message || `Tips for reducing your ${buttonPayload.category} spending are ready.`,
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
            message: `Shall ${amount > 0 ? `${amount.toLocaleString('tr-TR')} TRY` : 'savings'} be routed to your ${goalTitle} goal?`,
            buttons: [
                { id: 'route_yes', label: 'Yes, route', payload: { action: 'confirm_routing', route } },
                { id: 'route_no', label: 'Later', payload: { action: 'cancel' } },
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
            message: message || 'Which category would you like to reduce?',
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
        message: message || 'Your analysis is ready!',
        buttons: END_BUTTONS,
    };
};
