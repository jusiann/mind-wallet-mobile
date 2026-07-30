import { generateText } from '../../gemini.service.js';

// ═══════════════════════════════════════════════════════════════
//  Guardrail Node — LangGraph Node Function
//  Pre-checks (no Gemini call for most cases) + Gemini warning
// ═══════════════════════════════════════════════════════════════

export const guardrailNode = async (state) => {
    const { pendingData, context } = state;
    const { activeGoals, categories } = context;

    // Only fire for EXPENSE transactions
    if (!pendingData || pendingData.type !== 'transaction') return { warning: null };
    if (pendingData.transactionType !== 'EXPENSE') return { warning: null };
    // Find category metadata
    const catMeta = categories?.find((c) => c.name.toLowerCase() === pendingData.category?.toLowerCase());
    const isEssential = catMeta?.is_essential ?? null;

    // Essential categories never trigger warning
    if (isEssential === true) return { warning: null };

    // Check threshold 1: warn if expense > 30% of remaining on any goal
    const exceedsGoalThreshold = (activeGoals || []).some((g) => {
        const remaining = Number(g.target_amount) - Number(g.current_amount);
        return remaining > 0 && pendingData.amount > remaining * 0.30;
    });

    // Check threshold 2: warn if it's a massive amount (over 100k TRY)
    const isMassiveAmount = pendingData.amount >= 100000;

    if (!exceedsGoalThreshold && !isMassiveAmount) return { warning: null };

    // ── Gemini call for warning generation ──
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

    const categoryLine = `Category: ${pendingData.category}${isEssential !== null ? ` (${isEssential ? 'essential expense' : 'non-essential expense'})` : ''}`;

    const guardPrompt = `A user wants to make a new purchase.
Expense: ${pendingData.amount} TRY
${categoryLine}
Description: ${pendingData.description ?? 'None'}

Active financial goals:
${goalsJson}

Evaluation rules:
- Warn if the expense amount is unusually large, absurd, or likely a typo (e.g., spending millions on groceries).
- Warn if the expense amount consumes more than 30% of the remaining amount of any of the user's goals.
- If there are no goals and the expense is a perfectly reasonable daily amount, write "null".

Does this expense significantly threaten the user's financial goals or look like a mistake?
If yes, write a short and sincere warning message in Turkish (max 2 sentences).
If no, write only "null".

Plain text or "null" only — no JSON.`;

    const rawWarning = await generateText(guardPrompt, null);
    if (rawWarning && rawWarning.trim().toLowerCase() !== 'null') {
        return { warning: rawWarning.trim() };
    } else if (rawWarning === null) {
        // Fallback warnings if Gemini API fails
        if (isMassiveAmount) {
            return { warning: 'Bu tutar çok yüksek! Gerçekten bu harcamayı kaydetmek istediğine emin misin?' };
        }
        if (exceedsGoalThreshold) {
            return { warning: 'Bu harcama hedeflerini tehlikeye atabilir! Yine de kaydedelim mi?' };
        }
    }

    return { warning: null };
};
