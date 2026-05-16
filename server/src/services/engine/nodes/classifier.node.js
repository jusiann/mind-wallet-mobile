import { generateText } from '../../gemini.service.js';

export const classifierNode = async (state) => {
    const recentCtx = state.chatHistory.slice(-2)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const contextBlock = recentCtx ? `\nPrevious conversation context:\n${recentCtx}\n` : '';

    const prompt = `Classify the user message. Write only "ANALYSIS", "TRANSACTION", or "GOAL_CREATION", nothing else.
                    ANALYSIS: Spending analysis, budget review, savings advice, general questions, category reduction requests.
                    TRANSACTION: Attempts to record a new expense or income ("I spent X TRY", "I earned X TRY", etc.).
                    GOAL_CREATION: Requests to create a new financial goal ("I want to save X TRY", "create a goal", etc.).
                    ${contextBlock}
                    Message: "${state.currentInput}"`;

    const raw = await generateText(prompt, 'ANALYSIS');
    const upper = raw.trim().toUpperCase();

    const classification = upper.includes('TRANSACTION') ? 'TRANSACTION'
        : upper.includes('GOAL_CREATION') ? 'GOAL_CREATION'
        : 'ANALYSIS';

    return { classification };
};
