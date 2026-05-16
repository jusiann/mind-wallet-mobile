import { generateJSON } from '../../gemini.service.js';

export const extractorNode = async (state) => {
    const { classification, currentInput, categories } = state;

    const categoryNames = categories.map(c => c.name).join(', ');

    if (classification === 'TRANSACTION') {
        const prompt = `Extract transaction details from the user message.

                        Available categories: ${categoryNames || 'Food, Transportation, Entertainment, Shopping, Bills, Health, Other'}

                        Message: "${currentInput}"

                        Respond in the following JSON format (write nothing else):
                        {
                        "amount": <numeric TRY amount>,
                        "type": "EXPENSE" or "INCOME",
                        "category": "<closest match from available categories>",
                        "description": "<short description, max 100 characters>"
                        }

                        Rules:
                        - amount: number only, not a string
                        - type: spending/expense → "EXPENSE", income/earnings → "INCOME"
                        - category: must be one of the available categories
                        - If no amount in the message, return amount: 0`;

        const result = await generateJSON(prompt, null);

        if (!result || typeof result.amount !== 'number' || result.amount <= 0)
            return {
                pendingData: null,
                message: 'Could not understand the transaction amount. Example: "I spent 150 TRY on food"',
            };

        return {
            pendingData: {
                type: 'transaction',
                amount: result.amount,
                transactionType: result.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                category: result.category ?? 'Other',
                description: result.description ?? currentInput.slice(0, 100),
                timestamp: new Date().toISOString(),
            },
        };
    }

    if (classification === 'GOAL_CREATION') {
        const prompt = `Extract goal details from the user message.

                        Message: "${currentInput}"

                        Respond in the following JSON format (write nothing else):
                        {
                        "title": "<goal title, max 60 characters>",
                        "target_amount": <numeric TRY target amount>
                        }

                        Rules:
                        - title: short and meaningful title in Turkish
                        - target_amount: number only
                        - If no amount in the message, return target_amount: 0`;

        const result = await generateJSON(prompt, null);

        if (!result || typeof result.target_amount !== 'number' || result.target_amount <= 0)
            return {
                pendingData: null,
                message: 'Could not understand the goal amount. Example: "I want to save 5000 TRY for a vacation"',
            };

        return {
            pendingData: {
                type: 'goal',
                title: result.title ?? 'New Goal',
                target_amount: result.target_amount,
            },
        };
    }

    return { pendingData: null };
};
