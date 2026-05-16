import { generateJSON } from '../../gemini.service.js';

const FALLBACK = {
    detectedSavings: 0,
    wastefulCategories: [],
    message: 'Not enough spending data found for analysis.',
};

export const analysisNode = async (state) => {
    const expenses = state.pastTransactions?.filter(t => t.type === 'EXPENSE') ?? [];

    if (expenses.length === 0)
        return { 
            ...FALLBACK, 
            label: 'Normal' 
        };
    

    const transactionsJson = JSON.stringify(
        expenses.map(t => ({
            amount: t.amount,
            category: t.category_name ?? 'Uncategorized',
            description: t.description ?? '',
            date: t.transaction_timestamp,
        })),
        null, 2,
    );

    const historyBlock = state.chatHistory.length
        ? `\nPrevious conversation:\n${state.chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n`
        : '';

    const categoryFocus = state.buttonPayload?.action === 'reduce_category'
        ? `\nThe user specifically wants to reduce the "${state.buttonPayload.category}" category. Focus on this category.\n`
        : '';

    const prompt = `User's spending history from the last 30 days:
                    ${transactionsJson}
                    ${historyBlock}${categoryFocus}
                    Current user message: "${state.currentInput}"

                    Analyze and respond in the following JSON format (write nothing else):
                    {
                    "detectedSavings": <estimated numeric value of how much can be saved monthly in TRY>,
                    "wastefulCategories": [
                        { "name": "<category name>", "amount": <total TRY spent>, "suggestion": "<short suggestion in Turkish>" }
                    ],
                    "message": "<Turkish summary, 1-2 sentences, conversational tone>"
                    }

                    Rules:
                    - wastefulCategories: top 3 most wasteful categories, empty array if none
                    - detectedSavings: realistic savings estimate, maximum 40% of total spending
                    - All numeric values must be numbers or decimals, not strings
                    - Provide a consistent response appropriate to the previous conversation context`;

    const result = await generateJSON(prompt, FALLBACK);

    const detectedSavings = typeof result.detectedSavings === 'number' ? result.detectedSavings : 0;
    const label = detectedSavings > 500 ? 'Opportunity' : 'Normal';

    return {
        detectedSavings,
        wastefulCategories: Array.isArray(result.wastefulCategories) ? result.wastefulCategories : [],
        message: result.message ?? FALLBACK.message,
        label,
    };
};
