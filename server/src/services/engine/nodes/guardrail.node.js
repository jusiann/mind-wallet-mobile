import { generateText } from '../../gemini.service.js';

export const guardrailNode = async (state) => {
    const { activeGoals } = state;

    let amount, transactionType, category, isEssential, description;

    if (state.pendingData?.type === 'transaction') {
        ({ amount, transactionType, category, description } = state.pendingData);
        
        const catMeta = state.categories?.find(c => c.name.toLowerCase() === category?.toLowerCase());
        isEssential = catMeta?.is_essential ?? null;
    } else if (state.pendingTransaction) {
        amount = state.pendingTransaction.amount;
        transactionType = state.pendingTransaction.type;
        category = state.pendingTransaction.category_name;
        isEssential = state.pendingTransaction.is_essential;
        description = state.pendingTransaction.description;
    } else {
        return { warning: null };
    }

    if (transactionType !== 'EXPENSE' || !activeGoals?.length)
        return { warning: null };

    // Essential categories never receive warnings
    if (isEssential === true)
        return { warning: null };

    // Don't call Gemini if spending doesn't exceed 30% of any goal's remaining amount
    const exceedsThreshold = activeGoals.some(g => {
        const remaining = Number(g.target_amount) - Number(g.current_amount);
        return remaining > 0 && amount > remaining * 0.30;
    });
    if (!exceedsThreshold)
        return { warning: null };

    const goalsJson = JSON.stringify(
        activeGoals.map(g => ({
            title: g.title,
            target: g.target_amount,
            current: g.current_amount,
            deadline: g.deadline,
            progress_pct: g.progress_pct,
        })),
        null, 2,
    );

    const categoryLine = category
        ? `Category: ${category}${isEssential !== null ? ` (${isEssential ? 'essential expense' : 'non-essential expense'})` : ''}`
        : 'Category: Not specified';

    const prompt = `A user wants to make a new purchase.

                    Expense: ${amount} TRY
                    ${categoryLine}
                    Description: ${description ?? 'None'}

                    Active financial goals:
                    ${goalsJson}

                    Evaluation rules:
                    - High spending in non-essential (is_essential=false) categories should be evaluated more carefully.
                    - Warn if the expense amount consumes more than 30% of the remaining amount of any of the user's goals.
                    - If there are no goals or the expense seems reasonable, write "null".

                    Does this expense significantly threaten the user's financial goals?
                    If yes, write a short and sincere warning message in Turkish (max 2 sentences).
                    If no, write only "null".

                    Plain text or "null" only — no JSON.`;

    const raw = await generateText(prompt, null);

    if (!raw || raw.trim().toLowerCase() === 'null')
        return { warning: null };

    return { warning: raw.trim() };
};
