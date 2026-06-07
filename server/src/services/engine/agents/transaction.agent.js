import { generateJSON } from '../../gemini.service.js';
import { toTR } from '../categoryMap.js';
import { runGuardRail } from '../guardrail.js';
import { NAV_BUTTONS, TX_CONFIRM_BUTTONS } from '../../../constants/engine.constants.js';

export const transactionAgent = async (ctx, input, chatHistory) => {
    const { categories, activeGoals } = ctx;
    const categoryNames = categories.map((c) => c.name).join(', ');

    const prompt = `Extract transaction details from the user message.
                    Available categories: ${categoryNames || 'Food, Transportation, Entertainment, Shopping, Bills, Health, Other'}
                    Message: "${input}"
                    Respond in the following JSON format (write nothing else):
                    {
                        "amount": <numeric TRY amount>,
                        "type": "EXPENSE" or "INCOME",
                        "category": "<closest match from available categories>",
                        "description": "<short description in Turkish, max 100 characters>"
                    }
                    Rules:
                    - amount: number only, not a string
                    - type: spending/expense → "EXPENSE", income/earnings → "INCOME"
                    - category: must be one of the available categories
                    - description: must be in Turkish
                    - If no amount in the message, return amount: 0`;

    const result = await generateJSON(prompt, null);

    if (!result || typeof result.amount !== 'number' || result.amount <= 0) {
        return {
            classification: 'TRANSACTION',
            message: 'İşlem tutarı anlaşılamadı. Örnek: "Markete 150 TL harcadım"',
            buttons: NAV_BUTTONS,
        };
    }

    const pendingData = {
        type: 'transaction',
        amount: result.amount,
        transactionType: result.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        category: result.category ?? 'Other',
        description: result.description ?? input.slice(0, 100),
        timestamp: new Date().toISOString(),
    };

    const catMeta = categories?.find((c) => c.name.toLowerCase() === pendingData.category.toLowerCase());
    const warning = await runGuardRail(activeGoals, {
        amount: pendingData.amount,
        type: pendingData.transactionType,
        category_name: pendingData.category,
        is_essential: catMeta?.is_essential ?? null,
        description: pendingData.description,
    });

    const categoryLabel = toTR(pendingData.category);
    const typeLabel = pendingData.transactionType === 'INCOME' ? 'gelir' : 'gider';

    let msg = warning
        ? `Uyarı: ${warning}\n\n${pendingData.amount.toLocaleString('tr-TR')} TL tutarındaki ${categoryLabel} ${typeLabel}ini yine de kaydedeyim mi?`
        : `${pendingData.amount.toLocaleString('tr-TR')} TL tutarındaki ${categoryLabel} ${typeLabel}ini kaydedeyim mi?`;

    if (pendingData.description && pendingData.description !== input) {
        msg += ` (${pendingData.description})`;
    }

    return {
        classification: 'TRANSACTION',
        message: msg,
        warning,
        buttons: TX_CONFIRM_BUTTONS(pendingData),
    };
};
