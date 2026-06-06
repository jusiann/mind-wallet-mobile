import { generateText } from '../gemini.service.js';

export const runGuardRail = async (activeGoals, transaction) => {
    const { amount, type, category_name, is_essential, description } = transaction;

    if (type !== 'EXPENSE' || !activeGoals || activeGoals.length === 0) return null;
    if (is_essential === true) return null;

    const exceedsThreshold = activeGoals.some((g) => {
        const remaining = Number(g.target_amount) - Number(g.current_amount);
        return remaining > 0 && amount > remaining * 0.30;
    });

    if (!exceedsThreshold) return null;

    const goalsJson = JSON.stringify(
        activeGoals.map((g) => ({
            title: g.title,
            target: g.target_amount,
            current: g.current_amount,
            deadline: g.deadline,
            progress_pct: g.progress_pct,
        })),
        null, 2,
    );

    const categoryLine = `Category: ${category_name}${is_essential !== null ? ` (${is_essential ? 'essential expense' : 'non-essential expense'})` : ''}`;

    const guardPrompt = `A user wants to make a new purchase.
                    Expense: ${amount} TRY
                    ${categoryLine}
                    Description: ${description ?? 'None'}

                    Active financial goals:
                    ${goalsJson}

                    Evaluation rules:
                    - Warn if the expense amount consumes more than 30% of the remaining amount of any of the user's goals.
                    - If there are no goals or the expense seems reasonable, write "null".

                    Does this expense significantly threaten the user's financial goals?
                    If yes, write a short and sincere warning message in Turkish (max 2 sentences).
                    If no, write only "null".

                    Plain text or "null" only — no JSON.`;

    const rawWarning = await generateText(guardPrompt, null);
    if (rawWarning && rawWarning.trim().toLowerCase() !== 'null') {
        return rawWarning.trim();
    }

    return null;
};
